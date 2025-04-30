require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'lirinart';
const COLLECTION_NAME = 'artworks';

async function generateMetadata(imageUrl) {
  const prompt = `
You are an art curator helping an artist generate metadata for their artwork.

Please look at this image:
${imageUrl}

Return a JSON object with:
- "title": a short, poetic name for the artwork (3–6 words)
- "description": 1–2 artistic sentences describing the scene
- "tags": 4–7 lowercase tags describing the style, subject, or mood

Format:
{
  "title": "...",
  "description": "...",
  "tags": ["...", "...", ...]
}
Only return valid JSON.
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  try {
    const json = JSON.parse(content);
    return json;
  } catch (error) {
    console.error('⚠️ Failed to parse JSON:', content);
    return null;
  }
}

async function updateArtworkMetadata() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DATABASE_NAME);
  const collection = db.collection(COLLECTION_NAME);

  const artworks = await collection.find({
    title: { $regex: '^lirinart_artworks/' }
  }).toArray();

  console.log(`🔍 Найдено ${artworks.length} изображений для генерации`);

  for (const artwork of artworks) {
    const imageUrl = artwork.description || artwork.image;

    if (!imageUrl) {
      console.log(`❌ Пропущено: ${artwork._id} — нет URL`);
      continue;
    }

    console.log(`🧠 Генерация для: ${artwork._id}`);

    const metadata = await generateMetadata(imageUrl);

    if (!metadata) {
      console.log(`❌ Пропущено: ${artwork._id} — ошибка генерации`);
      continue;
    }

    const updateDoc = {
      $set: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        image: imageUrl,
        isPublished: true,
        series: artwork.series || ""
      }
    };

    await collection.updateOne({ _id: artwork._id }, updateDoc);
    console.log(`✅ Обновлено: ${metadata.title}`);
  }

  await client.close();
  console.log('🎉 Готово!');
}

updateArtworkMetadata().catch(err => {
  console.error('❌ Ошибка при выполнении:', err);
});
