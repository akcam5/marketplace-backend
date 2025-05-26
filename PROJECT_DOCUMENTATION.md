# Marketplace App Backend - Project Documentation

## Executive Summary

This document provides a comprehensive overview of the Kadeel backend that has been developed for your project. The backend is a robust, scalable Node.js/Express.js application with MongoDB database integration, featuring user authentication, listing management, real-time messaging, image upload capabilities, and email notifications.

## 🏗️ Architecture Overview

### Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Email Service**: Resend
- **Image Processing**: Multer with S3 integration
- **Security**: bcryptjs for password hashing

### Project Structure
```
marketplace-app-backend/
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── models/                   # Database schemas
├── controllers/              # Business logic
├── routes/                   # API endpoints
├── middleware/               # Authentication & file upload
├── config/                   # AWS and email configuration
└── documentation/            # API documentation files
```

## 🔐 Authentication System

### Features Implemented
- **User Registration**: Secure account creation with password hashing
- **User Login**: JWT-based authentication with 3-hour token expiration
- **Password Reset**: Email-based password recovery with 10-minute token expiration
- **Profile Management**: Update user information and profile pictures
- **Secure Middleware**: JWT verification for protected routes

### User Data Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (hashed),
  town: String (required),
  neighborhood: String (required),
  phoneNumber: String (optional),
  profilePicture: String (S3 URL),
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: Date
}
```

### API Endpoints
- `POST /api/auth/register` - User registration (includes welcome email)
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/profile/picture` - Upload profile picture

## 📝 Listing Management System

### Core Features
- **CRUD Operations**: Create, read, update, delete listings
- **Advanced Search**: Keyword, category, and price range filtering
- **Pagination & Sorting**: Efficient data retrieval with multiple sorting options
- **Image Management**: Multiple image upload with S3 storage
- **State Management**: Active, on-hold, and sold states
- **Seller Profiles**: View all listings by specific sellers

### Listing Data Model
```javascript
{
  title: String (required),
  description: String (required),
  price: Number (required, allows 0),
  state: String (enum: 'active', 'onhold', 'sold'),
  mainCategory: String (required),
  subCategory: String (required),
  subSubCategory: String,
  images: [String] (S3 URLs, max 10),
  createdBy: ObjectId (User reference),
  created: Date,
  updated: Date
}
```

### Advanced Search & Filtering
- **Keyword Search**: Full-text search in title and description
- **Category Filtering**: Three-level category hierarchy
- **Price Range**: Minimum and maximum price filters
- **Sorting Options**:
  - Recent (newest first)
  - Older (oldest first)
  - Price ascending (lowest to highest)
  - Price descending (highest to lowest)
- **Pagination**: Configurable page size with metadata

### API Endpoints
- `POST /api/listings` - Create new listing
- `GET /api/listings` - Get all listings (with pagination/sorting)
- `GET /api/listings/search` - Advanced search with filters
- `GET /api/listings/recent` - Get 6 most recent listings
- `GET /api/listings/:id` - Get specific listing details
- `GET /api/listings/seller/:sellerId` - Get seller's listings
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/upload-images` - Upload listing images
- `PUT /api/listings/:id/images` - Update listing images

## 💬 Messaging System

### Features
- **Real-time Conversations**: Direct messaging between users
- **Listing-based Chats**: Conversations tied to specific listings
- **Message Status**: Read/unread tracking
- **Smart Notifications**: Intelligent email notifications to prevent spam
- **Conversation Management**: List all user conversations with unread counts

### Messaging Data Models

**Conversation Model**:
```javascript
{
  participants: [ObjectId] (User references),
  listing: ObjectId (Listing reference),
  lastMessage: Date,
  createdAt: Date
}
```

**Message Model**:
```javascript
{
  conversation: ObjectId (Conversation reference),
  sender: ObjectId (User reference),
  content: String (required),
  read: Boolean (default: false),
  createdAt: Date
}
```

### Smart Notification System
The messaging system includes an intelligent email notification feature:

- **First Message**: Always sends notification for initial contact
- **Subsequent Messages**: Only sends notifications if:
  - Previous message from sender is unread AND
  - More than 30 minutes have passed (configurable)
- **Spam Prevention**: Prevents multiple notifications for rapid-fire messages
- **Configurable Threshold**: Customizable notification timing

### API Endpoints
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/messages` - Send message
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `GET /api/chat/messages/unread` - Get unread message count

## 📧 Email Notification System

### Email Services
- **Password Reset**: Secure password recovery emails
- **Message Notifications**: New message alerts
- **Welcome Emails**: Automated welcome emails for new user registrations
- **Professional Templates**: HTML-formatted emails with branding

### Email Features
- **Service Provider**: Resend integration
- **Professional Branding**: Branded email templates
- **Responsive Design**: Mobile-friendly email layouts
- **Reliable Delivery**: High-deliverability email service
- **Automated Welcome**: Welcome emails sent automatically upon user registration
- **Error Handling**: Non-blocking email sending (registration continues even if email fails)

### Welcome Email Details
- **Trigger**: Automatically sent when a new user creates an account
- **Content**: Personalized welcome message with user's name
- **Features**: 
  - Welcome message and congratulations
  - Quick start guide with actionable items
  - Direct link to start exploring the marketplace
  - Professional branding consistent with Kadeel
- **Reliability**: Email failures don't block user registration process

### API Endpoints
- `POST /api/email` - Send custom email (admin function)

### Email Templates
- **Welcome Email**: Sent to new users upon registration
- **Password Reset**: Secure password recovery with time-limited tokens
- **Message Notifications**: Real-time chat message alerts

## 🖼️ Image Management System

