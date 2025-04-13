require('dotenv').config();  // Load environment variables from the .env file
console.log(process.env.MONGODB_URI);  // This should output the MongoDB URI if the .env file is loaded correctly

const express = require('express');
const multer = require('multer');
const path = require('path');
const { MongoClient } = require('mongodb');
const cloudinary = require('./cloudinary');
const artworkRoutes = require('./routes/artworks');
const { connectToDatabase } = require('./db/connection');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

const uri = process.env.MONGODB_URI;  // MongoDB URI from .env

// Multer setup for file uploads (storing images in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Connect to MongoDB and handle errors
async function connectToMongoDB() {
    const db = await connectToDatabase();
    if (!db) {
        console.error('Error connecting to MongoDB');
        process.exit(1);  // Exit if DB connection fails
    }
    console.log('Connected to MongoDB');
    return db;
}

// MongoDB connection setup
const dbPromise = connectToMongoDB();

// Routes for Admin Panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Admin Add Artwork page
app.get('/admin/add-artwork', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'add-artwork.html'));
});

// Route to handle adding an artwork
app.post('/admin/add-artwork', upload.single('image'), async (req, res) => {
    const { title, description, tags } = req.body;
    const image = req.file ? req.file.buffer : null;

    if (!title || !description || !image) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const result = await cloudinary.uploader.upload_stream({ folder: 'lirinart_artworks' }, async (error, result) => {
            if (error) {
                return res.status(500).send('Error uploading image');
            }

            const db = await dbPromise;
            const collection = db.collection('artworks');
            const artwork = { title, description, image: result.secure_url, tags };

            const dbResult = await collection.insertOne(artwork);
            res.status(201).send(`Artwork added with ID: ${dbResult.insertedId}`);
        });

        result.end(req.file.buffer);
    } catch (error) {
        console.error('Error adding artwork', error);
        res.status(500).send('Error adding artwork');
    }
});

// Handle routes for artwork management
app.get('/admin/manage-artworks', async (req, res) => {
    const db = await dbPromise;
    const collection = db.collection('artworks');
    const artworks = await collection.find({}).toArray();
    console.log(artworks);  // Добавьте лог, чтобы проверить, что вернуло API
    res.sendFile(path.join(__dirname, 'admin', 'manage-artworks.html'));
});


app.put('/admin/update-artwork/:id', upload.single('image'), async (req, res) => {
    const artworkId = req.params.id;
    const { title, description, tags } = req.body;
    const image = req.file ? req.file.buffer : null;

    if (!title || !description || !image) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const result = await cloudinary.uploader.upload_stream({ folder: 'lirinart_artworks' }, async (error, result) => {
            if (error) {
                return res.status(500).send('Error uploading image');
            }

            const db = await connectToDatabase();
            const collection = db.collection('artworks');
            const updatedArtwork = {
                title,
                description,
                image: result.secure_url,
                tags
            };

            const updateResult = await collection.updateOne(
                { _id: new MongoClient.ObjectId(artworkId) },
                { $set: updatedArtwork }
            );

            if (updateResult.modifiedCount === 1) {
                res.status(200).send('Artwork updated');
            } else {
                res.status(404).send('Artwork not found');
            }
        });
        result.end(req.file.buffer);
    } catch (error) {
        console.error('Error updating artwork', error);
        res.status(500).send('Error updating artwork');
    }
});

app.delete('/admin/delete-artwork/:id', async (req, res) => {
    const artworkId = req.params.id;
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    
    try {
        const result = await collection.deleteOne({ _id: new MongoClient.ObjectId(artworkId) });
        if (result.deletedCount === 1) {
            res.status(200).send('Artwork deleted');
        } else {
            res.status(404).send('Artwork not found');
        }
    } catch (error) {
        console.error('Error deleting artwork', error);
        res.status(500).send('Error deleting artwork');
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
