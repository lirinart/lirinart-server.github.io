require('dotenv').config();  // Load environment variables from the .env file
const express = require('express');
const multer = require('multer');  // Import multer for file handling
const path = require('path');
const cloudinary = require('./cloudinary');  // Import Cloudinary config
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection URI
const uri = process.env.MONGODB_URI;  // MongoDB URI from .env

// Multer setup for file uploads (storing images in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Connect to MongoDB
async function connectToDatabase() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB!');
        return client.db('lirinart'); // Use the 'lirinart' database
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
        throw error;
    }
}

// Route for Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Route to Add Artwork page (with file upload)
app.get('/admin/add-artwork', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'add-artwork.html'));
});

// Route to handle adding artwork
app.post('/admin/add-artwork', upload.single('image'), async (req, res) => {
    const { title, description, tags } = req.body;
    const image = req.file ? req.file.buffer : null;  // Get the uploaded image's buffer

    // Validate input
    if (!title || !description || !image) {
        return res.status(400).send('Missing required fields');
    }

    // Upload image to Cloudinary
    try {
        const result = await cloudinary.uploader.upload_stream(
            { folder: 'lirinart_artworks' },
            async (error, result) => {
                if (error) {
                    console.error('Error uploading to Cloudinary', error);
                    return res.status(500).send('Error uploading image');
                }

                const db = await connectToDatabase();
                const collection = db.collection('artworks');

                // Save artwork data with Cloudinary image URL
                const artwork = {
                    title,
                    description,
                    image: result.secure_url,  // Save Cloudinary URL
                    tags
                };

                const resultDB = await collection.insertOne(artwork);
                res.status(201).send(`Artwork added with ID: ${resultDB.insertedId}`);
            }
        );
        // Pipe the image buffer to Cloudinary
        result.end(req.file.buffer);
    } catch (error) {
        console.error('Error adding artwork', error);
        res.status(500).send('Error adding artwork');
    }
});

// Route for managing artworks
app.get('/admin/manage-artworks', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'manage-artworks.html'));
});

// Connect to MongoDB on server startup
async function initDatabase() {
    try {
        await connectToDatabase(); // Ensure connection is working on startup
        console.log('Connected to MongoDB!');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

initDatabase(); // Initialize DB connection when the server starts

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
