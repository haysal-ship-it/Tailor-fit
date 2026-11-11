import type { Client, MeasurementSnapshot, Order } from "@/types";

export interface OrderPreviewPayload {
  order: Order;
  client: Pick<Client, "id" | "name" | "phone" | "email">;
  snapshot?: Pick<
    MeasurementSnapshot,
    "id" | "clientId" | "date" | "unit" | "garmentType" | "measurements" | "mannequinGender"
  > | null;
  currency?: string;
}

/**
 * Encodes an order, client, and snapshot into a compact base64url string
 * suitable for sharing via a preview URL query parameter (`?d=...`).
 * Data URLs exceeding 2KB are omitted from the URL query parameter to keep
 * the link short, while normal http(s)/relative image URLs are preserved.
 */
export function encodeOrderPreviewPayload(payload: OrderPreviewPayload): string {
  try {
    const safeImages = (payload.order.referenceImages || []).filter(
      (img) => img.url && (!img.url.startsWith("data:") || img.url.length < 2048),
    );
    const compact: OrderPreviewPayload = {
      order: {
        ...payload.order,
        referenceImages: safeImages,
      },
      client: {
        id: payload.client.id,
        name: payload.client.name,
        phone: payload.client.phone,
        email: payload.client.email,
      },
      snapshot: payload.snapshot
        ? {
            id: payload.snapshot.id,
            clientId: payload.snapshot.clientId,
            date: payload.snapshot.date,
            unit: payload.snapshot.unit,
            garmentType: payload.snapshot.garmentType,
            measurements: payload.snapshot.measurements,
            mannequinGender: payload.snapshot.mannequinGender,
          }
        : null,
      currency: payload.currency,
    };
    const json = JSON.stringify(compact);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return "";
  }
}

export function decodeOrderPreviewPayload(
  encoded: string | null | undefined,
): OrderPreviewPayload | null {
  if (!encoded) return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as OrderPreviewPayload;
    if (!parsed || typeof parsed !== "object" || !parsed.order || !parsed.client) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
