# Marketplace App Backend

A robust, scalable Node.js/Express.js backend application for a marketplace platform with MongoDB database integration, featuring user authentication, listing management, real-time messaging, image upload capabilities, and email notifications.

## 🚀 Features

- **User Authentication**: JWT-based authentication with secure password hashing
- **Listing Management**: CRUD operations with advanced search and filtering
- **Real-time Messaging**: Direct messaging between users with smart notifications
- **Image Upload**: AWS S3 integration for profile pictures and listing images
- **Email Notifications**: Automated welcome emails and message notifications
- **Advanced Search**: Keyword search with category and price filtering
- **Pagination & Sorting**: Efficient data retrieval with multiple sorting options

## 🏗️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: AWS S3
- **Email Service**: Resend
- **Security**: bcryptjs for password hashing
- **Image Processing**: Multer with S3 integration

## 📁 Project Structure

```
marketplace-app-backend/
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── models/                   # Database schemas
├── controllers/              # Business logic
├── routes/                   # API endpoints
│   ├── auth.js              # Authentication routes
│   ├── listings.js          # Listing management routes
│   ├── chat.js              # Messaging routes
│   └── email.js             # Email service routes
├── middleware/               # Authentication & file upload
├── config/                   # AWS and email configuration
└── documentation/            # API documentation files
```

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dankrecoum/marketplace-app-backend.git
   cd marketplace-app-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/marketplace
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   
   # AWS S3 Configuration
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=your-aws-region
   AWS_S3_BUCKET_NAME=your-s3-bucket-name
   
   # Email Configuration (Resend)
   RESEND_API_KEY=your-resend-api-key
   
   # Notification Settings
   MESSAGE_NOTIFICATION_THRESHOLD=30
   ```

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start running on `http://localhost:5000` (or your configured PORT).

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration with welcome email
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/profile/picture` - Upload profile picture

### Listing Management Endpoints
- `POST /api/listings` - Create new listing
- `GET /api/listings` - Get all listings (with pagination/sorting)
- `GET /api/listings/search` - Advanced search with filters
- `GET /api/listings/recent` - Get 6 most recent listings
- `GET /api/listings/:id` - Get specific listing details
- `GET /api/listings/seller/:sellerId` - Get seller's listings
- `PUT /api/listings/:id` - Update listing
- `DELETE /api/listings/:id` - Delete listing
- `POST /api/listings/upload-images` - Upload listing images

### Messaging Endpoints
- `POST /api/chat/conversations` - Create new conversation
- `GET /api/chat/conversations` - Get user's conversations
- `POST /api/chat/messages` - Send message
- `GET /api/chat/conversations/:id/messages` - Get conversation messages
- `GET /api/chat/messages/unread` - Get unread message count

### Email Service Endpoints
- `POST /api/email` - Send custom email

## 🔍 Advanced Search Features

The listing search endpoint supports:
- **Keyword Search**: Full-text search in title and description
- **Category Filtering**: Three-level category hierarchy
- **Price Range**: Minimum and maximum price filters
- **Sorting Options**:
  - Recent (newest first)
  - Older (oldest first)
  - Price ascending (lowest to highest)
  - Price descending (highest to lowest)
- **Pagination**: Configurable page size with metadata

## 💬 Smart Notification System

The messaging system includes intelligent email notifications:

- **First Message**: Always sends notification for initial contact
- **Subsequent Messages**: Only sends notifications if:
  - Previous message from sender is unread AND
  - More than X minutes have passed (configurable via `MESSAGE_NOTIFICATION_THRESHOLD`)
- **Spam Prevention**: Prevents multiple notifications for rapid-fire messages

### Configuration

The notification threshold can be configured via the `MESSAGE_NOTIFICATION_THRESHOLD` environment variable (in minutes). Default value is 30 minutes.

Example:
```env
MESSAGE_NOTIFICATION_THRESHOLD=30
```

To disable notifications (except for first messages), set a very high value.

## 🗄️ Database Models

### User Model
- name, email, password (hashed)
- town, neighborhood, phoneNumber
- profilePicture (S3 URL)
- passwordResetToken, passwordResetExpires

### Listing Model
- title, description, price, state
- mainCategory, subCategory, subSubCategory
- images (S3 URLs, max 10)
- createdBy (User reference)

### Conversation & Message Models
- Conversation: participants, listing, lastMessage
- Message: conversation, sender, content, read status

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Middleware for route protection
- **Input Validation**: Request validation and sanitization
- **CORS Configuration**: Cross-origin resource sharing setup

## 📖 Additional Documentation

For detailed API documentation and examples, refer to:
- `getListings_API_Documentation.txt` - Listing retrieval endpoints
- `searchListings_API_Documentation.txt` - Search functionality
- `PROJECT_DOCUMENTATION.md` - Comprehensive project overview

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.
