import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import sharp from "sharp";
import { serverSupabase } from "@/lib/supabase/server";
import { DEFAULT_HOTSPOTS, resolveCanonicalKey } from "@/lib/initial-data";
import { MANNEQUIN_LANDMARKS_3D } from "@/lib/mannequin-landmarks";
import type { Client, MeasurementSnapshot, Order, AppSettings } from "@/types";
import type { InvoiceModel } from "./model";

export class InvoiceError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const emailConfigured = () =>
  !!(
    process.env.RESEND_API_KEY &&
    process.env.INVOICE_FROM_EMAIL &&
    process.env.INVOICE_EMAIL_ENABLED === "true"
  );
export async function loadInvoice(orderId: string) {
  if (!z.string().uuid().safeParse(orderId).success)
    throw new InvoiceError("Order not found.", 404);
  const db = await serverSupabase();
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user)
    throw new InvoiceError("Sign in to view this invoice.", 401);
  const { data: row, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("owner_id", auth.user.id)
    .maybeSingle();
  if (error || !row) throw new InvoiceError("Order not found.", 404);
  const order = row.data as Order;
  const { data: clientRow } = await db
    .from("clients")
    .select("*")
    .eq("id", order.clientId)
    .eq("owner_id", auth.user.id)
    .single();
  if (!clientRow)
    throw new InvoiceError(
      "The client record is unavailable. Reload and retry.",
      409,
    );
  const client = clientRow.data as Client;
  let snapshot: MeasurementSnapshot | null = null;
  let snapshotVersion = 0;
  if (order.measurementSnapshotId) {
    const { data: s } = await db
      .from("measurement_snapshots")
      .select("*")
      .eq("id", order.measurementSnapshotId)
      .eq("owner_id", auth.user.id)
      .eq("client_id", order.clientId)
      .maybeSingle();
    if (!s)
      throw new InvoiceError(
        "The saved fitting changed. Reload the order and retry.",
        409,
      );
    snapshot = s.data as MeasurementSnapshot;
    snapshotVersion = s.version;
  }
  const { data: settingsRow } = await db
    .from("studio_settings")
    .select("data,version")
    .eq("id", auth.user.id)
    .maybeSingle();
  const settings = settingsRow?.data as AppSettings | undefined;
  const labels = new Map(
    [...DEFAULT_HOTSPOTS, ...(settings?.customFields || [])].map((h) => [
      h.key,
      h.label,
    ]),
  );
  const gender = snapshot?.mannequinGender || null;
  const canonical = Object.fromEntries(
    Object.entries(snapshot?.measurements || {}).map(([key, value]) => [
      resolveCanonicalKey(key),
      value,
    ]),
  );
  const measurements = Object.entries(canonical).map(([key, value], i) => {
    const point = MANNEQUIN_LANDMARKS_3D.find((p) => p.key === key);
    const x = point ? (gender === "male" ? point.x3dMale : point.x3dFemale) : 0;
    return {
      key,
      label:
        gender === "male" && point?.maleLabel
          ? point.maleLabel
          : labels.get(key) || key.replaceAll("_", " "),
      value: value === "" ? "Not recorded" : String(value),
      unit: snapshot?.unit || "",
      number: i + 1,
      front:
        point && gender && point.visibleViews.includes(0)
          ? { x: 318 + x, y: point.y }
          : undefined,
      back:
        point && gender && point.visibleViews.includes(180)
          ? { x: 318 - x, y: point.y }
          : undefined,
    };
  });
  const images = (order.referenceImages || []).map((image, i) => {
    if (
      !image.storagePath ||
      !image.storagePath.startsWith(`${auth.user!.id}/`) ||
      image.storagePath.includes("..")
    )
      throw new InvoiceError(
        "A reference image is unavailable. Reattach it and save before creating the invoice.",
        409,
      );
    return {
      path: image.storagePath,
      title: image.title || `Style reference ${i + 1}`,
      caption: image.note || "",
    };
  });
  const model: InvoiceModel = {
    orderId,
    reference: `TF-${orderId.toUpperCase()}`,
    issuedAt: row.created_at,
    garment: order.garmentType,
    client: {
      name: client.name,
      phone: client.phone || "Not provided",
      email: client.email || "Not provided",
    },
    price: order.price,
    currency: order.currency || "",
    dueDate: order.pickupDateTime || "",
    gender,
    measurements,
    images,
  };
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        model,
        orderVersion: row.version,
        clientVersion: clientRow.version,
        snapshotVersion,
        settingsVersion: settingsRow?.version,
      }),
    )
    .digest("hex");
  return { db, user: auth.user, model, fingerprint };
}
export async function invoiceWithImages(
  loaded: Awaited<ReturnType<typeof loadInvoice>>,
) {
  const model = structuredClone(loaded.model);
  for (const image of model.images) {
    const { data: metadata } = await loaded.db
      .from("attachments")
      .select("id")
      .eq("owner_id", loaded.user.id)
      .eq("object_path", image.path)
      .maybeSingle();
    if (!metadata)
      throw new InvoiceError(
        "A reference image is unavailable. Reload the order and retry.",
        409,
      );
    const { data, error } = await loaded.db.storage
      .from("workspace-images")
      .download(image.path);
    if (error || !data)
      throw new InvoiceError(
        "Could not load every reference image. Reconnect and retry.",
        503,
      );
    if (data.size > 5242880)
      throw new InvoiceError(
        "A reference image exceeds 5 MB. Replace it and retry.",
        409,
      );
    try {
      image.bytes = await sharp(Buffer.from(await data.arrayBuffer()), {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch {
      throw new InvoiceError(
        "A reference image could not be processed. Replace it and retry.",
        409,
      );
    }
  }
  return model;
}
export function invoiceError(error: unknown) {
  return {
    message:
      error instanceof InvoiceError
        ? error.message
        : "The invoice could not be prepared. Please retry.",
    status: error instanceof InvoiceError ? error.status : 500,
  };
}
