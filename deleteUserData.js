require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Listing = require('./models/Listing');
const Conversation = require('./models/Conversation');
const Message = require('./models/Message');

// Function to delete all user data based on email
async function deleteUserData(email) {
  try {
    console.log(`Starting deletion process for user with email: ${email}`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found');
      await mongoose.disconnect();
      return;
    }
    
    const userId = user._id;
    console.log(`Found user with ID: ${userId}`);
    
    // Step 1: Find and delete all listings created by the user
    const deletedListings = await Listing.find({ createdBy: userId });
    const listingIds = deletedListings.map(listing => listing._id);
    console.log(`Found ${deletedListings.length} listings to delete`);
    
    // Step 2: Find and delete all conversations related to the user
    // This includes conversations where the user is a participant or related to user's listings
    const conversationsToDelete = await Conversation.find({
      $or: [
        { participants: userId },
        { listing: { $in: listingIds } }
      ]
    });
    
    const conversationIds = conversationsToDelete.map(conv => conv._id);
    console.log(`Found ${conversationsToDelete.length} conversations to delete`);
    
    // Step 3: Delete all messages in those conversations or sent by the user
    const messagesDeleted = await Message.deleteMany({
      $or: [
        { conversation: { $in: conversationIds } },
        { sender: userId }
      ]
    });
    console.log(`Deleted ${messagesDeleted.deletedCount} messages`);
    
    // Step 4: Delete the conversations
    const conversationsDeleted = await Conversation.deleteMany({
      _id: { $in: conversationIds }
    });
    console.log(`Deleted ${conversationsDeleted.deletedCount} conversations`);
    
    // Step 5: Delete all listings
    const listingsDeleted = await Listing.deleteMany({ createdBy: userId });
    console.log(`Deleted ${listingsDeleted.deletedCount} listings`);
    
    // Step 6: Finally delete the user
    await User.deleteOne({ _id: userId });
    console.log(`Deleted user with email: ${email}`);
    
    console.log('All user data has been successfully deleted');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (error) {
    console.error('Error deleting user data:', error);
    await mongoose.disconnect();
  }
}

// Check if email is provided as command line argument
if (process.argv.length < 3) {
  console.log('Please provide an email address as an argument');
  console.log('Example: node deleteUserData.js user@example.com');
  process.exit(1);
}

const userEmail = process.argv[2];
deleteUserData(userEmail); 