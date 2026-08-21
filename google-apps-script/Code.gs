/**
 * Mazhalai Preschool — Admission Enquiry → Google Sheets
 *
 * Setup:
 *   1. Open the target Google Sheet.
 *   2. Extensions -> Apps Script, delete any boilerplate, paste this file's contents.
 *   3. Save, then Deploy -> New deployment -> select type "Web app".
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   4. Copy the deployment URL into GOOGLE_SHEETS_WEB_APP_URL in
 *      public/js/admissionForm.js on the website.
 *
 * Unlike the Sheets API, this runs inside Google's own infrastructure and
 * is reachable from anywhere on the internet — no server of your own needs
 * to be kept running for submissions to arrive.
 *
 * Each submission is appended as a new row to the sheet named SHEET_NAME
 * (created automatically on first submission if it doesn't exist).
 */

var SHEET_NAME = 'Mazhalai_admission';
var HEADER_ROW = ['Timestamp', 'Name', 'Mobile', 'Child Age', 'Program Interested', 'Source'];

function doPost(e) {
  var sheet = getOrCreateSheet_();
  var data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.mobile || '',
    data.childAge || '',
    data.program || '',
    data.source || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
    sheet.getRange(1, 1, 1, HEADER_ROW.length).setFontWeight('bold');
  }
  return sheet;
}
