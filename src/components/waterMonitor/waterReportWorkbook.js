import { strToU8, zipSync } from 'fflate';

const xml = (value) =>
	String(value)
		// XML 1.0 does not permit these control characters in cell text.
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');

function columnName(index) {
	let name = '';
	for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
		name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
	}
	return name;
}

// A real Office Open XML workbook, using the ZIP library already used by jsPDF.
// Numbers remain numeric; all names/text are inline strings, never formulas.
export function createWaterReportWorkbook(matrix) {
	const sheetRows = matrix
		.map((row, rowIndex) => {
			const cells = row
				.map((value, colIndex) => {
					const ref = `${columnName(colIndex)}${rowIndex + 1}`;
					if (value === null || value === undefined) {
						return `<c r="${ref}"/>`;
					}
					if (typeof value === 'number' && Number.isFinite(value)) {
						return `<c r="${ref}" s="${
							colIndex === 0 ? 0 : 1
						}"><v>${value}</v></c>`;
					}
					return `<c r="${ref}" t="inlineStr"${
						rowIndex === 0 || rowIndex === 3 ? ' s="2"' : ''
					}><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
				})
				.join('');
			return `<row r="${rowIndex + 1}">${cells}</row>`;
		})
		.join('');
	const width = Math.max(...matrix.map((row) => row.length));
	const lastColumn = columnName(width - 1);
	const files = {
		'[Content_Types].xml':
			'<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
		'_rels/.rels':
			'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
		'xl/workbook.xml':
			'<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Water Monitoring" sheetId="1" r:id="rId1"/></sheets></workbook>',
		'xl/_rels/workbook.xml.rels':
			'<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
		'xl/styles.xml':
			'<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
		'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastColumn}${matrix.length}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="${width}" width="26" customWidth="1"/></cols><sheetData>${sheetRows}</sheetData><autoFilter ref="A4:${lastColumn}${matrix.length}"/></worksheet>`,
	};
	return zipSync(
		Object.fromEntries(
			Object.entries(files).map(([name, content]) => [name, strToU8(content)])
		)
	);
}
