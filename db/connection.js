// db/connection.js
const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI;

let client;
let db;

async function connectToDatabase() {
    if (db) return db;
    try {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db("lirinart"); 
        console.log("Connected to MongoDB!");
        return db;
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        throw err;
    }
}

module.exports = { connectToDatabase };
