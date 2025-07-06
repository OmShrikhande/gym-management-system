# Render Environment Variables Setup

To fix the deployment issue, you need to set these environment variables in your Render dashboard:

## Required Environment Variables

1. **NODE_ENV**: `production`
2. **PORT**: `5000` (or let Render auto-assign)
3. **MONGODB_URI**: Your MongoDB connection string
4. **JWT_SECRET**: Your JWT secret key
5. **JWT_EXPIRES_IN**: `90d`
6. **FRONTEND_URL**: Your frontend URL

## Optional Razorpay Variables (for payment features)

7. **RAZORPAY_TEST_KEY_ID**: Your Razorpay test key ID
8. **RAZORPAY_TEST_KEY_SECRET**: Your Razorpay test key secret
9. **RAZORPAY_LIVE_KEY_ID**: Your Razorpay live key ID (for production)
10. **RAZORPAY_LIVE_KEY_SECRET**: Your Razorpay live key secret (for production)

## How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Click on your service
3. Go to the "Environment" tab
4. Add each variable with its value
5. Save and redeploy

## For Testing Without Razorpay

If you don't have Razorpay keys yet, you can leave the Razorpay variables unset. The application will:
- Start successfully without crashing
- Show warnings about missing Razorpay credentials
- Allow test mode subscriptions to work
- Disable payment features gracefully

## Minimum Required Variables for Basic Functionality

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-strong-jwt-secret-key
JWT_EXPIRES_IN=90d
FRONTEND_URL=https://your-frontend-domain.netlify.app
```

The server should start successfully with just these variables set.