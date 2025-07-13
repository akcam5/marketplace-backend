const { s3Client } = require('./awsConfig');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Extract S3 key from a full URL
 * @param {string} url - Full S3 URL
 * @returns {string} S3 key
 */
const extractKeyFromUrl = (url) => {
  if (!url) return null;
  return url.split('/').pop();
};

/**
 * Delete a single image from S3
 * @param {string} imageUrl - Full S3 URL of the image
 * @returns {Promise} Result of S3 delete operation
 */
const deleteS3Image = async (imageUrl) => {
  try {
    const key = extractKeyFromUrl(imageUrl);
    if (!key) return null;
    
    return await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key
    }));
  } catch (error) {
    console.error(`Error deleting S3 image ${imageUrl}:`, error);
    // Don't throw to prevent blocking operations if S3 deletion fails
    return null;
  }
};

/**
 * Delete multiple images from S3
 * @param {Array<string>} imageUrls - Array of S3 image URLs
 * @returns {Promise<Array>} Results of S3 delete operations
 */
const deleteS3Images = async (imageUrls) => {
  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return [];
  }
  
  const deletePromises = imageUrls.map(url => deleteS3Image(url));
  return Promise.all(deletePromises);
};

module.exports = {
  deleteS3Image,
  deleteS3Images,
  extractKeyFromUrl
}; 