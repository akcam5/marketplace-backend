const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../config/awsConfig');
const path = require('path');
const crypto = require('crypto');

/**
 * Normalize a filename by:
 * 1. Removing special characters and spaces
 * 2. Converting to lowercase
 * 3. Adding a unique hash to prevent collisions
 * 4. Preserving the original file extension
 * 
 * @param {string} filename - Original filename
 * @returns {string} - Normalized filename
 */
const normalizeFilename = (filename) => {
  // Extract the file extension
  const extension = path.extname(filename).toLowerCase();
  
  // Get the filename without extension
  const nameWithoutExt = path.basename(filename, extension);
  
  // Remove special characters, replace spaces with hyphens, and convert to lowercase
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with a single one
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .toLowerCase();
  
  // Generate a short hash (8 characters) to ensure uniqueness
  const uniqueHash = crypto.randomBytes(4).toString('hex');
  
  // Generate timestamp for additional uniqueness
  const timestamp = Date.now().toString();
  
  // Combine elements to create the final filename
  return `${sanitizedName}-${uniqueHash}-${timestamp}${extension}`;
};

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      const normalizedFilename = normalizeFilename(file.originalname);
      cb(null, normalizedFilename);
    }
  }),
  limits: {
    fileSize: 15 * 1024 * 1024, // limite à 15MB
    files: 10 // limite à 10 fichiers
  },
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
      return cb(new Error('Seuls les fichiers image sont autorisés!'), false);
    }
    cb(null, true);
  }
});

module.exports = upload;