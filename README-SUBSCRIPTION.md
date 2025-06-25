# Gym Management System - Subscription Implementation

## Overview

This document explains how to use and test the subscription system implemented for gym owners in the Gym Management System. The system allows gym owners to subscribe to different plans, receive notifications about subscription status, and restricts access to the dashboard when a subscription expires.

## Features

1. **Subscription Plans**
   - Basic ($49/month): Up to 200 members, 5 trainers
   - Premium ($99/month): Up to 500 members, 15 trainers
   - Enterprise ($199/month): Unlimited members, unlimited trainers

2. **Payment Tracking**
   - Payment history is recorded
   - Subscription status is tracked (active/expired)

3. **Notification System**
   - In-app notifications for subscription events
   - Payment reminders (2 days before expiration)
   - Subscription expiration alerts

4. **Access Restriction**
   - Dashboard access is restricted when subscription expires
   - Redirect to subscription payment page
   - Access to billing pages even when subscription is expired

## How to Use

### For Gym Owners

1. **Subscribe to a Plan**
   - Log in as a gym owner
   - Navigate to "Billing Plans" in the sidebar
   - Select a plan that fits your needs
   - Complete the payment form
   - Your subscription will be activated immediately

2. **Renew Subscription**
   - When your subscription is about to expire, you'll receive a notification
   - Navigate to "Billing Plans" in the sidebar
   - Select your current plan or choose a different one
   - Complete the payment form to renew

3. **View Subscription Status**
   - Your subscription status is displayed in the dashboard header
   - You can see days remaining until expiration
   - When subscription is about to expire, a warning is shown

### For Administrators

1. **Manage Subscriptions**
   - Log in as a super admin
   - Navigate to "Billing Plans" in the sidebar
   - You can view and manage all subscription plans
   - You can also view payment history and subscription status for all gym owners

## Testing the System

To test the subscription system:

1. **Test Subscription Purchase**
   - Log in as a gym owner
   - Navigate to "Billing Plans"
   - Select a plan and complete the payment
   - Verify that you can access the dashboard

2. **Test Subscription Expiration**
   - To simulate expiration, you can manually update the subscription end date in the database:
     ```javascript
     // In MongoDB shell or using a tool like MongoDB Compass
     db.subscriptions.updateOne(
       { gymOwner: ObjectId("your-gym-owner-id") },
       { $set: { endDate: new Date(Date.now() - 86400000), isActive: false } }
     )
     ```
   - Log out and log back in
   - Verify that you're redirected to the subscription payment page
   - Subscribe again to regain access

3. **Test Notifications**
   - To simulate upcoming expiration, update the subscription end date to be 2 days from now:
     ```javascript
     db.subscriptions.updateOne(
       { gymOwner: ObjectId("your-gym-owner-id") },
       { $set: { endDate: new Date(Date.now() + 2 * 86400000) } }
     )
     ```
   - Log out and log back in
   - Check the notification bell in the header for expiration warnings

## Technical Implementation

The subscription system consists of:

1. **Backend Models**
   - `subscriptionModel.js`: Stores subscription data
   - `notificationModel.js`: Manages notifications

2. **Backend Controllers**
   - `subscriptionController.js`: Handles subscription operations
   - `notificationController.js`: Manages notifications

3. **Frontend Components**
   - Enhanced `AuthContext.jsx` with subscription checking
   - `SubscriptionRequired.jsx`: Shown when subscription expires
   - `NotificationCenter.jsx`: Displays notifications
   - Updated `BillingPlans.jsx` with payment form

## Notes

- This is a demo implementation. In a production environment, you would integrate with a real payment gateway like Stripe or PayPal.
- The subscription check happens on login and when accessing protected routes.
- Notifications are checked periodically to alert users about upcoming expirations.