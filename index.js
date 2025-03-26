const express = require('express');
const artworkRoutes = require('./routes/artworks');
const { connectToDatabase } = require('./db/connection');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON

// Connect to the database once, this can be used later for routes like '/artworks'
async function initDatabase() {
    try {
        await connectToDatabase(); // Ensure connection is working on startup
        console.log('Connected to MongoDB!');
    } catch (error) {
        console.error('Error connecting to MongoDB', error);
    }
}

initDatabase(); // Initialize DB connection when the server starts

// Use artworkRoutes to handle artwork-related API calls
app.use('/artworks', artworkRoutes);

// Serve static files for admin panel
// Ideally, you'd want to make sure this path is protected if needed later
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Route for Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'dashboard.html'));
});

// Route for Add Artwork page
app.get('/admin/add-artwork', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin', 'add-artwork.html'));
});

// Default route
app.get('/', (req, res) => {
    res.send("Welcome to Lirin Art API site");
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
