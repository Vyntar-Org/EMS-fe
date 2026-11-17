import { ohtLogUnits } from './ohtLogModel';

export const OHT_EXPORT_MAX_ROWS = 10000;
export const OHT_PDF_MAX_ROWS = 2000;

function checkCancelled(signal) {
	if (signal?.aborted) {
		throw new DOMException('Export cancelled.', 'AbortError');
	}
}

// An injected reader keeps this collector testable without equipment or credentials.
export async function collectOHTLogPages(
	readPage,
	filters,
	{ signal, onProgress, maxRows = OHT_EXPORT_MAX_ROWS } = {}
) {
	const rows = [];
	let offset = 0;
	let units;
	let firstTotal;
	for (;;) {
		checkCancelled(signal);
		const page = await readPage({ ...filters, limit: 500, offset }, { signal });
		checkCancelled(signal);
		const { meta, logs } = page;
		if (meta.total > maxRows || rows.length + logs.length > maxRows) {
			throw new Error(
				`This export exceeds ${maxRows.toLocaleString(
					'en-IN'
				)} readings. Narrow the date range or request a backend export endpoint for larger datasets. No partial file was downloaded.`
			);
		}
		if (firstTotal === undefined) {
			firstTotal = meta.total;
		}
		if (meta.total !== firstTotal) {
			throw new Error(
				'The log dataset changed during export. Please retry with a fixed historical date range.'
			);
		}
		const nextUnits = ohtLogUnits(meta);
		if (units && JSON.stringify(units) !== JSON.stringify(nextUnits)) {
			throw new Error(
				'Measurement units changed during export. Please refresh and try again.'
			);
		}
		units = nextUnits;
		rows.push(...logs);
		onProgress?.({ count: rows.length, total: meta.total });
		if (!meta.has_more) {
			if (rows.length !== meta.total) {
				throw new Error(
					'The complete log dataset could not be retrieved. No partial file was downloaded.'
				);
			}
			return { rows, units };
		}
		if (!logs.length || meta.offset !== offset || meta.count !== logs.length) {
			throw new Error(
				'Log pagination did not advance. No partial file was downloaded.'
			);
		}
		offset = meta.offset + meta.count;
		// Yield between pages so progress and cancellation remain responsive.
		await new Promise((resolve) => setTimeout(resolve, 0));
	}
}
