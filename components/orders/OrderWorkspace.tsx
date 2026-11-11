"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Check,
  ClipboardList,
  Download,
  PersonStanding,
  X,
} from "lucide-react";
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
import { formatDate, getOrderStatusPresentation } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Client, MeasurementSnapshot, Order, OrderStatus } from "@/types";

const button =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--outline)] px-4 text-sm font-medium hover:bg-[var(--chip)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] disabled:opacity-50";
const primary = `${button} border-transparent bg-[var(--primary)] text-white hover:opacity-90 hover:bg-[var(--primary)]`;

function formatOrderCode(id: string): string {
  if (!id) return "TF-00000";
  if (id.toUpperCase().startsWith("TF-")) return id.toUpperCase();
  const digits = id.replace(/\D/g, "");
  if (digits.length > 0) {
    return `TF-${digits.slice(-5).padStart(5, "0")}`;
  }
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return `TF-${clean.slice(-5).padStart(5, "0")}`;
}

function formatOrderPrice(amount: number | undefined, currency?: string): string {
  const symbolMap: Record<string, string> = {
    NGN: "₦",
    "₦": "₦",
    USD: "$",
    $: "$",
    GBP: "£",
    "£": "£",
    EUR: "€",
    "€": "€",
  };
  const sym = symbolMap[currency || ""] || currency || "₦";
  const num = typeof amount === "number" && !isNaN(amount) ? amount : 0;
  return `${sym}${num.toLocaleString("en-US")}`;
}

