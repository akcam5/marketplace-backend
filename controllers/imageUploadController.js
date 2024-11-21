const { s3Client, Upload } = require('../config/awsConfig');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const upload = require('../middleware/s3Upload');

exports.uploadImages = upload.array('images', 10);
exports.uploadProfilePicture = upload.single('profilePicture');

exports.handleUpload = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send('Aucun fichier n\'a été uploadé.');
  }

  try {
    
    const imageUrls = req.files.map(file => file.location);

    res.status(200).json({ imageUrls });
  } catch (error) {
    console.error('Erreur lors de l\'upload des images:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload des images', error: error.message });
  }
};

exports.handleUploadProfilePicture = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Aucun fichier n\'a été uploadé.');
  }

  try {
    const { location } = req.file;
    res.status(200).json({ location });
  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'image:', error);
    res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image', error: error.message });
  }
};