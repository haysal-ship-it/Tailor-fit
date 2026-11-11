export type InvoiceMeasurement = {
  key: string;
  label: string;
  value: string;
  unit: string;
  number: number;
  front?: { x: number; y: number };
  back?: { x: number; y: number };
};
export type InvoiceModel = {
  orderId: string;
  reference: string;
  issuedAt: string;
  garment: string;
  client: { name: string; phone: string; email: string };
  price: number;
  currency: string;
  dueDate: string;
  gender: "female" | "male" | null;
  measurements: InvoiceMeasurement[];
  images: { path: string; title: string; caption: string; bytes?: Buffer }[];
};
export function invoiceMoney(amount: number, currency: string) {
  const codes: Record<string, string> = {
    "₦": "NGN",
    $: "USD",
    "€": "EUR",
    "£": "GBP",
  };
  return `${codes[currency] || currency || "Currency not recorded"} ${amount.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
