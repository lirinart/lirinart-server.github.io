const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Путь к твоему JSON-файлу с ключами
const KEYFILEPATH = path.join(__dirname, 'credentials', 'lirinart-admin-4ece15d54ed0.json');

// ID таблицы Google Sheets (копируешь из URL)
const SPREADSHEET_ID = '1jlNwPE62t8LggTPCOi4TfwSAXtMqhQ4qU83dDaTyt58'; // <-- сюда ID твоей таблицы

async function readSheet() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'lirinart.artworks', // название листа, обычно "Sheet1"
  });

  const rows = response.data.values;
  if (rows.length) {
    console.log('Rows:');
    console.log(rows);
  } else {
    console.log('No data found.');
  }
}

readSheet().catch(console.error);