const SELECTABLE_STATUSES: {
  value: "Pending" | "Paused" | "Completed";
  label: string;
  description: string;
  dotClass: string;
  badgeBg: string;
}[] = [
  {
    value: "Pending",
    label: "Pending",
    description: "Order is active and queued or underway in the workroom.",
    dotClass: "bg-[#D97706]",
    badgeBg: "bg-[#FEF3C7] text-[#92400E]",
  },
  {
    value: "Paused",
    label: "Paused",
    description: "Work is temporarily on hold awaiting client fitting or fabric.",
    dotClass: "bg-[#F83437]",
    badgeBg: "bg-[#FEE2E2] text-[#B91C1C]",
  },
  {
    value: "Completed",
    label: "Completed",
    description: "Garment construction and finishing are complete.",
    dotClass: "bg-[#16A34A]",
    badgeBg: "bg-[#DCFCE7] text-[#15803D]",
  },
];

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
  const {
    orders,
    clients,
    snapshots,
    settings,
    isHydrated,
    deleteOrder,
    updateOrderStatus,
  } = useStore();
  const order = orders.find((o) => o.id === orderId);
  const client = clients.find((c) => c.id === (order?.clientId || clientId));
  const snapshot =
    snapshots.find(
      (s) => s.id === order?.measurementSnapshotId && s.clientId === client?.id,
    ) || snapshots.find((s) => s.clientId === client?.id);
  const [editing, setEditing] = useState(!orderId),
    [display, setDisplay] = useState<"diagram" | "list">("diagram");
  const [dialog, setDialog] = useState<"email" | "delete" | "status" | null>(
      null,
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const normalizeSelectableStatus = (
    s?: OrderStatus | string,
  ): "Pending" | "Paused" | "Completed" => {
    if (s === "Paused") return "Paused";
    if (s === "Completed" || s === "Ready" || s === "Picked Up")
      return "Completed";
    return "Pending";
  };
  const [selectedStatus, setSelectedStatus] = useState<
    "Pending" | "Paused" | "Completed"
  >(() => normalizeSelectableStatus(order?.status));

  useEffect(() => {
    if (order?.status) {
      setSelectedStatus(normalizeSelectableStatus(order.status));
    }
  }, [order?.status]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isMenuOpen]);

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
      <div className="py-8 flex flex-col gap-4 items-start">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-[4px] text-[#595959] hover:text-black transition-colors cursor-pointer"
        >
          <img
            src="/icons/order-details/arrow-u-up-left.svg"
            alt=""
            width={16}
            height={16}
            className="w-[16px] h-[16px] shrink-0"
          />
          <span className="text-[12px] font-normal leading-normal">Back</span>
        </button>
        <div>
          <h2 className="text-lg font-semibold">Order unavailable</h2>
          <p className="mt-2 text-sm text-[#595959]">
            This order was removed or is not in your workspace.
          </p>
        </div>
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

  const statusPres = getOrderStatusPresentation(
    order.status,
    order.pickupDateTime,
  );
  const numericMeasurements: Record<string, number> = {};
  if (snapshot?.measurements) {
    Object.entries(snapshot.measurements).forEach(([k, v]) => {
      const n = typeof v === "number" ? v : parseFloat(String(v));
      if (!isNaN(n) && n > 0) {
        numericMeasurements[k] = n;
      }
    });
  }

  return (
    <section
      aria-label="Order details"
      className="w-full bg-white rounded-[8px] p-[2px] flex flex-col gap-[2px]"
    >
      {/* Top Header: Back + Order Details */}
      <div className="w-full p-[16px] flex items-center justify-between">
        <div className="flex flex-col gap-[16px] items-start min-w-0 flex-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-[4px] text-[#595959] hover:text-black transition-colors cursor-pointer"
          >
            <img
              src="/icons/order-details/arrow-u-up-left.svg"
              alt=""
              width={16}
              height={16}
              className="w-[16px] h-[16px] shrink-0"
            />
            <span className="text-[12px] font-normal leading-normal">Back</span>
          </button>
          <h2 className="text-[16px] font-semibold leading-normal text-black">
            Order Details
          </h2>
        </div>
      </div>

      {/* Status/Error/Busy Notices */}
      {(error && !dialog) || notice || (busy && !dialog) ? (
        <div className="px-[16px] pb-2 flex flex-col gap-1">
          {error && !dialog && (
            <p role="alert" className="text-[12px] text-[#f83437] font-medium">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="text-[12px] text-[#1d49e8] font-medium">
              {notice}
            </p>
          )}
          {busy && !dialog && (
            <p role="status" className="text-[12px] text-[#595959]">
              Preparing PDF…
            </p>
          )}
        </div>
      ) : null}

      {/* Main Content Wrapper */}
      <div className="w-full p-[2px] flex flex-col gap-[2px] rounded-[8px]">
        {/* Garment Title Bar with 3-dots Option Dropdown */}
        <div className="bg-[#f8f8f8] rounded-[8px] px-[16px] py-[8px] flex items-center justify-between gap-[16px] w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <p className="text-[14px] font-medium leading-normal text-black truncate">
              {order.garmentType}
            </p>
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium text-[#1D1D1D] shrink-0"
              style={{ backgroundColor: statusPres.badgeColor }}
            >
              {statusPres.label}
            </span>
          </div>

          <div ref={menuRef} className="relative flex items-center shrink-0">
            <button
              type="button"
              aria-label="Order options"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              disabled={busy}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="bg-[#f2f2f2] hover:bg-[#e8e8e8] rounded-[32px] size-[40px] p-[4px] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <img
                src="/icons/order-details/dots-vertical.svg"
                alt=""
                width={24}
                height={24}
                className="w-[24px] h-[24px]"
              />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                aria-label="Order options"
                className="absolute right-0 top-[calc(100%+6px)] z-50 w-[157px] bg-white border border-[#eeecec] rounded-[8px] p-[2px] shadow-lg flex flex-col items-start"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setError("");
                    setNotice("");
                    setDialog("email");
                    void pdf();
                  }}
                  className="w-full p-[8px] rounded-[6px] flex items-center gap-[8px] hover:bg-[#f8f8f8] transition-colors cursor-pointer text-left"
                >
                  <img
                    src="/icons/order-details/share.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="w-[16px] h-[16px] shrink-0"
                  />
                  <span className="font-medium text-[12px] text-[#595959] whitespace-nowrap">
                    Share to email
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setError("");
                    setNotice("");
                    void pdf(true);
                  }}
                  className="w-full p-[8px] rounded-[6px] flex items-center gap-[8px] hover:bg-[#f8f8f8] transition-colors cursor-pointer text-left"
                >
                  <img
                    src="/icons/order-details/download.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="w-[16px] h-[16px] shrink-0"
                  />
                  <span className="font-medium text-[12px] text-[#595959] whitespace-nowrap">
                    Download PDF
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setError("");
                    setNotice("");
                    setSelectedStatus(normalizeSelectableStatus(order.status));
                    setDialog("status");
                  }}
                  className="w-full p-[8px] rounded-[6px] flex items-center gap-[8px] hover:bg-[#f8f8f8] transition-colors cursor-pointer text-left"
                >
                  <img
                    src="/icons/order-details/download.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="w-[16px] h-[16px] shrink-0"
                  />
                  <span className="font-medium text-[12px] text-[#595959] whitespace-nowrap">
                    Update status
                  </span>
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setError("");
                    setNotice("");
                    deleteVersion.current = order.version;
                    setDialog("delete");
                  }}
                  className="w-full p-[8px] rounded-[6px] flex items-center gap-[8px] hover:bg-[#fff5f5] transition-colors cursor-pointer text-left"
                >
                  <img
                    src="/icons/order-details/trash.svg"
                    alt=""
                    width={16}
                    height={16}
                    className="w-[16px] h-[16px] shrink-0"
                  />
                  <span className="font-medium text-[12px] text-[#f83437] whitespace-nowrap">
                    Delete order
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Two-Column Split: Left Order Metadata + Right Saved Measurements */}
        <div className="w-full bg-white p-[2px] rounded-[8px] flex flex-col lg:flex-row gap-[2px] items-start">
          {/* Left Column: Metadata + Style References */}
          <div className="w-full lg:flex-1 px-[12px] py-[24px] flex flex-col gap-[24px] self-stretch">
            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Order id
              </span>
              <span className="text-[14px] font-medium text-black text-right tabular-nums">
                {formatOrderCode(order.id)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Client Name:
              </span>
              <span className="text-[14px] font-medium text-black text-right">
                {client.name}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Phone Number:
              </span>
              <span className="text-[14px] font-medium text-black text-right tabular-nums">
                {client.phone || "Not provided"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Email Address:
              </span>
              <span className="text-[14px] font-medium text-black text-right break-all">
                {client.email || "Not provided"}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Price:{" "}
              </span>
              <span className="text-[14px] font-medium text-black text-right tabular-nums">
                {formatOrderPrice(
                  order.price,
                  order.currency || settings.currency,
                )}
              </span>
            </div>

            <div className="flex items-start justify-between gap-4 w-full leading-normal">
              <span className="text-[12px] font-normal text-[#a2a2a2] shrink-0">
                Due date:
              </span>
              <span className="text-[14px] font-medium text-black text-right tabular-nums">
                {order.pickupDateTime
                  ? formatDate(order.pickupDateTime, "/")
                  : "Not set"}
              </span>
            </div>

            <div className="flex flex-col gap-[8px] items-start w-full">
              <span className="text-[12px] font-normal text-[#a2a2a2] leading-normal">
                Style references:
              </span>
              <div className="grid grid-cols-3 gap-[8px] w-full">
                {order.referenceImages && order.referenceImages.length > 0 ? (
                  <>
                    {order.referenceImages.map((image, i) => (
                      <div
                        key={image.id || i}
                        className="bg-[#d9d9d9] h-[100px] rounded-[16px] overflow-hidden relative"
                      >
                        <Image
                          unoptimized
                          fill
                          src={image.url}
                          alt={image.title || `Style reference ${i + 1}`}
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {Array.from({
                      length: Math.max(0, 3 - order.referenceImages.length),
                    }).map((_, idx) => (
                      <div
                        key={`placeholder-${idx}`}
                        className="bg-[#d9d9d9] h-[100px] rounded-[16px]"
                      />
                    ))}
                  </>
                ) : (
                  <>
                    <div className="bg-[#d9d9d9] h-[100px] rounded-[16px]" />
                    <div className="bg-[#d9d9d9] h-[100px] rounded-[16px]" />
                    <div className="bg-[#d9d9d9] h-[100px] rounded-[16px]" />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Saved Measurements (Mannequin view / List view) */}
          <div className="w-full lg:w-[709px] bg-[#f8f8f8] rounded-[6px] p-[12px] flex flex-col gap-[25px] self-stretch shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-[8px]">
                <span className="text-[14px] font-bold text-black leading-normal whitespace-nowrap">
                  Saved measurements
                </span>
                <span className="size-[4px] rounded-full bg-[#a2a2a2] shrink-0" />
                <span className="text-[12px] lg:text-[14px] font-normal text-[#a2a2a2] leading-normal whitespace-nowrap">
                  {display === "diagram" ? "Mannequin view" : "List view"}
                </span>
              </div>

              {/* View Mode Switcher Pill */}
              <div
                className="bg-white p-[8px] rounded-[32px] flex items-center shrink-0"
                role="group"
                aria-label="Measurement display"
              >
                <div className="bg-[#f2f2f2] px-[8px] py-[6px] rounded-[24px] flex items-center gap-[4px]">
                  <button
                    type="button"
                    aria-label="Mannequin view"
                    aria-pressed={display === "diagram"}
                    onClick={() => setDisplay("diagram")}
                    className={cn(
                      "p-[4px] rounded-[32px] flex items-center justify-center transition-colors cursor-pointer",
                      display === "diagram"
                        ? "bg-[#1d49e8] text-white"
                        : "bg-white text-[#595959] hover:text-black",
                    )}
                  >
                    <PersonStanding className="size-[16px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="List view"
                    aria-pressed={display === "list"}
                    onClick={() => setDisplay("list")}
                    className={cn(
                      "p-[4px] rounded-[32px] flex items-center justify-center transition-colors cursor-pointer",
                      display === "list"
                        ? "bg-[#1d49e8] text-white"
                        : "bg-white text-[#595959] hover:text-black",
                    )}
                  >
                    <ClipboardList className="size-[16px]" />
                  </button>
                </div>
              </div>
            </div>

            {!snapshot ? (
              <div className="py-16 text-center flex-1 flex items-center justify-center">
                <p className="text-[14px] text-[#a2a2a2]">
                  Measurements not recorded for this order.
                </p>
              </div>
            ) : display === "diagram" ? (
              <div className="flex-1 flex items-center justify-center py-2">
                <RotatableMannequin
                  gender={snapshot.mannequinGender || "female"}
                  measurements={numericMeasurements}
                  activePointKeys={Object.keys(numericMeasurements)}
                  unit={snapshot.unit}
                  readOnly
                />
              </div>
            ) : (
              <MeasurementList snapshot={snapshot} />
            )}
          </div>
        </div>
      </div>

      {/* Update Status Modal (Paused, Pending, Completed) */}
      {dialog === "status" && (
        <ConfirmDialog
          title="Update Order Status"
          onClose={() => setDialog(null)}
          busy={busy}
        >
          <p className="text-[13px] text-[#595959] leading-relaxed mb-4">
            Choose the current workroom status for{" "}
            <span className="font-semibold text-black">{client.name}</span>’s{" "}
            <span className="font-semibold text-black">
              {order.garmentType}
            </span>{" "}
            order.
          </p>

          <div
            role="radiogroup"
            aria-label="Order status"
            className="flex flex-col gap-2.5"
          >
            {SELECTABLE_STATUSES.map((opt) => {
              const isSelected = selectedStatus === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={cn(
                    "w-full p-3.5 rounded-[12px] border text-left flex items-center justify-between gap-3 transition-all cursor-pointer",
                    isSelected
                      ? "border-[#1d49e8] bg-[#1d49e8]/[0.04]"
                      : "border-[#ededed] bg-[#f8f8f8] hover:bg-[#f2f2f2]",
                  )}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full shrink-0",
                          opt.dotClass,
                        )}
                      />
                      <span className="text-[14px] font-semibold text-black">
                        {opt.label}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#595959] leading-snug">
                      {opt.description}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "size-5 rounded-full flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-[#1d49e8] text-white"
                        : "border border-[#dddbdb] bg-white",
                    )}
                  >
                    {isSelected && <Check className="size-3 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <p role="alert" className="mt-3 text-[12px] text-[#f83437]">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDialog(null)}
              className="h-10 px-5 rounded-full bg-[#f2f2f2] border border-[#dddbdb] text-[13px] font-medium text-[#595959] hover:text-black hover:bg-[#e8e8e8] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  const ok = await updateOrderStatus(order.id, selectedStatus);
                  if (ok) {
                    setDialog(null);
                    setNotice(`Order status updated to ${selectedStatus}.`);
                    window.dispatchEvent(
                      new CustomEvent("tailorfit:notice", {
                        detail: `Order status updated to ${selectedStatus}.`,
                      }),
                    );
                  } else {
                    setError(
                      "Could not update status. Please check your connection and try again.",
                    );
                  }
                } finally {
                  setBusy(false);
                }
              }}
              className="h-10 px-6 rounded-full bg-[#1d49e8] text-white text-[13px] font-medium hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {busy ? "Updating…" : "Update Status"}
            </button>
          </div>
        </ConfirmDialog>
      )}

      {/* Delete Order Confirmation Dialog */}
      {dialog === "delete" && (
        <ConfirmDialog
          title="Delete Order?"
          onClose={() => setDialog(null)}
          busy={busy}
        >
          <p className="text-[13px] text-[#595959] leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-black">{client.name}</span>’s{" "}
            <span className="font-semibold text-black">
              {order.garmentType}
            </span>{" "}
            order? The client profile and saved measurements will remain. This
            action cannot be undone.
          </p>
          {error && (
            <p role="alert" className="mt-3 text-[12px] text-[#f83437]">
              {error}
            </p>
          )}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              className="h-10 px-5 rounded-full bg-[#f2f2f2] border border-[#dddbdb] text-[13px] font-medium text-[#595959] hover:text-black hover:bg-[#e8e8e8] transition-colors cursor-pointer"
              disabled={busy}
              onClick={() => setDialog(null)}
              autoFocus
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-10 px-6 rounded-full bg-[#f83437] text-white text-[13px] font-medium hover:bg-[#d92629] transition-colors cursor-pointer disabled:opacity-50"
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
              {busy ? "Deleting…" : "Delete Order"}
            </button>
          </div>
        </ConfirmDialog>
      )}

      {/* Share to Email / Review Invoice Dialog */}
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
  const entries = Object.entries(snapshot.measurements);
  return (
    <div className="flex flex-col items-start w-full text-[14px] leading-normal">
      {entries.map(([key, val]) => (
        <div
          key={key}
          className="bg-white border-b-[0.5px] border-[#ddd] border-solid px-[16px] py-[8px] flex items-start justify-between w-full"
        >
          <span className="font-normal text-[#a2a2a2]">
            {allHotspots.find((h) => h.key === key)?.label ||
              key.replaceAll("_", " ")}
          </span>
          <span className="font-medium text-black tabular-nums">
            {val === "" ? "Not recorded" : `${val}${snapshot.unit}`}
          </span>
        </div>
      ))}
      {!entries.length && (
        <p className="py-6 text-[14px] text-[#a2a2a2] w-full text-center">
          Measurements not recorded.
        </p>
      )}
    </div>
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
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => void cancel()}
          disabled={busy}
          className="flex items-center gap-[4px] text-[#595959] hover:text-black transition-colors cursor-pointer w-fit disabled:opacity-50"
        >
          <img
            src="/icons/order-details/arrow-u-up-left.svg"
            alt=""
            width={16}
            height={16}
            className="w-[16px] h-[16px] shrink-0"
          />
          <span className="text-[12px] font-normal leading-normal">Back</span>
        </button>
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
