# Tailorfit workspace stress test

Run `node scripts/ui-stress/preview.cjs` for the local interactive preview or add `--check` for server-render checks. The screen and dataset are stored in the URL. The preview uses the workspace components, local fixture records and isolated persistence adapters. Reloading resets edits.

## Fields exercised

| Surface and field | Source and accepted range | Cases |
| --- | --- | --- |
| Client name and derived initials | `client.name`, required, 1–200 trimmed characters in the record schema | Compound surname, one letter, duplicate names, Arabic, CJK, Vietnamese diacritics, emoji with a skin tone and joined glyphs. A separate validator probe used 201 characters. |
| Contact inputs and directory search | `client.email` accepts blank or a valid address, no explicit character limit in the record schema. Phone and notes accept up to 20,000 characters each. | Long address, blank contact fields, international phone, multiline notes. |
| Order identity and title | Order and client IDs are UUIDs. Order garment title is required and capped at 200 characters. Fitting garment text accepts up to 20,000 characters. | UUID, unbroken compound garment name, ampersand in garment name. |
| Money and balances | Price is finite and nonnegative. Paid amount is optional and nonnegative. Currency is optional, up to 12 characters. | Fractional multi-million NGN price, USD and NGN in the same studio, zero and unknown payment. |
| Order state | Six supported status values in `lib/data/schema.ts` | All six in one dataset. A separate handler probe opened Update status and submitted each initial state without changing the selection. |
| Order dates and calendar labels | Pickup date is a text field. Creation timestamp is supplied by the repository. Fitting date is stored as YYYY-MM-DD. | No due date, offset timestamp crossing a day and year boundary, current creation dates. |
| Fitting points, units and mannequin | Measurement keys up to 100 characters. Values can be finite numbers or strings up to 1,000 characters. Units are cm or in. Form is optional. | Blank order, one 42.5 cm shoulder measurement from a saved fitting, cardinal controls and selected-point count. |
| Images | Up to six references per order. Title and note are optional. URL and title use the shared 20,000-character text schema. | No references and a titled reference returning HTTP 404. |
| Counts, cards, statuses, metrics and search results | Derived from orders, clients and snapshots. No list-length limit found in the rendered directory or order list. | Zero, one, three, eight and 1,284 records. Counted rendered cards and order rows directly. |
| Dialog dismissal and busy state | Shared modal title and close control, with screen-specific close callbacks | Inspected client name validation and status submission. The preview allows manual tests of dismissal, focus and unsaved changes. |

## Verification boundary

Server-render checks cover Overview, Clients, Orders, New Order, Order details and the client dialog launcher. Status submission was also exercised at the component-handler boundary and client validation at the form and record boundaries. No test wrote to a live account. The browser connection was unavailable, so viewport geometry, zoom, pointer and keyboard behavior, image fallback appearance, and scrolling performance were not measured.
