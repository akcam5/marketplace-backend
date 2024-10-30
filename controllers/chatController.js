const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');

exports.createConversation = async (req, res) => {
  try {
    const { listingId, sellerId } = req.body;
    
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user.id, sellerId] },
      listing: listingId
    });

    if (existingConversation) {
      return res.status(200).json(existingConversation);
    }

    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const conversation = new Conversation({
      participants: [req.user.id, sellerId],
      listing: listingId
    });

    await conversation.save();

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username email')
      .populate('listing', 'title price');

    res.status(201).json(populatedConversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'username email')
    .populate('listing', 'title price images')
    .sort({ lastMessage: -1 });

    const conversationsWithUnread = await Promise.all(conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        sender: { $ne: req.user.id },
        read: false
      });
      
      return {
        ...conv.toObject(),
        unreadCount
      };
    }));

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    const message = new Message({
      conversation: conversationId,
      sender: req.user.id,
      content
    });

    await message.save();

    conversation.lastMessage = Date.now();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username email');

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user.id
    });

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Message.countDocuments({ conversation: conversationId });

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user.id },
        read: false
      },
      { $set: { read: true } }
    );

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: page * limit < total
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      conversation: { $in: await Conversation.find({ participants: req.user.id }).select('_id') },
      sender: { $ne: req.user.id },
      read: false
    });

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Error counting unread messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
};