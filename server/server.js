// ==========================================
// Mazhalai Preschool – Admission Enquiry API
// ==========================================
// Reads Google service-account credentials from .env and appends each
// admission form submission as a row in the configured Google Sheet.
//
// Setup:
//   1. Create a Google Cloud service account, enable the Sheets API,
//      and download its JSON key.
//   2. Share the target Google Sheet with the service account's email
//      (Editor access).
//   3. Copy .env.example to .env and fill in the values below.
//   4. npm install && npm start   (defaults to http://localhost:4000)
// ==========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEET_ID,
  GOOGLE_SHEET_TAB_NAME,
} = process.env;

const SHEET_TAB = GOOGLE_SHEET_TAB_NAME || 'Mazhalai_admission';
const HEADER_ROW = ['Timestamp', 'Name', 'Mobile', 'Child Age', 'Program Interested', 'Source'];

function isConfigured() {
  return Boolean(GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY && GOOGLE_SHEET_ID);
}

function getSheetsClient() {
  const auth = new google.auth.JWT(
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets']
  );
  return google.sheets({ version: 'v4', auth });
}

async function ensureSheetTabExists(sheets) {
  const { data } = await sheets.spreadsheets.get({ spreadsheetId: GOOGLE_SHEET_ID });
  const exists = (data.sheets || []).some((s) => s.properties && s.properties.title === SHEET_TAB);

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: GOOGLE_SHEET_ID,
      requestBody: { requests: [{ addSheet: { properties: { title: SHEET_TAB } } }] },
    });
  }
}

async function ensureHeaderRow(sheets) {
  await ensureSheetTabExists(sheets);

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `${SHEET_TAB}!A1:F1`,
  });

  if (!data.values || data.values.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEET_TAB}!A1:F1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: isConfigured() });
});

app.post('/api/admission', async (req, res) => {
  const { name, mobile, childAge, program, source } = req.body || {};

  if (!name || !mobile || !childAge || !program) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!isConfigured()) {
    console.error('Admission API: Google Sheets credentials are missing from .env');
    return res.status(500).json({ error: 'Server is not configured yet.' });
  }

  try {
    const sheets = getSheetsClient();
    await ensureHeaderRow(sheets);

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEET_TAB}!A:F`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          new Date().toISOString(),
          name,
          mobile,
          childAge,
          program,
          source || 'Website Floating Admission Widget',
        ]],
      },
    });

    res.json({ result: 'success' });
  } catch (err) {
    console.error('Failed to append admission row:', err.message);
    res.status(502).json({ error: 'Could not save to Google Sheets.' });
  }
});

app.listen(PORT, () => {
  console.log(`Admission API listening on http://localhost:${PORT}`);
  if (!isConfigured()) {
    console.warn('⚠ Google Sheets credentials not set — copy .env.example to .env and fill it in.');
  }
});
