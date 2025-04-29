const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Настройки
const KEYFILEPATH = path.join(__dirname, 'credentials', 'lirinart-admin-4ece15d54ed0.json');
const SPREADSHEET_ID = '1jlNwPE62t8LggTPCOi4TfwSAXtMqhQ4qU83dDaTyt58';
const SHEET_RANGE = 'lirinart.artworks!A1:Z';
const MONGO_URI = 'mongodb+srv://lirinart:mongodbkonto73@lirinart-cluster.eylms.mongodb.net/?retryWrites=true&w=majority&appName=lirinart-cluster';

const DB_NAME = 'lirinart';
const COLLECTION_NAME = 'artworks';

async function importToMongo() {
  // Авторизация Google
  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // Получаем данные
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: SHEET_RANGE,
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log('Нет данных');
    return;
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  const artworks = dataRows.map(row => {
    return {
      title: row[0] || '',
      description: row[1] || '',
      image: row[2] || '',
      series: row[3] || '',
      tags: row.slice(4).filter(Boolean),
      isPublished: true
    };
  });

  // Подключаемся к MongoDB
  const mongoClient = new MongoClient(MONGO_URI);
  await mongoClient.connect();
  const db = mongoClient.db(DB_NAME);
  const collection = db.collection(COLLECTION_NAME);

  console.log('Очищаем коллекцию...');
  await collection.deleteMany({});

  console.log('Вставляем новые данные...');
  const result = await collection.insertMany(artworks);

  console.log(`✅ Загружено ${result.insertedCount} работ в коллекцию '${COLLECTION_NAME}'.`);

  await mongoClient.close();
}

importToMongo().catch(console.error);
