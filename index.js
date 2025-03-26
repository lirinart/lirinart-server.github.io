// index.js
const express = require('express');
const artworkRoutes = require('./routes/artworks');
const { connectToDatabase } = require('./db/connection');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());  // Middleware to parse JSON
app.use('/artworks', artworkRoutes);  // Using the artwork routes

app.get('/', (req, res) => {
    res.send("Welcome to the LirinArt API");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
