const SHEET_NAME = "progress";
const HEADERS = ["problemId", "pattern", "title", "completed", "tags", "notes", "videoUrl", "updatedAt"];

function doGet() {
  const sheet = getProgressSheet();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).filter(row => row[0]);
  const records = rows.map(row => Object.fromEntries(HEADERS.map((key, index) => [key, row[index] ?? ""])));

  return jsonResponse({ records });
}

function doPost(event) {
  const payload = JSON.parse(event.postData.contents || "{}");
  const records = Array.isArray(payload.records) ? payload.records : [];
  const sheet = getProgressSheet();

  sheet.clearContents();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

  if (records.length) {
    const rows = records.map(record => HEADERS.map(header => record[header] ?? ""));
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }

  return jsonResponse({ ok: true, saved: records.length });
}

function getProgressSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = HEADERS.every((header, index) => firstRow[index] === header);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }

  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
