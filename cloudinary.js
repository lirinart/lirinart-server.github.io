const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dlsh9sjup', // Your Cloudinary cloud name
  api_key: '855499199916767', // Your Cloudinary API key
  api_secret: 'FkrQiDRrlge6tpRPbDDZYzJPMUQ', // Your Cloudinary API secret
});

module.exports = cloudinary;
