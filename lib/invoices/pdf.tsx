import React from "react";
import path from "node:path";
import { readFileSync } from "node:fs";
import {
  Document,
  Page,
  Text,
  View,
  Image as PdfImage,
  Svg,
  Circle,
  Text as PdfText,
  Font,
  renderToBuffer,
  StyleSheet,
} from "@react-pdf/renderer";
import { invoiceMoney, type InvoiceModel } from "./model";
Font.register({
  family: "Manrope",
  fonts: [
    {
      src: path.join(
        process.cwd(),
        "node_modules/@fontsource/manrope/files/manrope-latin-400-normal.woff",
      ),
    },
    {
      src: path.join(
        process.cwd(),
        "node_modules/@fontsource/manrope/files/manrope-latin-600-normal.woff",
      ),
      fontWeight: 600,
    },
  ],
});
const s = StyleSheet.create({
  page: {
    fontFamily: "Manrope",
    fontSize: 10,
    color: "#171717",
    padding: 36,
    paddingBottom: 54,
  },
  title: { fontSize: 22, fontWeight: 600, marginBottom: 8 },
  section: { fontSize: 14, fontWeight: 600, marginTop: 20, marginBottom: 10 },
  muted: { color: "#595959", lineHeight: 1.6 },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #DDDBDB",
    paddingVertical: 8,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    fontSize: 9,
    color: "#595959",
  },
  image: { width: "100%", height: 220, objectFit: "contain" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    paddingVertical: 8,
    fontWeight: 600,
  },
});
const date = (value: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        timeZone: "UTC",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not set";
function Footer() {
  return (
    <Text
      fixed
      style={s.footer}
      render={({ pageNumber, totalPages }) =>
        `TailorFit  ·  ${pageNumber} / ${totalPages}`
      }
    />
  );
}
function Diagram({
  model,
  side,
}: {
  model: InvoiceModel;
  side: "front" | "back";
}) {
  return (
    <View style={{ width: 245 }}>
      <Text style={{ textAlign: "center", marginBottom: 8 }}>
        {side === "front" ? "Front" : "Back"}
      </Text>
      <View style={{ width: 245, height: 282 }}>
        <PdfImage
          src={readFileSync(
            path.join(
              process.cwd(),
              `public/assets/mannequin-${model.gender}-${side}.png`,
            ),
          )}
          style={{ width: 245, height: 282 }}
        />
        <Svg
          width={245}
          height={282}
          viewBox="0 0 636 730"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {model.measurements
            .filter((m) => m[side])
            .map((m) => (
              <React.Fragment key={m.key}>
                <Circle cx={m[side]!.x} cy={m[side]!.y} r={14} fill="#1D49E8" />
                <PdfText
                  x={m[side]!.x}
                  y={m[side]!.y + 5}
                  textAnchor="middle"
                  style={{ fontSize: 15, fill: "#FFFFFF" }}
                >
                  {m.number}
                </PdfText>
              </React.Fragment>
            ))}
        </Svg>
      </View>
    </View>
  );
}
export function InvoiceDocument({ model }: { model: InvoiceModel }) {
  const chunks = model.measurements.length ? [model.measurements] : [];
  return (
    <Document title={`TailorFit invoice ${model.reference}`} author="TailorFit" creationDate={new Date(model.issuedAt)} modificationDate={new Date(model.issuedAt)}>
      <Page size="A4" style={s.page}>
        <Text style={{ fontSize: 14, color: "#1D49E8", marginBottom: 24 }}>
          TailorFit
        </Text>
        <Text style={s.title}>Invoice</Text>
        <Text style={{ fontSize: 8, color: "#595959" }}>{model.reference}</Text>
        <Text style={s.muted}>Issued {date(model.issuedAt)}</Text>
        <Text style={s.section}>{model.garment}</Text>
        <Text style={{ fontWeight: 600, marginBottom: 4 }}>
          {model.client.name}
        </Text>
        <Text style={s.muted}>{model.client.phone}</Text>
        <Text style={s.muted}>{model.client.email}</Text>
        <View
          style={[s.row, { marginTop: 16, justifyContent: "space-between" }]}
        >
          <Text>Price</Text>
          <Text style={{ fontWeight: 600 }}>
            {invoiceMoney(model.price, model.currency)}
          </Text>
        </View>
        <View style={[s.row, { justifyContent: "space-between" }]}>
          <Text>Due date</Text>
          <Text>{date(model.dueDate)}</Text>
        </View>
        <Text style={s.section}>Measurements</Text>
        {model.gender && model.measurements.length ? (
          <>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Diagram model={model} side="front" />
              <Diagram model={model} side="back" />
            </View>
            <Text style={s.muted}>
              Numbered points correspond to the size list on the following
              pages. Unmapped custom measurements appear in the list.
            </Text>
          </>
        ) : (
          <Text style={s.muted}>
            {model.measurements.length
              ? "Mannequin view not recorded. See the size list."
              : "Not recorded"}
          </Text>
        )}
        <Footer />
      </Page>
      {chunks.map((rows, index) => (
        <Page key={index} size="A4" style={s.page}>
          <Text fixed style={s.section}>
            Measurements
          </Text>
          <View fixed style={s.tableHead}>
            <Text style={{ width: 32 }}>No.</Text>
            <Text style={{ flex: 1 }}>Measurement</Text>
            <Text style={{ width: 110 }}>Size</Text>
          </View>
          {rows.map((m) => (
            <View key={m.key} wrap={false} style={s.row}>
              <Text style={{ width: 32 }}>{m.number}</Text>
              <Text style={{ flex: 1, paddingRight: 12 }}>{m.label}</Text>
              <Text style={{ width: 110 }}>
                {m.value} {m.value === "Not recorded" ? "" : m.unit}
              </Text>
            </View>
          ))}
          <Footer />
        </Page>
      ))}
      {model.images.map((image, i) => (
        <Page key={image.path + i} size="A4" style={s.page}>
          <Text style={s.section}>{image.title}</Text>
          <PdfImage src={image.bytes!} style={{ ...s.image, height: 440 }} />
          {image.caption && (
            <Text style={[s.muted, { marginTop: 12 }]}>{image.caption}</Text>
          )}
          <Footer />
        </Page>
      ))}
    </Document>
  );
}
export async function renderInvoice(model: InvoiceModel) {
  return renderToBuffer(<InvoiceDocument model={model} />);
}
