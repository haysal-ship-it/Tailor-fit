"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { useStore } from "@/lib/store";
import { useDraft } from "@/lib/drafts/use-draft";
import { RotatableMannequin } from "@/components/mannequin/RotatableMannequin";
import { ChoiceMenu } from "@/components/ui/ChoiceMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AnimatedFileUpload } from "@/components/ui/AnimatedFileUpload";
import { invoiceMoney } from "@/lib/invoices/model";
import { downloadBlob } from "@/lib/data/backup";
import { sendInvoice } from "@/lib/invoices/actions";
import type { Client, MeasurementSnapshot, Order, OrderStatus } from "@/types";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--outline)] px-4 text-sm font-medium hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50";
const primary = `${button} border-transparent bg-[var(--primary)] text-white hover:opacity-90 hover:bg-[var(--primary)]`;
type Props = {
  orderId?: string;
  clientId?: string;
  onBack: () => void;
  onSaved: (id: string, clientId: string) => void;
  onEditClient: (clientId: string) => void;
};
export function OrderWorkspace({
  orderId,
  clientId,
  onBack,
  onSaved,
  onEditClient,
}: Props) {
  const { orders, clients, snapshots, isHydrated, deleteOrder } = useStore();
  const order = orders.find((o) => o.id === orderId);
  const client = clients.find((c) => c.id === (order?.clientId || clientId));
  const snapshot = snapshots.find(
    (s) => s.id === order?.measurementSnapshotId && s.clientId === client?.id,
  );
  const [editing, setEditing] = useState(!orderId),
    [display, setDisplay] = useState("diagram");
  const [dialog, setDialog] = useState<"email" | "delete" | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [preview, setPreview] = useState<{
    fingerprint: string;
    recipient: string;
    subject: string;
    emailAvailable: boolean;
    url: string;
  } | null>(null);
  const deleteVersion = useRef<number | undefined>(undefined);
  const requestId = useRef("");
  const previewUrl = useRef("");
  const previewGeneration = useRef(0);
  useEffect(
    () => () => {
      previewGeneration.current++;
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );
  async function pdf(download = false) {
    if (!order) return;
    setBusy(true);
    setError("");
    const generation = ++previewGeneration.current;
    try {
      const base = `/api/orders/${order.id}/invoice`;
      if (download) {
        const reviewed =
          dialog === "email" && preview
            ? `&fingerprint=${preview.fingerprint}`
            : "";
        const response = await fetch(`${base}?download=1${reviewed}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error((await response.json()).error);
        downloadBlob(
          await response.blob(),
          `tailorfit-invoice-${order.id}.pdf`,
        );
      } else {
        setPreview(null);
        const info = await fetch(`${base}?format=json`, { cache: "no-store" });
        if (!info.ok) throw new Error((await info.json()).error);
        const metadata = await info.json();
        const response = await fetch(
          `${base}?fingerprint=${metadata.fingerprint}`,
          { cache: "no-store" },
        );
        if (!response.ok) throw new Error((await response.json()).error);
        const blob = await response.blob();
        if (generation !== previewGeneration.current) return;
        if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
        previewUrl.current = URL.createObjectURL(blob);
        requestId.current = crypto.randomUUID();
        setPreview({ ...metadata, url: previewUrl.current });
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not prepare the invoice. Retry.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!isHydrated) return <p role="status">Loading order…</p>;
  if (
    orderId &&
    (!order || !client || (clientId && clientId !== order.clientId))
  )
    return (
      <div className="py-8">
        <h2 className="text-lg font-semibold">Order unavailable</h2>
        <p className="my-3">
          This order was removed or is not in your workspace.
        </p>
        <button className={button} onClick={onBack}>
          Back to order history
        </button>
      </div>
    );
  if (editing)
    return (
      <OrderEditor
        order={order}
        clientId={client?.id}
        snapshot={snapshot}
        onCancel={() => (order ? setEditing(false) : onBack())}
        onSaved={(id, cid) => {
          setEditing(false);
          onSaved(id, cid);
        }}
        onEditClient={onEditClient}
      />
    );
  if (!order || !client) return null;
  return (
    <section aria-label="Order details" className="min-w-0 space-y-5">
      <button className={`${button} border-transparent px-0`} onClick={onBack}>
        <ArrowLeft size={16} />
        Back to order history
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{order.garmentType}</h2>
          <p className="mt-1 text-sm text-[var(--text-2)]">{order.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={button} onClick={() => setEditing(true)}>
            <Pencil size={15} />
            Edit order
          </button>
          <ChoiceMenu
            kind="menu"
            placeholder="Options"
            options={[
              { value: "email", label: "Share to email" },
              { value: "download", label: "Download PDF" },
              { value: "delete", label: "Delete order", destructive: true },
            ]}
            onChoose={(choice) => {
              setError("");
              setNotice("");
              if (choice === "download") void pdf(true);
              else if (choice === "email") {
                setDialog("email");
                void pdf();
              } else {
                deleteVersion.current = order.version;
                setDialog("delete");
              }
            }}
            disabled={busy}
          />
        </div>
      </div>
      {error && !dialog && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-[var(--primary)]">
          {notice}
        </p>
      )}
      {busy && !dialog && <p role="status">Preparing PDF…</p>}
      <div className="grid min-w-0 gap-1 rounded-lg bg-[var(--surface)] p-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-6 p-4 sm:p-5">
          <ClientSummary
            client={client}
            onEdit={() => onEditClient(client.id)}
          />
          <dl className="space-y-3 text-sm">
            <Detail
              label="Price"
              value={invoiceMoney(order.price, order.currency || "")}
            />
            <Detail
              label="Due date"
              value={
                order.pickupDateTime
                  ? new Date(order.pickupDateTime).toLocaleDateString("en-GB")
                  : "Not set"
              }
            />
          </dl>
          {order.notes && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Internal notes</h3>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-2)]">
                {order.notes}
              </p>
            </div>
          )}
        </div>
        <div className="min-w-0 rounded-lg bg-[var(--card)] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Saved measurements</h3>
            <div className="flex gap-1" aria-label="Measurement display">
              <button
                className={button}
                aria-pressed={display === "diagram"}
                onClick={() => setDisplay("diagram")}
              >
                Diagram
              </button>
              <button
                className={button}
                aria-pressed={display === "list"}
                onClick={() => setDisplay("list")}
              >
                List
              </button>
            </div>
          </div>
          {!snapshot ? (
            <p className="py-8 text-sm text-[var(--text-2)]">
              Measurements not recorded for this order.
            </p>
          ) : display === "diagram" && snapshot.mannequinGender ? (
            <RotatableMannequin
              gender={snapshot.mannequinGender}
              measurements={snapshot.measurements}
              activePointKeys={Object.keys(snapshot.measurements)}
              unit={snapshot.unit}
              readOnly
            />
          ) : (
            <MeasurementList snapshot={snapshot} />
          )}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold">Style references</h3>
        {order.referenceImages.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {order.referenceImages.map((image, i) => (
              <figure
                key={image.id}
                className="min-w-0 rounded-lg bg-[var(--surface)] p-3"
              >
                <Image
                  unoptimized
                  width={600}
                  height={400}
                  src={image.url}
                  alt={image.title || `Style reference ${i + 1}`}
                  className="h-52 w-full rounded-md object-contain"
                />
                <figcaption className="mt-2 break-words text-sm">
                  {image.title || `Style reference ${i + 1}`}
                  {image.note && (
                    <p className="mt-1 text-[var(--text-2)]">{image.note}</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-2)]">No reference images.</p>
        )}
      </div>
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete this order?"
          onClose={() => setDialog(null)}
          busy={busy}
        >
          <p className="text-sm leading-relaxed">
            Delete {client.name}’s {order.garmentType} order? The client and
            saved measurements will remain. This cannot be undone.
          </p>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <button
              className={button}
              disabled={busy}
              onClick={() => setDialog(null)}
              autoFocus
            >
              Cancel
            </button>
            <button
              className={`${button} bg-red-700 text-white hover:bg-red-800`}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  if (await deleteOrder(order.id, deleteVersion.current)) {
                    setDialog(null);
                    onBack();
                    window.dispatchEvent(
                      new CustomEvent("tailorfit:notice", {
                        detail: "Order deleted.",
                      }),
                    );
                  } else
                    setError(
                      "The order could not be deleted. Reload saved records and retry.",
                    );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Deleting…" : "Delete order"}
            </button>
          </div>
        </ConfirmDialog>
      )}
      {dialog === "email" && (
        <ConfirmDialog
          title="Review invoice"
          onClose={() => {
            previewGeneration.current++;
            setDialog(null);
          }}
          busy={busy}
        >
          {error && (
            <p role="alert" className="mb-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {busy && !preview && <p role="status">Preparing invoice preview…</p>}
          {preview && (
            <>
              <p className="break-words text-sm">
                <strong>To:</strong> {preview.recipient}
              </p>
              <p className="mt-2 text-sm">
                <strong>Subject:</strong> {preview.subject}
              </p>
              <p className="my-3 text-sm text-[var(--text-2)]">
                This invoice includes the client’s measurements and reference
                images.
              </p>
              <object
                data={preview.url}
                type="application/pdf"
                aria-label="Invoice PDF preview"
                className="h-[45dvh] w-full rounded-lg border border-[var(--outline)]"
              >
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Open invoice preview
                </a>
              </object>
              <a
                href={preview.url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex min-h-11 items-center text-sm underline"
              >
                Open full PDF preview
              </a>
              {!preview.emailAvailable && (
                <p className="my-3 text-sm">
                  Email sharing isn’t available yet. You can still download the
                  PDF.
                </p>
              )}
            </>
          )}
          {!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email) && (
            <p className="my-3 text-sm">
              Add a valid client email before sending.{" "}
              <button
                className="underline"
                onClick={() => {
                  setDialog(null);
                  onEditClient(client.id);
                }}
              >
                Add client email
              </button>
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              className={button}
              disabled={busy}
              onClick={() => setDialog(null)}
            >
              Cancel
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => void pdf()}
            >
              Refresh preview
            </button>
            <button
              className={button}
              disabled={busy || !preview}
              onClick={() => void pdf(true)}
            >
              <Download size={15} />
              Download PDF
            </button>
            <button
              className={primary}
              disabled={
                busy ||
                !preview?.emailAvailable ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email)
              }
              onClick={async () => {
                if (!preview) return;
                setBusy(true);
                setError("");
                try {
                  const result = await sendInvoice({
                    orderId: order.id,
                    fingerprint: preview.fingerprint,
                    requestId: requestId.current,
                  });
                  if (!result.ok) throw new Error(result.error);
                  setNotice("Invoice accepted for sending.");
                  setDialog(null);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Could not send. Retry.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Please wait…" : "Send invoice"}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </section>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
      <dt className="text-[var(--text-2)]">{label}</dt>
      <dd className="min-w-0 break-words font-medium">{value}</dd>
    </div>
  );
}
function ClientSummary({
  client,
  onEdit,
}: {
  client: Client;
  onEdit: () => void;
}) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">Client details</h3>
      <dl className="space-y-3 text-sm">
        <Detail label="Name" value={client.name} />
        <Detail label="Phone" value={client.phone || "Not provided"} />
        <Detail label="Email" value={client.email || "Not provided"} />
      </dl>
      <button
        type="button"
        className="mt-2 min-h-11 text-sm text-[var(--primary)] underline"
        onClick={onEdit}
      >
        Edit client details
      </button>
    </div>
  );
}
function MeasurementList({ snapshot }: { snapshot: MeasurementSnapshot }) {
  const { allHotspots } = useStore();
  return (
    <dl className="divide-y divide-[var(--outline)]">
      {Object.entries(snapshot.measurements).map(([key, val]) => (
        <div
          key={key}
          className="flex flex-wrap justify-between gap-3 py-3 text-sm"
        >
          <dt>
            {allHotspots.find((h) => h.key === key)?.label ||
              key.replaceAll("_", " ")}
          </dt>
          <dd className="font-medium">
            {val === "" ? "Not recorded" : `${val} ${snapshot.unit}`}
          </dd>
        </div>
      ))}
      {!Object.keys(snapshot.measurements).length && (
        <p className="py-6 text-sm">Measurements not recorded.</p>
      )}
    </dl>
  );
}

function OrderEditor({
  order,
  clientId,
  snapshot,
  onCancel,
  onSaved,
  onEditClient,
}: {
  order?: Order;
  clientId?: string;
  snapshot?: MeasurementSnapshot;
  onCancel: () => void;
  onSaved: (id: string, clientId: string) => void;
  onEditClient: (clientId: string) => void;
}) {
  const store = useStore();
  const [chosenClient, setChosenClient] = useState(
    order?.clientId || clientId || "",
  );
  const client = store.clients.find((c) => c.id === chosenClient);
  const [garment, setGarment] = useState(order?.garmentType || ""),
    [price, setPrice] = useState(String(order?.price ?? "")),
    [due, setDue] = useState(order?.pickupDateTime?.slice(0, 10) || ""),
    [notes, setNotes] = useState(order?.notes || "");
  const [status, setStatus] = useState<OrderStatus>(
    order?.status || "In Progress",
  );
  const [fittingId, setFittingId] = useState(snapshot?.id || ""),
    [measurements, setMeasurements] = useState<Record<string, number | string>>(
      snapshot?.measurements || {},
    );
  const [gender, setGender] = useState<"female" | "male">(
      snapshot?.mannequinGender || "female",
    ),
    [unit, setUnit] = useState(snapshot?.unit || store.settings.defaultUnit);
  const [images, setImages] = useState(order?.referenceImages || []),
    [point, setPoint] = useState<string | null>(null),
    [pointValue, setPointValue] = useState("");
  const [version, setVersion] = useState(order?.version);
  const [currency] = useState(order?.currency || store.settings.currency || "");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const leaveApproved = useRef(false);
  const data = {
    chosenClient,
    garment,
    price,
    due,
    notes,
    status,
    fittingId,
    measurements,
    gender,
    unit,
    images,
    version,
  };
  const [original, setOriginal] = useState(() => JSON.stringify(data));
  const dirty = JSON.stringify(data) !== original;
  const draft = useDraft(
    `order:${order?.id || clientId || "new"}`,
    data,
    (d) => {
      setChosenClient(
        order?.clientId || clientId || String(d.chosenClient || ""),
      );
      setGarment(String(d.garment || ""));
      setPrice(String(d.price || ""));
      setDue(String(d.due || ""));
      setNotes(String(d.notes || ""));
      setStatus(d.status as OrderStatus);
      setFittingId(String(d.fittingId || ""));
      setMeasurements(
        (d.measurements || {}) as Record<string, number | string>,
      );
      setGender(d.gender === "male" ? "male" : "female");
      setUnit(d.unit === "in" ? "in" : "cm");
      setImages((d.images || []) as Order["referenceImages"]);
      setVersion(d.version as number | undefined);
    },
    dirty,
  );
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty && !leaveApproved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const nav = (e: Event) => {
      if (
        dirty &&
        !leaveApproved.current &&
        !window.confirm(
          "Leave this order with unsaved changes? Your draft will remain on this device.",
        )
      )
        e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener("tailorfit:before-navigation", nav);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener("tailorfit:before-navigation", nav);
    };
  }, [dirty]);
  const chooseFitting = (id: string) => {
    setFittingId(id);
    const fitting = store.snapshots.find(
      (s) => s.id === id && s.clientId === chosenClient,
    );
    setMeasurements(fitting?.measurements || {});
    setGender(fitting?.mannequinGender || "female");
    setUnit(fitting?.unit || store.settings.defaultUnit);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !draft.loaded) return;
    setError("");
    if (
      !client ||
      !garment.trim() ||
      price.trim() === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      setError(
        "Choose a client, enter a garment, and provide a price of zero or more.",
      );
      return;
    }
    setBusy(true);
    try {
      await draft.flush().catch(() => {});
      const linked = store.snapshots.find(
        (s) => s.id === fittingId && s.clientId === client.id,
      );
      const changed =
        JSON.stringify(linked?.measurements || {}) !==
          JSON.stringify(measurements) ||
        (!!linked &&
          (linked.unit !== unit || linked.mannequinGender !== gender));
      const result = await store.saveIntake({
        requestId: draft.getId(),
        client,
        snapshot:
          (changed || !linked) && Object.keys(measurements).length
            ? {
                date: new Date().toISOString().slice(0, 10),
                unit,
                mannequinGender: gender,
                garmentType: garment.trim(),
                measurements,
              }
            : undefined,
        order: {
          ...order,
          id: order?.id,
          version,
          garmentType: garment.trim(),
          measurementSnapshotId: Object.keys(measurements).length
            ? linked?.id
            : undefined,
          referenceImages: images,
          price: Number(price),
          currency,
          status,
          pickupDateTime: due ? `${due}T12:00:00Z` : "",
          notes,
        },
      });
      if (!result) {
        setError(
          "Not saved. Your draft is still here. Check the workspace message and retry.",
        );
        return;
      }
      await draft.discard();
      leaveApproved.current = true;
      setOriginal(JSON.stringify(data));
      onSaved(result.orderId, result.clientId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Not saved. Please retry.");
    } finally {
      setBusy(false);
    }
  };
  const cancel = async () => {
    if (dirty && !window.confirm("Discard these unsaved order changes?"))
      return;
    await draft.discard();
    leaveApproved.current = true;
    setOriginal(JSON.stringify(data));
    onCancel();
  };
  return (
    <form
      onSubmit={save}
      className="space-y-5"
      aria-label={order ? "Edit order" : "New order"}
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {order ? "Edit order" : "New order"}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            className={button}
            onClick={() => void cancel()}
            disabled={busy}
          >
            Cancel
          </button>
          <button className={primary} disabled={busy || !draft.loaded}>
            {busy ? "Saving…" : order ? "Save changes" : "Save order"}
          </button>
        </div>
      </div>
      {(error || draft.warning) && (
        <p role="alert" className="text-sm text-red-700">
          {error || draft.warning}
        </p>
      )}
      <div className="grid gap-1 rounded-lg bg-[var(--surface)] p-1 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-5 p-4 sm:p-5">
          {!clientId && !order && (
            <ChoiceMenu
              label="Client"
              placeholder="Choose a client"
              options={store.clients.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              value={chosenClient}
              onChoose={(id) => {
                setChosenClient(id);
                setFittingId("");
                setMeasurements({});
              }}
            />
          )}
          {client && (
            <ClientSummary
              client={client}
              onEdit={() => onEditClient(client.id)}
            />
          )}
          <Input
            label="Garment"
            value={garment}
            onChange={(e) => setGarment(e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={`Price (${currency || "currency not set"})`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
            <Input
              label="Due date"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <ChoiceMenu
            label="Order status"
            value={status}
            options={[
              "Pending",
              "In Progress",
              "Paused",
              "Completed",
              "Ready",
              "Picked Up",
            ].map((v) => ({ value: v, label: v }))}
            onChoose={(v) => setStatus(v as OrderStatus)}
          />
          <Textarea
            label="Internal notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            helperText="Not included in the invoice."
          />
        </div>
        <div className="min-w-0 space-y-4 rounded-lg bg-[var(--card)] p-4 sm:p-5">
          <ChoiceMenu
            label="Saved measurements"
            value={fittingId}
            options={[
              { value: "", label: "No saved fitting" },
              ...store.snapshots
                .filter((s) => s.clientId === chosenClient)
                .map((s) => ({
                  value: s.id,
                  label: `${s.garmentType} · ${s.date}`,
                })),
            ]}
            onChoose={chooseFitting}
          />
          <ChoiceMenu
            label="Garment blueprint"
            placeholder="Choose measurement fields"
            options={store.settings.templates.map((template) => ({
              value: template.id,
              label: template.name,
            }))}
            onChoose={(id) => {
              const template = store.settings.templates.find(
                (item) => item.id === id,
              );
              if (!template) return;
              setFittingId("");
              setMeasurements(
                Object.fromEntries(
                  template.fieldKeys.map((key) => [
                    key,
                    measurements[key] ?? "",
                  ]),
                ),
              );
              if (!garment.trim()) setGarment(template.name);
            }}
          />
          <RotatableMannequin
            gender={gender}
            onGenderChange={setGender}
            showGenderToggle
            measurements={measurements}
            activePointKeys={Object.keys(measurements)}
            unit={unit}
            onSelectPoint={(key) => {
              setPoint(key);
              setPointValue(String(measurements[key] ?? ""));
            }}
          />
          <ChoiceMenu
            label="Add a measurement"
            value=""
            placeholder="Choose measurement point"
            options={store.allHotspots
              .filter((h) => !(h.key in measurements))
              .map((h) => ({ value: h.key, label: h.label }))}
            onChoose={(key) => {
              setPoint(key);
              setPointValue("");
            }}
          />
          <div className="space-y-3" aria-label="Edit measurement list">
            {Object.entries(measurements).map(([key, value]) => (
              <div
                key={key}
                className="flex min-w-0 items-center justify-between gap-3 text-sm"
              >
                <span>
                  {store.allHotspots.find((h) => h.key === key)?.label ||
                    key.replaceAll("_", " ")}
                </span>
                <button
                  type="button"
                  className={button}
                  onClick={() => {
                    setPoint(key);
                    setPointValue(String(value));
                  }}
                >
                  {value === "" ? "Set size" : `${value} ${unit}`}
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-2)]">
            Sizes are in {unit}. Changed sizes are saved as a new fitting,
            preserving the original.
          </p>
        </div>
      </div>
      <AnimatedFileUpload
        images={images.map((i) => i.url)}
        onChange={(urls) =>
          setImages(
            urls.map(
              (url, i) =>
                images.find((image) => image.url === url) || {
                  id: crypto.randomUUID(),
                  url,
                  title: `Style reference ${i + 1}`,
                },
            ),
          )
        }
      />
      {images.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image, index) => (
            <div key={image.id} className="space-y-3">
              <Input
                label={`Reference ${index + 1} title`}
                value={image.title || ""}
                onChange={(e) =>
                  setImages((previous) =>
                    previous.map((item) =>
                      item.id === image.id
                        ? { ...item, title: e.target.value }
                        : item,
                    ),
                  )
                }
              />
              <Textarea
                label={`Reference ${index + 1} caption`}
                value={image.note || ""}
                onChange={(e) =>
                  setImages((previous) =>
                    previous.map((item) =>
                      item.id === image.id
                        ? { ...item, note: e.target.value }
                        : item,
                    ),
                  )
                }
                rows={2}
              />
            </div>
          ))}
        </div>
      )}
      {point && (
        <ConfirmDialog
          title={`Set ${store.allHotspots.find((h) => h.key === point)?.label || point}`}
          onClose={() => setPoint(null)}
        >
          <Input
            label={`Size (${unit})`}
            type="number"
            min="0"
            step="0.1"
            value={pointValue}
            onChange={(e) => setPointValue(e.target.value)}
            autoFocus
          />
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className={button}
              onClick={() => setPoint(null)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={button}
              onClick={() => {
                setMeasurements((prev) => {
                  const next = { ...prev };
                  delete next[point];
                  return next;
                });
                setPoint(null);
              }}
            >
              Remove point
            </button>
            <button
              type="button"
              className={primary}
              disabled={
                pointValue === "" ||
                !Number.isFinite(Number(pointValue)) ||
                Number(pointValue) < 0
              }
              onClick={() => {
                setMeasurements((prev) => ({
                  ...prev,
                  [point]: Number(pointValue),
                }));
                setPoint(null);
              }}
            >
              Apply size
            </button>
          </div>
        </ConfirmDialog>
      )}
    </form>
  );
}
