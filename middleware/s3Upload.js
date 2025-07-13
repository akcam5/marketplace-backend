const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../config/awsConfig');
const { compressImage } = require('../config/imageCompression');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
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
 * @param {string} extension - File extension to use
 * @returns {string} - Normalized filename
 */
const normalizeFilename = (filename, extension = null) => {
  // Use provided extension or extract from filename
  const fileExtension = extension || path.extname(filename).toLowerCase();
  
  // Get the filename without extension
  const nameWithoutExt = path.basename(filename, path.extname(filename));
  
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
  return `${sanitizedName}-${uniqueHash}-${timestamp}${fileExtension}`;
};

// Custom storage engine for compression
const compressedS3Storage = multerS3({
  s3: s3Client,
  bucket: process.env.AWS_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, {fieldName: file.fieldname});
  },
  key: function (req, file, cb) {
    const normalizedFilename = normalizeFilename(file.originalname);
    cb(null, normalizedFilename);
  },
  contentType: function (req, file, cb) {
    // Will be updated after compression
    cb(null, file.mimetype);
  }
});

// Override the _handleFile method to add compression
const originalHandleFile = compressedS3Storage._handleFile;
compressedS3Storage._handleFile = function(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    const chunks = [];
    
    file.stream.on('data', chunk => chunks.push(chunk));
    file.stream.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        
        // Compress the image
        const compressed = await compressImage(buffer, file.mimetype);
        
        // Generate filename with correct extension
        const normalizedFilename = normalizeFilename(file.originalname, compressed.extension);
        
        // Upload compressed image directly to S3
        const uploadParams = {
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: normalizedFilename,
          Body: compressed.buffer,
          ContentType: compressed.mimetype,
          Metadata: {
            fieldName: file.fieldname
          }
        };
        
        const result = await s3Client.send(new PutObjectCommand(uploadParams));
        
        cb(null, {
          bucket: process.env.AWS_BUCKET_NAME,
          key: normalizedFilename,
          location: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${normalizedFilename}`,
          etag: result.ETag,
          contentType: compressed.mimetype,
          metadata: uploadParams.Metadata,
          size: compressed.buffer.length
        });
      } catch (error) {
        console.error('Error compressing and uploading image:', error);
        cb(error);
      }
    });
    
    file.stream.on('error', (error) => {
      cb(error);
    });
  } else {
    // For non-image files, use original handler
    originalHandleFile.call(this, req, file, cb);
  }
};

const upload = multer({
  storage: compressedS3Storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for uncompressed uploads (will be compressed to ~7MB)
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