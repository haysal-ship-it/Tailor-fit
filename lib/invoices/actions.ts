"use server";
import { Resend } from "resend";
import { z } from "zod";
import {
  emailConfigured,
  invoiceError,
  InvoiceError,
  invoiceWithImages,
  loadInvoice,
} from "./server";
import { renderInvoice } from "./pdf";

export async function sendInvoice(raw: {
  orderId: string;
  fingerprint: string;
  requestId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const input = z
      .object({
        orderId: z.string().uuid(),
        fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        requestId: z.string().uuid(),
      })
      .parse(raw);
    const loaded = await loadInvoice(input.orderId);
    if (!emailConfigured())
      throw new InvoiceError(
        "Email sharing isn’t available yet. Download the PDF instead.",
        503,
      );
    if (loaded.fingerprint !== input.fingerprint)
      throw new InvoiceError(
        "Order details changed. Refresh the invoice preview before sending.",
        409,
      );
    const recipient = z.string().email().safeParse(loaded.model.client.email);
    if (!recipient.success)
      throw new InvoiceError("Add a valid client email before sending.");
    const bytes = await renderInvoice(await invoiceWithImages(loaded));
    // Recheck after image/PDF work so a stale preview is never silently substituted.
    if ((await loadInvoice(input.orderId)).fingerprint !== input.fingerprint)
      throw new InvoiceError(
        "Order details changed. Refresh the invoice preview before sending.",
        409,
      );
    const { data: reservation, error } = await loaded.db.rpc(
      "reserve_invoice_send",
      {
        p_request: input.requestId,
        p_order: input.orderId,
        p_fingerprint: input.fingerprint,
        p_recipient: recipient.data,
      },
    );
    if (error) {
      if (error.message.includes("RATE_LIMIT"))
        throw new InvoiceError(
          "Five invoices have already been requested for this order in the last hour. Please try later.",
          429,
        );
      if (error.message.includes("RETRY_EXPIRED"))
        throw new InvoiceError(
          "This send attempt is too old to retry safely. Check whether the client received it before preparing another invoice.",
          409,
        );
      throw new InvoiceError(
        "Could not reserve this send. Refresh the preview and retry.",
        409,
      );
    }
    if (reservation.status === "accepted") return { ok: true };
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send(
      {
        from: process.env.INVOICE_FROM_EMAIL!,
        to: recipient.data,
        subject: `Your TailorFit invoice — ${loaded.model.garment}`,
        text: `Hello ${loaded.model.client.name},\n\nYour TailorFit invoice for ${loaded.model.garment} is attached. It includes your order details, measurements, and style references.\n\nTailorFit`,
        attachments: [
          {
            filename: `tailorfit-invoice-${loaded.model.orderId}.pdf`,
            content: bytes,
          },
        ],
      },
      {
        idempotencyKey: `tailorfit-invoice/${loaded.user.id}/${input.requestId}`,
      },
    );
    if (result.error) {
      await loaded.db.rpc("finish_invoice_send", {
        p_request: input.requestId,
        p_lease: reservation.lease,
        p_provider: null,
        p_failed: true,
      });
      throw new InvoiceError(
        "The email provider could not accept the invoice. Retry this same request.",
        503,
      );
    }
    const finished = await loaded.db.rpc("finish_invoice_send", {
      p_request: input.requestId,
      p_lease: reservation.lease,
      p_provider: result.data!.id,
      p_failed: false,
    });
    if (finished.error)
      throw new InvoiceError(
        "The provider accepted the invoice, but its status could not be saved. Retry this same request to confirm without sending a duplicate.",
        503,
      );
    return { ok: true };
  } catch (error) {
    return { ok: false, error: invoiceError(error).message };
  }
}
