// models/artwork.js
const Artwork = {
    title: String,
    description: String,
    imageURL: String,
    tags: [String],
    collections: [String],
    createdAt: { type: Date, default: Date.now }
};

module.exports = Artwork;
