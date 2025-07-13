const sharp = require('sharp');

/**
 * Compress an image buffer while maintaining quality and aspect ratio
 * @param {Buffer} buffer - Original image buffer
 * @param {string} mimetype - Original image MIME type
 * @param {number} maxSizeBytes - Maximum file size in bytes (default: 7MB)
 * @returns {Promise<{buffer: Buffer, mimetype: string, extension: string}>} - Compressed image data
 */
const compressImage = async (buffer, mimetype, maxSizeBytes = 7 * 1024 * 1024) => {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Determine output format based on input type and optimization
    let outputFormat = 'jpeg';
    let outputMimetype = 'image/jpeg';
    let extension = '.jpg';
    
    // For PNG images with transparency, keep as PNG
    if (mimetype === 'image/png' && metadata.channels === 4) {
      outputFormat = 'png';
      outputMimetype = 'image/png';
      extension = '.png';
    }
    
    // For WebP support, we can convert to WebP for better compression
    // But keeping original format for compatibility
    if (mimetype === 'image/webp') {
      outputFormat = 'webp';
      outputMimetype = 'image/webp';
      extension = '.webp';
    }
    
    // Start with high quality settings
    let quality = 85;
    let compressed;
    
    // Compress the image
    do {
      const sharpInstance = sharp(buffer);
      
      // Apply compression based on format
      if (outputFormat === 'jpeg') {
        compressed = await sharpInstance
          .jpeg({ 
            quality: quality,
            progressive: true,
            mozjpeg: true // Use mozjpeg encoder for better compression
          })
          .toBuffer();
      } else if (outputFormat === 'png') {
        compressed = await sharpInstance
          .png({ 
            quality: quality,
            compressionLevel: 9,
            progressive: true
          })
          .toBuffer();
      } else if (outputFormat === 'webp') {
        compressed = await sharpInstance
          .webp({ 
            quality: quality,
            effort: 6 // Higher effort for better compression
          })
          .toBuffer();
      }
      
      // If still too large, reduce quality
      if (compressed.length > maxSizeBytes && quality > 60) {
        quality -= 5;
      } else {
        break;
      }
    } while (compressed.length > maxSizeBytes && quality >= 60);
    
    // If still too large after quality reduction, resize the image
    if (compressed.length > maxSizeBytes) {
      let resizeRatio = 0.9;
      
      do {
        const newWidth = Math.floor(metadata.width * resizeRatio);
        const newHeight = Math.floor(metadata.height * resizeRatio);
        
        const sharpInstance = sharp(buffer)
          .resize(newWidth, newHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        
        if (outputFormat === 'jpeg') {
          compressed = await sharpInstance
            .jpeg({ 
              quality: quality,
              progressive: true,
              mozjpeg: true
            })
            .toBuffer();
        } else if (outputFormat === 'png') {
          compressed = await sharpInstance
            .png({ 
              quality: quality,
              compressionLevel: 9,
              progressive: true
            })
            .toBuffer();
        } else if (outputFormat === 'webp') {
          compressed = await sharpInstance
            .webp({ 
              quality: quality,
              effort: 6
            })
            .toBuffer();
        }
        
        resizeRatio -= 0.1;
      } while (compressed.length > maxSizeBytes && resizeRatio > 0.5);
    }
    
    console.log(`Image compressed: ${buffer.length} bytes -> ${compressed.length} bytes (${Math.round((1 - compressed.length / buffer.length) * 100)}% reduction)`);
    
    return {
      buffer: compressed,
      mimetype: outputMimetype,
      extension: extension
    };
    
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original buffer if compression fails
    return {
      buffer: buffer,
      mimetype: mimetype,
      extension: getExtensionFromMimetype(mimetype)
    };
  }
};

/**
 * Get file extension from MIME type
 * @param {string} mimetype - MIME type
 * @returns {string} - File extension
 */
const getExtensionFromMimetype = (mimetype) => {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/avif': '.avif'
  };
  return extensions[mimetype] || '.jpg';
};

module.exports = {
  compressImage,
  getExtensionFromMimetype
}; 