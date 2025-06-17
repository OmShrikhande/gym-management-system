# GymFlow Backend API

This is the backend API for the GymFlow gym management system.

## Setup

1. Install dependencies:
```
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gymflow
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=90d
```

3. Start the server:
```
npm run dev
```

## API Endpoints

### Authentication

- **POST /api/auth/signup** - Register a new user
  - Required fields: name, email, password
  - Optional fields: role (default: 'member')

- **POST /api/auth/login** - Login a user
  - Required fields: email, password

- **GET /api/auth/me** - Get current user profile (requires authentication)

## User Roles

The system supports the following user roles:
- super-admin: System administrator with full access
- gym-owner: Owner of a gym with management access
- trainer: Gym trainer with limited access
- member: Regular gym member with basic access

## Authentication

The API uses JWT (JSON Web Token) for authentication. To access protected routes, include the token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```