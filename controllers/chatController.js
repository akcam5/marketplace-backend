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
    .populate('participants', 'name email')
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
    const { page = 1, limit = 50, after } = req.query;
    const userId = req.user.id;

    // Vérifier si l'utilisateur a accès à la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });

    if (!conversation) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied to this conversation' 
      });
    }

    // Construire la requête de base
    let query = { conversation: conversationId };
    
    // Si 'after' est spécifié, ne récupérer que les nouveaux messages
    if (after) {
      query.createdAt = { $gt: new Date(after) };
    }

    // Récupérer les messages avec pagination et population
    const messages = await Message.find(query)
      .populate({
        path: 'sender',
        select: 'username email' // Ne sélectionner que les champs nécessaires
      })
      .sort({ createdAt: after ? 1 : -1 }) // Ordre chronologique pour les nouveaux messages, anti-chronologique pour l'historique
      .skip(!after ? (Number(page) - 1) * Number(limit) : 0) // Skip seulement pour la pagination de l'historique
      .limit(Number(limit))
      .lean(); // Utiliser lean() pour de meilleures performances

    // Compter le nombre total de messages pour la pagination
    // Ne pas compter si on cherche juste les nouveaux messages
    let total = 0;
    if (!after) {
      total = await Message.countDocuments({ conversation: conversationId });
    }

    // Marquer les messages non lus comme lus
    // Note: On fait ça après la requête principale pour ne pas bloquer la réponse
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        read: false
      },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        } 
      }
    ).exec();

    // Préparer la réponse
    const response = {
      messages: after ? messages : messages.reverse(), // Inverser l'ordre pour l'historique
      success: true
    };

    // Ajouter les informations de pagination seulement si nécessaire
    if (!after) {
      response.pagination = {
        totalMessages: total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        hasMore: page * limit < total,
        messagesPerPage: Number(limit)
      };
    }

    // Ajouter des métadonnées utiles
    response.metadata = {
      conversationId,
      lastMessageAt: messages.length > 0 ? messages[messages.length - 1].createdAt : null,
      messageCount: messages.length
    };

    res.json(response);

  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching messages',
      error: error.message
    });
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