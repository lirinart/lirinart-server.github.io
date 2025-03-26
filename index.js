const express = require('express');
const multer = require('multer');  // Import multer for file handling
const path = require('path');
const { connectToDatabase } = require('./db/connection');
const artworkRoutes = require('./routes/artworks');

const app = express();
const port = process.env.PORT || 3000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be stored in the 'uploads/' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // File name will be timestamp + file extension
    },
});
const upload = multer({ storage });

// Middleware to parse JSON
app.use(express.json());
app.use('/artworks', artworkRoutes); // Using the artwork routes
app.use('/admin', express.static('admin')); // Static files for the admin panel

// Route for Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Route for Add Artwork page (with file upload)
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
