const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const imageUploadController = require('../controllers/imageUploadController');
const auth = require('../middleware/auth');

router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.get('/user', auth, authController.getUser);
router.put('/profile', auth, authController.updateUser);

//images upload
router.put('/profile/picture', auth, imageUploadController.uploadProfilePicture, imageUploadController.handleUploadProfilePicture);

module.exports = router;