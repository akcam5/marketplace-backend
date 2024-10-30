const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.post('/conversations', auth, chatController.createConversation);
router.get('/conversations', auth, chatController.getConversations);
router.post('/messages', auth, chatController.sendMessage);
router.get('/conversations/:conversationId/messages', auth, chatController.getMessages);
router.get('/messages/unread', auth, chatController.getUnreadCount);

module.exports = router;