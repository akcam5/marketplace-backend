const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Listing = require('../models/Listing');
const User = require('../models/User');
const { sendNewMessageNotification } = require('./emailController');

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
    .populate('listing', 'title price images state')
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
    const userId = req.user.id;

    // Vérifier l'accès à la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    }).populate('participants', 'username email name');

    if (!conversation) {
      return res.status(403).json({ message: 'Access denied to this conversation' });
    }

    // Trouver le destinataire du message (l'autre participant)
    const recipient = conversation.participants.find(p => p._id.toString() !== userId.toString());
    
    // Vérifier si une notification doit être envoyée
    let shouldSendNotification = false;
    
    if (recipient) {
      console.log(`Destinataire identifié: ${recipient.email}, ID: ${recipient._id}`);
      
      // Vérifier s'il y a des messages précédents dans la conversation
      const messageCount = await Message.countDocuments({ 
        conversation: conversationId 
      });
      
      console.log(`Nombre total de messages dans la conversation: ${messageCount}`);
      
      // Configuration du délai minimum pour envoyer une notification (en minutes)
      const notificationThreshold = process.env.MESSAGE_NOTIFICATION_THRESHOLD 
        ? parseInt(process.env.MESSAGE_NOTIFICATION_THRESHOLD) 
        : 30; // 30 minutes par défaut
      
      console.log(`Seuil de notification configuré: ${notificationThreshold} minutes`);
      
      // Si c'est le premier message de la conversation, toujours envoyer une notification
      if (messageCount === 0) {
        console.log("Premier message de la conversation - envoi d'une notification");
        shouldSendNotification = true;
      } else {
        // Trouver le dernier message envoyé par cet expéditeur au destinataire
        const lastSentMessage = await Message.findOne({
          conversation: conversationId,
          sender: userId
        }).sort({ createdAt: -1 });
        
        if (!lastSentMessage) {
          // Premier message de cet expéditeur dans cette conversation
          console.log("Premier message de cet expéditeur - envoi d'une notification");
          shouldSendNotification = true;
        } else {
          // Calculer le temps écoulé depuis le dernier message
          const messageAge = new Date() - lastSentMessage.createdAt;
          const messageAgeMinutes = Math.floor(messageAge / (60 * 1000));
          
          console.log(`Dernier message de l'expéditeur date de ${messageAgeMinutes} minutes et est ${lastSentMessage.read ? 'lu' : 'non lu'}`);
          
          // Envoyer une notification si le dernier message est non lu ET date de plus de X minutes
          shouldSendNotification = 
            !lastSentMessage.read && 
            messageAge > (notificationThreshold * 60 * 1000);
          
          console.log(`Doit envoyer une notification: ${shouldSendNotification ? 'Oui' : 'Non'}`);
        }
      }
      
      // Envoyer la notification si nécessaire
      if (shouldSendNotification) {
        try {
          // Récupérer l'expéditeur pour obtenir son nom
          const sender = await User.findById(userId);
          const senderName = sender ? (sender.name || sender.username || "Utilisateur") : "Utilisateur";
          
          await sendNewMessageNotification(
            recipient.email, 
            senderName
          );
          console.log(`Notification envoyée à ${recipient.email}`);
        } catch (err) {
          console.error('Erreur lors de l\'envoi de la notification:', err);
        }
      }
    }
    
    // Créer et sauvegarder le nouveau message
    const message = new Message({
      conversation: conversationId,
      sender: userId,
      content
    });
    await message.save();

    // Mettre à jour lastMessage de la conversation
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
        select: 'username email name' // Ne sélectionner que les champs nécessaires
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