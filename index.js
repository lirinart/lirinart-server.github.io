require('dotenv').config();  // Load environment variables from the .env file
console.log(process.env.MONGODB_URI);  // This should output the MongoDB URI if the .env file is loaded correctly
const express = require('express');
const multer = require('multer');  // Import multer for file handling
const path = require('path');
const cloudinary = require('./cloudinary');  // Import Cloudinary config
//const { MongoClient } = require('mongodb');
const { MongoClient, ObjectId } = require('mongodb');  // Импортируем ObjectId
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
    let image = req.file ? req.file.buffer : null;  
    let tagsArray = [];
    if (tags) {
        
        tagsArray = tags.split(',').map(tag => tag.trim());
        console.log(tagsArray);
    }
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
                    tags: tagsArray
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
app.get('/admin/manage-artworks', async (req, res) => {
    const db = await dbPromise;
    const collection = db.collection('artworks');
    const artworks = await collection.find({}).toArray();
    console.log(artworks);  
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

app.get('/', (req, res) => {
    console.log("Root path accessed");
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

// Route for Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Route to Add Artwork page
app.get('/admin/add-artwork', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'add-artwork.html'));
});

// Route to manage artworks
app.get('/admin/manage-artworks', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'manage-artworks.html'));
});


// Route to delete an artwork
    app.delete('/admin/delete-artwork/:id', async (req, res) => {
    const artworkId = req.params.id;  // Получение ID из параметров URL
    const db = await connectToDatabase();
    const collection = db.collection('artworks');
    
    try {
        // Используем ObjectId для преобразования строки в объект ObjectId
        const result = await collection.deleteOne({ _id: new ObjectId(artworkId) });
        
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

// Serve static files from the 'admin' directory
app.use('/admin', express.static(path.join(__dirname, 'admin')));

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


app.put('/admin/update-artwork/:id', upload.single('image'), async (req, res) => {
    const artworkId = req.params.id;
    const { title, description, tags } = req.body;
    const parsedTags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : [];

    try {
        const db = await connectToDatabase();
        const collection = db.collection('artworks');

        const updateFields = {
            title,
            description,
            tags: parsedTags
        };

        // Если изображение есть — загружаем в Cloudinary
        if (req.file) {
            const streamUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream({ folder: 'lirinart_artworks' }, (error, result) => {
                        if (error) return reject(error);
                        resolve(result.secure_url);
                    });
                    stream.end(fileBuffer);
                });
            };

            const imageUrl = await streamUpload(req.file.buffer);
            updateFields.image = imageUrl;
        }

        const updateResult = await collection.updateOne(
            { _id: new ObjectId(artworkId) },
            { $set: updateFields }
        );

        if (updateResult.matchedCount === 0) {
            return res.status(404).send('Artwork not found');
        }

        res.status(200).send('Artwork updated successfully');
    } catch (error) {
        console.error('Error updating artwork:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
