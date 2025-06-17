import mongoose from 'mongoose';
import Subscription from './src/models/subscriptionModel.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/gymflow')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get all subscriptions
      const subscriptions = await Subscription.find();
      console.log('All subscriptions:');
      console.log(JSON.stringify(subscriptions, null, 2));
      
      // Calculate total revenue
      let totalRevenue = 0;
      let paymentCount = 0;
      
      subscriptions.forEach(subscription => {
        subscription.paymentHistory.forEach(payment => {
          if (payment.status === 'Success') {
            totalRevenue += payment.amount;
            paymentCount++;
          }
        });
      });
      
      console.log('\nTotal revenue calculation:');
      console.log(`Total revenue: ₹${totalRevenue}`);
      console.log(`Payment count: ${paymentCount}`);
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });