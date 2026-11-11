import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { renderInvoice } from "../lib/invoices/pdf";
import { invoiceMoney, type InvoiceModel } from "../lib/invoices/model";
import { MANNEQUIN_LANDMARKS_3D } from "../lib/mannequin-landmarks";

async function main() {
  const out = path.resolve("project-memory/order-workspace-evidence");
  await fs.mkdir(out, { recursive: true });
  assert.equal(invoiceMoney(12500, "₦"), "NGN 12,500.00");
  assert.equal(invoiceMoney(12.5, "€"), "EUR 12.50");
  for (const gender of ["female", "male"] as const) {
    const measurements = MANNEQUIN_LANDMARKS_3D.map((p, i) => ({
      key: p.key,
      label: gender === "male" && p.maleLabel ? p.maleLabel : p.label,
      value: String(30 + i),
      unit: gender === "male" ? "in" : "cm",
      number: i + 1,
      front: p.visibleViews.includes(0)
        ? { x: 318 + (gender === "male" ? p.x3dMale : p.x3dFemale), y: p.y }
        : undefined,
      back: p.visibleViews.includes(180)
        ? { x: 318 - (gender === "male" ? p.x3dMale : p.x3dFemale), y: p.y }
        : undefined,
    }));
    const model: InvoiceModel = {
      orderId: "11111111-1111-4111-8111-111111111111",
      reference: "TF-11111111-1111-4111-8111-111111111111",
      issuedAt: "2026-11-08T12:00:00Z",
      garment: "Bespoke occasion outfit",
      client: {
        name: "Sample Client — invoice layout test",
        phone: "+234 000 000 0000",
        email: "invoice-test@example.invalid",
      },
      price: 12500,
      currency: "₦",
      dueDate: "2026-12-12",
      gender,
      measurements,
      images: [],
    };
    const buffer = await renderInvoice(model);
    assert.deepEqual(buffer, await renderInvoice(model), 'Retrying a saved invoice must produce identical attachment bytes');
    assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
    assert.ok(buffer.length > 10000);
    await fs.writeFile(path.join(out, `${gender}-invoice.pdf`), buffer);
  }
  const image = await fs.readFile("public/assets/mannequin-female-front.png");
  const model: InvoiceModel = {
    orderId: "22222222-2222-4222-8222-222222222222",
    reference: "TF-22222222-2222-4222-8222-222222222222",
    issuedAt: "2026-11-08",
    garment:
      "A long garment title for a special occasion with detailed custom requirements",
    client: {
      name: "A very long sample client name that should wrap gracefully across invoice lines",
      phone: "Not provided",
      email: "Not provided",
    },
    price: 0,
    currency: "€",
    dueDate: "",
    gender: null,
    measurements: Array.from({ length: 47 }, (_, i) => ({
      key: `custom_${i}`,
      label: `Custom measurement ${i + 1}`,
      value: i === 0 ? "42 / 44" : String(i + 1),
      unit: "cm",
      number: i + 1,
    })),
    images: Array.from({ length: 6 }, (_, i) => ({
      path: `test/${i}`,
      title: `Reference ${i + 1}`,
      caption: "Sample image for layout verification; not customer data.",
      bytes: image,
    })),
  };
  await fs.writeFile(
    path.join(out, "multipage-invoice.pdf"),
    await renderInvoice(model),
  );
  model.measurements = [];
  model.images = [];
  await fs.writeFile(
    path.join(out, "empty-invoice.pdf"),
    await renderInvoice(model),
  );
  console.log(
    "PASS: PDF generation for both genders, custom sizes, six references, missing values, zero price, and currency formatting.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
