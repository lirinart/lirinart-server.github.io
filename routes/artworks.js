// routes/artworks.js
const express = require('express');
const { getArtworks, createArtwork } = require('../controllers/artworkController');
const router = express.Router();

router.get('/', getArtworks);  // Get all artworks
router.post('/', createArtwork);  // Create a new artwork

module.exports = router;
