const multer = require('multer');
const multerS3 = require('multer-s3');
const { s3Client } = require('../config/awsConfig');

const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME,
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString() + '-' + file.originalname)
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // limite à 5MB
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