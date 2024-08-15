# Marketplace App Backend

Welcome to the backend documentation for the Marketplace App. This README will guide you through the setup and usage of the backend server.

## Installation

To get started, follow these steps:

1. Clone the repository: `git clone https://github.com/dankrecoum/marketplace-app-backend.git`
2. Navigate to the project directory: `cd marketplace-app-backend`
3. Install the dependencies: `npm install`

## Configuration

Before running the server, you need to configure the environment variables. Create a `.env` file in the root directory and add the following variables:

TODO: Update this section with project specific data
```
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=marketplace
DB_USER=your-username
DB_PASSWORD=your-password
```

Make sure to replace `your-username` and `your-password` with your own database credentials.

## Usage

To start the server, run the following command:

```
npm run dev
```

The server will start running on `http://localhost:5000`.

## API Documentation

For detailed information about the API endpoints and how to use them, please refer to the [API documentation](api-docs.md).
