// index.js
require('dotenv').config();  // Load .env file

const express = require('express');
const multer = require('multer');  // Import multer for file handling
const path = require('path');
const { MongoClient } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// MongoDB connection URI
const uri = process.env.MONGODB_URI;  // MongoDB URI from .env

const fs = require('fs');

// Create the gallery folder if it doesn't exist
const galleryPath = path.join(__dirname, 'gallery');
if (!fs.existsSync(galleryPath)) {
    fs.mkdirSync(galleryPath);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'gallery/');  // Files will be stored in the 'gallery/' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // File name will be timestamp + file extension
    },
});
const upload = multer({ storage });

// Middleware to parse JSON
app.use(express.json());

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

// Route for the root path
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Lirin Art API Site</title>
            </head>
            <body>
                <h1>Welcome to the Lirin Art API Site</h1>
                <p>Click below to go to the admin dashboard:</p>
                <a href="/admin/dashboard">Go to Admin Dashboard</a>
            </body>
        </html>
    `);
});

// Serve static files from the 'admin' directory
app.use('/admin', express.static(path.join(__dirname, 'admin')));
// Route for Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Route to Add Artwork
app.get('/admin/add-artwork', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'add-artwork.html'));
});

// Route to handle adding artwork
app.post('/admin/add-artwork', upload.single('image'), async (req, res) => {
    const { title, description, tags } = req.body;
    const image = req.file ? req.file.filename : null;  // Get the uploaded image's filename

    // Validate input
    if (!title || !description || !image) {
        return res.status(400).send('Missing required fields');
    }

    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    
    try {
        const result = await collection.insertOne({ title, description, image, tags });
        res.status(201).send(`Artwork added with ID: ${result.insertedId}`);
    } catch (error) {
        console.error("Error adding artwork", error);
        res.status(500).send("Error adding artwork");
    }
});

// Route to manage artworks
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
