const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.createUser);
router.post('/login', authController.loginUser);
router.get('/user', auth, authController.getUser);
router.put('/profile', auth, authController.updateUser);

module.exports = router;