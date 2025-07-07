# 🏋️‍♂️ GymFlow - Complete Gym Management System

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18.17.0-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Express.js-4.18.2-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/TailwindCSS-3.3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
</div>

<div align="center">
  <h3>🚀 A Modern, Full-Stack Gym Management Solution</h3>
  <p>Complete gym management system with member management, workout tracking, payment processing, and more!</p>
</div>

---

## 📋 Table of Contents

- [🌟 Features](#-features)
- [🎯 User Roles](#-user-roles)
- [🏗️ Architecture](#️-architecture)
- [⚡ Quick Start](#-quick-start)
- [🔧 Installation](#-installation)
- [🌍 Environment Setup](#-environment-setup)
- [🚀 Deployment](#-deployment)
- [🔒 Security Features](#-security-features)
- [📊 Database Schema](#-database-schema)
- [🛠️ API Documentation](#️-api-documentation)
- [🧪 Testing](#-testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Features

### 👥 Member Management
- **Member Registration** - Easy member onboarding with complete profile setup
- **Member Profiles** - Comprehensive member information management
- **Membership Types** - Basic, Premium, and VIP membership tiers
- **Member Status Tracking** - Active, inactive, and suspended status management
- **QR Code Generation** - Unique QR codes for each member for easy check-in
- **Search & Filter** - Advanced search and filtering capabilities

### 💪 Workout & Training
- **Workout Plans** - Create and assign custom workout plans
- **Exercise Library** - Comprehensive exercise database with instructions
- **Progress Tracking** - Track member progress and achievements
- **Trainer Assignment** - Assign trainers to specific members
- **Workout Scheduling** - Schedule workout sessions and classes

### 🍎 Nutrition Management
- **Diet Plans** - Create personalized diet plans for members
- **Meal Tracking** - Track daily meal intake and calories
- **Nutritional Analysis** - Detailed nutritional breakdown
- **Diet Recommendations** - AI-powered diet suggestions

### 💳 Payment & Subscriptions
- **Subscription Management** - Flexible subscription plans and billing
- **Payment Processing** - Secure payment gateway integration (Razorpay)
- **Invoice Generation** - Automated invoice generation and management
- **Payment History** - Complete payment tracking and history
- **Test Mode** - Test subscription functionality without real payments

### 📊 Analytics & Reporting
- **Dashboard Analytics** - Real-time gym statistics and insights
- **Member Analytics** - Member engagement and retention analysis
- **Revenue Reports** - Financial reporting and revenue tracking
- **Attendance Reports** - Member attendance tracking and analysis

### 🔐 Security & Access Control
- **Role-Based Access** - Super Admin, Gym Owner, Trainer, and Member roles
- **JWT Authentication** - Secure token-based authentication
- **Permission Management** - Granular permission controls
- **Data Encryption** - Secure data storage and transmission

### 📱 Mobile-First Design
- **Responsive Design** - Works perfectly on all devices
- **PWA Ready** - Progressive Web App capabilities
- **Touch-Friendly** - Optimized for mobile interactions
- **Offline Support** - Basic offline functionality

## 🎯 User Roles

### 🔑 Super Admin
- **System Management** - Complete system control and configuration
- **User Management** - Create and manage all user accounts
- **Gym Owner Management** - Oversee all gym owners and their gyms
- **System Settings** - Configure system-wide settings and preferences
- **Analytics Overview** - View system-wide analytics and reports

### 🏢 Gym Owner
- **Member Management** - Add, edit, and manage gym members
- **Trainer Management** - Hire and manage trainers
- **Subscription Management** - Manage gym subscriptions and payments
- **Workout Planning** - Create and assign workout plans
- **Diet Planning** - Create and manage diet plans
- **Analytics Dashboard** - View gym-specific analytics and reports

### 💪 Trainer
- **Assigned Members** - Manage assigned members
- **Workout Creation** - Create custom workout plans
- **Progress Tracking** - Track member progress and achievements
- **Diet Planning** - Create personalized diet plans
- **Schedule Management** - Manage training schedules

### 👤 Member
- **Profile Management** - Manage personal profile and preferences
- **Workout Access** - Access assigned workout plans
- **Diet Plans** - View and follow assigned diet plans
- **Progress Tracking** - Track personal fitness progress
- **QR Code** - Access unique QR code for gym entry

## 🏗️ Architecture

### Frontend (React.js)
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── forms/          # Form components
│   ├── layout/         # Layout components
│   ├── subscription/   # Subscription components
│   ├── tables/         # Table components
│   └── ui/             # Base UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── lib/                # Utility libraries
├── styles/             # CSS and styling
└── utils/              # Utility functions
```

### Backend (Node.js/Express)
```
Backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── config/         # Configuration files
│   └── utils/          # Utility functions
└── tests/              # Test files
```

## ⚡ Quick Start

### Prerequisites
- Node.js (v18.17.0 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/gymflow.git
cd gymflow
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd Backend
npm install
```

### 3. Environment Setup
```bash
# Create environment files
cp .env.example .env
cd Backend
cp .env.example .env
```

### 4. Start Development Servers
```bash
# Start frontend (in root directory)
npm run dev

# Start backend (in Backend directory)
cd Backend
npm run dev
```

### 5. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔧 Installation

### Detailed Installation Guide

#### 1. System Requirements
- **Operating System:** Windows 10/11, macOS 10.14+, or Linux
- **RAM:** Minimum 4GB (8GB recommended)
- **Storage:** 2GB free space
- **Internet:** Required for initial setup and payment processing

#### 2. Install Node.js
```bash
# Download and install Node.js from nodejs.org
# Verify installation
node --version
npm --version
```

#### 3. Install MongoDB
```bash
# Option 1: MongoDB Atlas (Cloud - Recommended)
# Sign up at mongodb.com/cloud/atlas

# Option 2: Local Installation
# Download from mongodb.com/try/download/community
```

## 🌍 Environment Setup

### Frontend Environment (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=GymFlow
VITE_APP_VERSION=1.0.0

# Other Configuration
VITE_ENABLE_ANALYTICS=true
VITE_ENVIRONMENT=development
```

### Backend Environment (Backend/.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/gymflow
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gymflow

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=90d

# Payment Configuration (Razorpay)
RAZORPAY_TEST_KEY_ID=your_razorpay_test_key_id
RAZORPAY_TEST_KEY_SECRET=your_razorpay_test_key_secret
RAZORPAY_LIVE_KEY_ID=your_razorpay_live_key_id
RAZORPAY_LIVE_KEY_SECRET=your_razorpay_live_key_secret
```

## 🚀 Deployment

### Frontend Deployment (Netlify)

#### 1. Build the Project
```bash
npm run build
```

#### 2. Deploy to Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Backend Deployment (Render)

#### 1. Create Render Account
- Sign up at render.com
- Connect your GitHub repository

#### 2. Configure Build Settings
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Node Version:** 18.17.0

#### 3. Environment Variables
Add all the backend environment variables from above section.

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **Role-Based Access Control** - Different permissions for different roles
- **Password Hashing** - Bcrypt password hashing
- **Session Management** - Secure session handling

### Data Security
- **Input Validation** - Comprehensive input validation and sanitization
- **SQL Injection Prevention** - NoSQL injection prevention
- **XSS Protection** - Cross-site scripting protection
- **CSRF Protection** - Cross-site request forgery protection

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['super-admin', 'gym-owner', 'trainer', 'member']),
  phone: String,
  address: String,
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

### Members Collection
```javascript
{
  _id: ObjectId,
  gymOwner: ObjectId (ref: 'User'),
  name: String,
  email: String,
  phone: String,
  membershipType: String (enum: ['basic', 'premium', 'vip']),
  joiningDate: Date,
  status: String (enum: ['active', 'inactive', 'suspended']),
  qrCode: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Subscriptions Collection
```javascript
{
  _id: ObjectId,
  gymOwner: ObjectId (ref: 'User'),
  plan: String,
  price: Number,
  startDate: Date,
  endDate: Date,
  isActive: Boolean,
  paymentStatus: String,
  paymentHistory: Array,
  autoRenew: Boolean
}
```

## 🛠️ API Documentation

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
```

### User Management Endpoints
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### Member Management Endpoints
```
GET    /api/members
POST   /api/members
GET    /api/members/:id
PUT    /api/members/:id
DELETE /api/members/:id
```

### Subscription Endpoints
```
GET    /api/subscriptions
POST   /api/subscriptions
GET    /api/subscriptions/:id
PUT    /api/subscriptions/:id
DELETE /api/subscriptions/:id
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
npm run test

# Backend tests
cd Backend
npm run test
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 🤝 Contributing

### How to Contribute

1. **Fork the Repository**
```bash
git clone https://github.com/yourusername/gymflow.git
cd gymflow
```

2. **Create a Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make Changes**
- Follow the coding standards
- Add tests for new features
- Update documentation

4. **Commit Changes**
```bash
git commit -m "Add your commit message"
```

5. **Push to Branch**
```bash
git push origin feature/your-feature-name
```

6. **Create Pull Request**
- Open a pull request on GitHub
- Describe your changes
- Wait for code review

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

### Getting Help
- **Documentation**: Check this README and code comments
- **Issues**: Create an issue on GitHub
- **Email**: contact@gymflow.com

### Feature Requests
Have an idea for a new feature? We'd love to hear it!
1. Check existing issues to avoid duplicates
2. Create a new issue with the "enhancement" label
3. Describe the feature in detail

### Bug Reports
Found a bug? Please help us fix it!
1. Check if the bug has already been reported
2. Create a new issue with the "bug" label
3. Include steps to reproduce

---

## 🎯 Roadmap

### Version 2.0 (Coming Soon)
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Integration with fitness trackers
- [ ] WhatsApp notifications
- [ ] Inventory management

### Version 2.1 (Future)
- [ ] AI-powered workout recommendations
- [ ] Virtual training sessions
- [ ] Social features and member community
- [ ] Advanced reporting and insights
- [ ] Integration with popular fitness apps

---

<div align="center">
  <h3>🏋️‍♂️ Built with ❤️ for the Fitness Community</h3>
  <p>If you found this project helpful, please consider giving it a ⭐ on GitHub!</p>
</div>

---

**Made with 💪 by the GymFlow Team | © 2024 GymFlow. All rights reserved.**
