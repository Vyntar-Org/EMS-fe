# OHT Logs frontend

The OHT and WATER_MONITOR Logs routes reuse the existing EMS machine selector,
date-time picker, table, loader and download-button components. WaterLogs.jsx and
the other applications' logs are unchanged. CustomTable accepts optional
pagination props; its defaults remain unchanged for existing consumers.

The service reuses the authenticated API client and OHT endpoint helper. It sends
only slave_id, start_datetime, end_datetime, limit and offset. Machine options come
from the authenticated OHT machine-list response. Query keys separate user, machine,
date range and page; requests consume abort signals. No historical motor controls
are provided. The parameter selector controls displayed/exported columns locally.

The existing local picker convention (YYYY-MM-DDTHH:mm:ss) is retained. The local
Django endpoint compares ISO strings against its timestamp column. Display labels
preserve the API wall clock and any supplied UTC/offset marker, including fractional
seconds; naive timestamps are not silently reinterpreted in another zone. Numeric
readings stay raw and measurement units are omitted without explicit metadata.

Pagination uses meta.total, meta.limit, meta.offset and meta.has_more. Next is
disabled when has_more is false even if a separate total suggests another page.
Machine selection starts null. Dates mirror WaterLogs.jsx: the start is the
current local time minus 24 hours and the end is the current local time, with no
month-boundary rounding. Search validates and snapshots the selected
filters before enabling a logs request. View Logs/Search returns to the first
page; Refresh preserves the current submitted search and page. Machine/date or
parameter changes clear the visible results and disable the data query until
another Search. Cached or late responses are not shown in this idle state.
Downloads require a successful search and use its submitted filters, machine
identity and displayed parameters. Machine-list fetching remains independent.

Full Excel/CSV/PDF exports fetch pages sequentially through the same logs endpoint,
starting at offset zero and following has_more. Progress and cancellation remain
available between pages. Errors, changed dataset totals, non-advancing pagination,
inconsistent units and incomplete coverage stop export without saving a partial
file. Filter changes, navigation and user-session changes cancel export.

Browser exports are capped at 10,000 rows (2,000 for PDF) to bound memory and
synchronous file generation. Larger ranges must be narrowed. A backend streaming
or asynchronous export endpoint is needed for larger datasets; no such endpoint
is assumed or invented here. Backend offset pagination is not a transactional
snapshot, so exports should use fixed historical ranges.
