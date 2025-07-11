# User Data Deletion Script

Simple script to delete all data associated with a user from the MongoDB database.

## Requirements

- Node.js
- MongoDB connection (configured in .env file)

## Setup

1. Ensure your `.env` file contains the MongoDB connection string:
   ```
   MONGODB_URI=mongodb://your-connection-string
   ```

2. Make sure all dependencies are installed:
   ```
   npm install
   ```

## Usage

Run the script with the user's email address as an argument:

```
node deleteUserData.js user@example.com
```

## What it deletes

The script performs a cascading deletion of:
- User's listings
- Conversations involving the user or their listings
- Messages in those conversations
- The user account itself

## Output

The script logs each step of the deletion process, showing:
- User ID found
- Number of listings deleted
- Number of conversations deleted
- Number of messages deleted
- Confirmation of user deletion 