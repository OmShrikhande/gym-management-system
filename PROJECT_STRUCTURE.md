# 📁 GymFlow Project Structure

This document provides a comprehensive overview of the GymFlow project structure, explaining the purpose and organization of each directory and file.

## 🏗️ Project Overview

```
gymflow/
├── Backend/                    # Node.js/Express backend
├── src/                       # React frontend source
├── public/                    # Static assets
├── docs/                      # Documentation
├── tests/                     # Test files
├── .env                       # Environment variables (frontend)
├── package.json               # Frontend dependencies
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # Project documentation
```

## 🎯 Frontend Structure (`src/`)

### 📁 Core Directories

```
src/
├── components/               # Reusable React components
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard-specific components
│   ├── forms/               # Form components
│   ├── layout/              # Layout and navigation components
│   ├── tables/              # Table components
│   ├── cards/               # Card components
│   ├── modals/              # Modal components
│   ├── subscription/        # Subscription-related components
│   ├── shared/              # Shared/common components
│   ├── payment/             # Payment components
│   ├── qr/                  # QR code components
│   ├── ui/                  # Base UI components (shadcn/ui)
│   └── index.js            # Component exports
├── contexts/                # React Context providers
├── hooks/                   # Custom React hooks
├── pages/                   # Page components
├── lib/                     # Utility libraries
├── styles/                  # CSS and styling files
├── utils/                   # Utility functions
├── types/                   # TypeScript type definitions
└── assets/                  # Static assets (images, icons)
```

### 🔧 Component Organization

#### Authentication Components (`components/auth/`)
- `LoginForm.jsx` - User login form
- `ProtectedRoute.jsx` - Route protection wrapper
- `SubscriptionRequired.jsx` - Subscription requirement wrapper
- `SuperAdminRegistration.jsx` - Super admin registration
- `UserManagement.jsx` - User management interface

#### Dashboard Components (`components/dashboard/`)
- `DashboardStats.jsx` - Statistics cards
- `RecentActivities.jsx` - Activity feed
- `QuickActions.jsx` - Quick action buttons

#### Form Components (`components/forms/`)
- `MemberForm.jsx` - Member add/edit form
- `TrainerForm.jsx` - Trainer add/edit form
- `WorkoutForm.jsx` - Workout plan form

#### Layout Components (`components/layout/`)
- `DashboardLayout.jsx` - Main dashboard layout
- `AppSidebar.jsx` - Application sidebar
- `DashboardHeader.jsx` - Header component
- `NavigationSidebar.jsx` - Navigation sidebar
- `NotificationCenter.jsx` - Notification management

#### Table Components (`components/tables/`)
- `MembersTable.jsx` - Members data table
- `TrainersTable.jsx` - Trainers data table
- `SubscriptionsTable.jsx` - Subscriptions table

#### Shared Components (`components/shared/`)
- `LoadingSpinner.jsx` - Loading indicator
- `EmptyState.jsx` - Empty state placeholder
- `ErrorBoundary.jsx` - Error boundary wrapper
- `ConfirmationModal.jsx` - Confirmation dialog

### 🎣 Custom Hooks (`hooks/`)

#### Data Management Hooks
- `useMembers.js` - Member data management
- `useSubscription.js` - Subscription management
- `useTrainers.js` - Trainer data management
- `useWorkouts.js` - Workout management
- `useDashboard.js` - Dashboard data

#### Utility Hooks
- `use-mobile.ts` - Mobile device detection
- `useLocalStorage.js` - Local storage management
- `useDebounce.js` - Debounce functionality

### 🌍 Context Providers (`contexts/`)
- `AuthContext.jsx` - Authentication state management
- `TranslationContext.jsx` - Multi-language support
- `ThemeContext.jsx` - Theme management
- `NotificationContext.jsx` - Notification system

### 📄 Pages (`pages/`)

#### Main Pages
- `Index.jsx` - Dashboard home page
- `Members.jsx` - Members management
- `Trainers.jsx` - Trainers management
- `Workouts.jsx` - Workout plans
- `Schedule.jsx` - Scheduling
- `Reports.jsx` - Analytics and reports

#### User-Specific Pages
- `Profile.jsx` - User profile
- `MyMembers.jsx` - Trainer's assigned members
- `MyWorkouts.jsx` - Member's workouts
- `MyDiet.jsx` - Member's diet plans

#### Admin Pages
- `UserManagement.jsx` - User administration
- `SystemSettings.jsx` - System configuration
- `BillingPlans.jsx` - Subscription plans

### 🛠️ Utilities (`lib/` & `utils/`)

#### Libraries (`lib/`)
- `utils.ts` - General utility functions
- `storage.ts` - Storage utilities
- `translations.js` - Translation utilities
- `settings.jsx` - Settings management

#### Utilities (`utils/`)
- `idUtils.js` - ID generation utilities
- `dateUtils.js` - Date formatting utilities
- `validationUtils.js` - Form validation
- `apiUtils.js` - API helpers

## 🔧 Backend Structure (`Backend/`)

