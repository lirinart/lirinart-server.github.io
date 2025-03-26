// controllers/artworkController.js
const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../db/connection');

async function getArtworks(req, res) {
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    try {
        const artworks = await collection.find({}).toArray();
        res.json(artworks);
    } catch (error) {
        console.error("Error fetching artworks", error);
        res.status(500).send("Error fetching artworks");
    }
}

async function createArtwork(req, res) {
    const { title, description, imageURL, tags, collections } = req.body;
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    try {
        const result = await collection.insertOne({ title, description, imageURL, tags, collections });
        res.status(201).send(`Artwork created with ID: ${result.insertedId}`);
    } catch (error) {
        console.error("Error adding artwork", error);
        res.status(500).send("Error adding artwork");
    }
}

module.exports = { getArtworks, createArtwork };
