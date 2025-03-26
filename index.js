const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = "mongodb+srv://lirinart:<db_password>@lirinart-cluster.eylms.mongodb.net/?retryWrites=true&w=majority";

// MongoDB client
const client = new MongoClient(uri);

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        return client.db("lirinart"); // Database name
    } catch (err) {
        console.error("Error connecting to MongoDB", err);
        throw err;
    }
}

// Route to get all artworks
app.get('/artworks', async (req, res) => {
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    try {
        const artworks = await collection.find({}).toArray();
        res.json(artworks);
    } catch (error) {
        console.error("Error fetching artworks", error);
        res.status(500).send("Error fetching artworks");
    }
});

// Route to add a new artwork
app.post('/artworks', async (req, res) => {
    const { title, description } = req.body;
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    try {
        const result = await collection.insertOne({ title, description });
        res.status(201).send(`Artwork created with ID: ${result.insertedId}`);
    } catch (error) {
        console.error("Error adding artwork", error);
        res.status(500).send("Error adding artwork");
    }
});

// Default route to check if the server is working
app.get('/', (req, res) => {
    res.send("Welcome to the LirinArt API");
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
