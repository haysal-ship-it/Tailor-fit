import { NextRequest, NextResponse } from "next/server";
import {
  emailConfigured,
  invoiceError,
  InvoiceError,
  invoiceWithImages,
  loadInvoice,
} from "@/lib/invoices/server";
import { renderInvoice } from "@/lib/invoices/pdf";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const loaded = await loadInvoice((await params).id);
    const expected = request.nextUrl.searchParams.get("fingerprint");
    if (expected && expected !== loaded.fingerprint)
      throw new InvoiceError(
        "Order details changed. Refresh the invoice preview before continuing.",
        409,
      );
    if (request.nextUrl.searchParams.get("format") === "json")
      return NextResponse.json(
        {
          fingerprint: loaded.fingerprint,
          recipient: loaded.model.client.email,
          subject: `Your TailorFit invoice — ${loaded.model.garment}`,
          emailAvailable: emailConfigured(),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    const bytes = await renderInvoice(await invoiceWithImages(loaded));
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${request.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="tailorfit-invoice-${loaded.model.orderId}.pdf"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const error = invoiceError(e);
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