```
Backend/
├── src/
│   ├── controllers/          # Request handlers
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── memberController.js
│   │   ├── subscriptionController.js
│   │   ├── paymentController.js
│   │   └── workoutController.js
│   ├── models/              # Database models
│   │   ├── userModel.js
│   │   ├── memberModel.js
│   │   ├── subscriptionModel.js
│   │   ├── workoutModel.js
│   │   └── notificationModel.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── subscriptionRoutes.js
│   │   └── paymentRoutes.js
│   ├── middleware/          # Custom middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── validation.js
│   │   └── rateLimit.js
│   ├── config/              # Configuration files
│   │   ├── database.js
│   │   ├── razorpay.js
│   │   └── cloudinary.js
│   ├── utils/               # Utility functions
│   │   ├── catchAsync.js
│   │   ├── appError.js
│   │   ├── email.js
│   │   └── qrGenerator.js
│   └── server.js           # Express server setup
├── tests/                   # Backend tests
├── .env                    # Backend environment variables
└── package.json           # Backend dependencies
```

### 🎮 Controllers
Controllers handle HTTP requests and responses, implementing business logic for each feature.

### 🗄️ Models
Mongoose models define the structure and behavior of data stored in MongoDB.

### 🛣️ Routes
Express routes define API endpoints and connect them to appropriate controllers.

### 🛡️ Middleware
Custom middleware for authentication, validation, error handling, and security.

### ⚙️ Configuration
Configuration files for database connections, third-party services, and environment-specific settings.

## 📦 Key Dependencies

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "tailwindcss": "^3.3.0",
  "vite": "^4.4.5",
  "lucide-react": "^0.263.1",
  "sonner": "^1.0.3",
  "@radix-ui/react-*": "Various UI components"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.0",
  "razorpay": "^2.8.6",
  "helmet": "^6.0.1",
  "cors": "^2.8.5",
  "express-rate-limit": "^6.7.0"
}
```

## 🏗️ Architecture Patterns

### Frontend Patterns
- **Component Composition** - Reusable UI components
- **Custom Hooks** - Shared logic extraction
- **Context API** - Global state management
- **Error Boundaries** - Error handling
- **Lazy Loading** - Performance optimization

### Backend Patterns
- **MVC Architecture** - Model-View-Controller pattern
- **Middleware Chain** - Request processing pipeline
- **Repository Pattern** - Data access abstraction
- **Error Handling** - Centralized error management
- **Authentication Flow** - JWT-based security

## 🔄 Data Flow

### 1. Authentication Flow
```
Login Form → Auth Controller → JWT Token → Protected Routes
```

### 2. Data Management Flow
```
Component → Custom Hook → API Call → Controller → Model → Database
```

### 3. State Management Flow
```
Context Provider → Component → Hook → Local State → UI Update
```

## 🎨 Styling Architecture

### Tailwind CSS Organization
```
styles/
├── globals.css             # Global styles
├── components.css          # Component-specific styles
├── utilities.css           # Custom utilities
└── theme.css              # Theme variables
```

### Component Styling Strategy
- **Utility-First** - Tailwind CSS classes
- **Component Classes** - Custom component styles
- **Responsive Design** - Mobile-first approach
- **Dark Mode** - Theme switching support

## 🧪 Testing Strategy

### Frontend Testing
```
tests/
├── components/             # Component tests
├── hooks/                  # Hook tests
├── utils/                  # Utility tests
└── integration/           # Integration tests
```

### Backend Testing
```
Backend/tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── e2e/                   # End-to-end tests
└── fixtures/              # Test data
```

## 📁 File Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `MemberCard.jsx`)
- **Hooks**: camelCase with "use" prefix (e.g., `useMembers.js`)
- **Pages**: PascalCase (e.g., `Members.jsx`)
- **Utilities**: camelCase (e.g., `dateUtils.js`)

### Backend
- **Controllers**: camelCase with "Controller" suffix (e.g., `memberController.js`)
- **Models**: camelCase with "Model" suffix (e.g., `memberModel.js`)
- **Routes**: camelCase with "Routes" suffix (e.g., `memberRoutes.js`)
- **Middleware**: camelCase (e.g., `auth.js`)

## 🔧 Development Workflow

### 1. Feature Development
1. Create feature branch
2. Implement backend API
3. Add frontend components
4. Write tests
5. Update documentation

### 2. Component Development
1. Create component file
2. Implement functionality
3. Add props validation
4. Create stories (if using Storybook)
5. Export from index.js

### 3. API Development
1. Define route
2. Create controller
3. Implement model (if needed)
4. Add validation
5. Write tests

## 📚 Best Practices

### Frontend
- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility guidelines
- Optimize for performance
- Use TypeScript for type safety

### Backend
- Implement proper error handling
- Use input validation
- Follow RESTful API conventions
- Implement rate limiting
- Use environment variables for configuration

### General
- Write meaningful commit messages
- Use ESLint and Prettier
- Document complex functions
- Follow the DRY principle
- Implement proper logging

---

This structure provides a solid foundation for a scalable, maintainable gym management system. Each component and module has a specific purpose and follows established patterns for easy development and maintenance.