### Features
- **AWS S3 Integration**: Scalable cloud storage
- **Multiple Upload**: Support for up to 10 images per listing
- **File Validation**: Image format and size restrictions
- **Automatic Cleanup**: S3 deletion when images are removed
- **Profile Pictures**: User avatar upload and management

### Upload Specifications
- **Supported Formats**: JPG, JPEG, PNG, GIF
- **File Size Limit**: 5MB per image
- **Maximum Images**: 10 per listing
- **Storage**: AWS S3 with unique file naming

### API Endpoints
- `POST /api/listings/upload-images` - Upload listing images
- `PUT /api/listings/:id/images` - Update listing images
- `PUT /api/auth/profile/picture` - Upload profile picture

## 🚀 Deployment & Setup

### Installation Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start development server: `npm run dev`
5. Start production server: `npm start`

### Dependencies
- **Core**: express, mongoose, cors, dotenv
- **Authentication**: jsonwebtoken, bcryptjs
- **File Upload**: multer, multer-s3
- **AWS**: @aws-sdk/client-s3, @aws-sdk/lib-storage
- **Email**: resend
- **Development**: nodemon

## 📊 API Performance Features

### Pagination System
- **Backward Compatible**: Existing API calls work unchanged
- **Configurable Page Size**: Client can specify items per page
- **Metadata**: Total count, page info, navigation flags
- **Efficient Queries**: MongoDB skip/limit optimization

### Sorting Capabilities
- **Multiple Options**: Date and price-based sorting
- **Case Insensitive**: Flexible parameter handling
- **Secondary Sorting**: Consistent ordering with tiebreakers
- **Default Behavior**: Sensible defaults for all endpoints

### Search Optimization
- **Index Support**: Optimized for MongoDB text search
- **Filter Combination**: Multiple search criteria support
- **State Filtering**: Automatic exclusion of sold items
- **Performance**: Efficient query building and execution

## 🛡️ Security Features

### Authentication Security
- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: 3-hour session timeout
- **Password Reset**: Secure token-based recovery

### Data Protection
- **Input Validation**: Comprehensive request validation
- **Authorization Checks**: User ownership verification
- **CORS Configuration**: Cross-origin request handling
- **Secure Error Handling**: Protected error messages

### File Upload Security
- **File Type Validation**: Image format restrictions
- **Size Limits**: 5MB per file protection
- **Secure Storage**: AWS S3 with proper permissions
- **Cleanup**: Automatic removal of unused files

## 📈 Scalability Considerations

### Database Design
- **Efficient Schemas**: Optimized MongoDB collections
- **Reference Relationships**: Proper data normalization
- **Indexing Strategy**: Performance-optimized queries
- **Pagination**: Memory-efficient data retrieval

### Cloud Integration
- **AWS S3**: Scalable file storage
- **External Email Service**: Reliable email delivery
- **Stateless Design**: Horizontal scaling ready
- **Environment Configuration**: Deployment flexibility

## 🔍 Monitoring & Logging

### Request Logging
- **Automatic Logging**: All API requests logged with timestamps
- **Performance Monitoring**: Request timing and status codes
- **Development Support**: Console-based debugging

### System Monitoring
- **Error Tracking**: Comprehensive error logging
- **Email Delivery**: Notification status tracking
- **Debug Information**: Development-friendly output

## 📋 Testing & Quality Assurance

### API Testing
- **Comprehensive Test Cases**: Detailed test scenarios provided
- **Sorting Validation**: Extensive sorting functionality tests
- **Pagination Testing**: Complete pagination workflow tests
- **Error Handling**: Validation error testing

### Documentation
- **API Documentation**: Detailed endpoint documentation
- **Usage Examples**: Real-world usage scenarios
- **Migration Guide**: Backward compatibility information

## 🎯 Business Value Delivered

### Core Marketplace Features
1. **Complete User Management**: Registration, authentication, profiles
2. **Robust Listing System**: Full CRUD with advanced search
3. **Real-time Communication**: Messaging between buyers/sellers
4. **Professional Image Handling**: Cloud-based storage and management
5. **Smart Notifications**: Intelligent email system

### Advanced Capabilities
1. **Scalable Architecture**: Ready for growth and high traffic
2. **Modern API Design**: RESTful with pagination and sorting
3. **Security Best Practices**: Industry-standard security measures
4. **Cloud Integration**: AWS and third-party service integration
5. **Developer-Friendly**: Comprehensive documentation and testing

### Future-Ready Design
- **Extensible Structure**: Easy to add new features
- **API Versioning Ready**: Backward compatibility maintained
- **Microservice Compatible**: Modular design for scaling
- **Mobile App Ready**: RESTful API perfect for mobile integration

## 📞 Support & Maintenance

### Code Quality
- **Clean Architecture**: Well-organized, maintainable code
- **Comprehensive Documentation**: Extensive inline and external documentation
- **Best Practices**: Industry-standard development practices
- **Modular Design**: Easy to extend and modify

### Deployment Support
- **Flexible Configuration**: Environment-based setup
- **Database Setup**: MongoDB configuration guidance
- **Cloud Services**: AWS and email service integration
- **Monitoring**: Built-in logging and tracking

## 🌟 Key Achievements

### Technical Excellence
- **Production-Ready**: Enterprise-level code quality
- **Performance Optimized**: Efficient database queries and caching
- **Security Focused**: Comprehensive security implementation
- **Scalable Design**: Built for growth and expansion

### Business Impact
- **Complete Marketplace Solution**: All essential features implemented
- **User Experience**: Smooth, responsive API design
- **Reliability**: Robust error handling and validation
- **Maintainability**: Clean, documented, and testable code

---

This marketplace backend provides a solid foundation for your application with enterprise-level features, security, and scalability. The system is production-ready and includes all necessary components for a successful marketplace platform. 