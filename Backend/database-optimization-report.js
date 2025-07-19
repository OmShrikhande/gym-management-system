/**
 * Database Query Optimization Report
 * Analyzes and reports on database query performance
 */

import mongoose from 'mongoose';
import User from './src/models/userModel.js';
import Subscription from './src/models/subscriptionModel.js';
import Notification from './src/models/notificationModel.js';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseOptimizationAnalyzer {
  constructor() {
    this.results = {
      indexes: {},
      queryPerformance: {},
      recommendations: []
    };
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB for analysis');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      process.exit(1);
    }
  }

  async analyzeIndexes() {
    console.log('🔍 Analyzing database indexes...');
    
    const collections = [
      { name: 'users', model: User },
      { name: 'subscriptions', model: Subscription },
      { name: 'notifications', model: Notification }
    ];

    for (const collection of collections) {
      try {
        const indexes = await collection.model.collection.listIndexes().toArray();
        const stats = await collection.model.collection.stats();
        
        this.results.indexes[collection.name] = {
          count: indexes.length,
          indexes: indexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique || false,
            sparse: idx.sparse || false
          })),
          documentCount: stats.count,
          avgObjSize: stats.avgObjSize,
          storageSize: stats.storageSize,
          indexSize: stats.totalIndexSize
        };

        console.log(`📊 ${collection.name}: ${indexes.length} indexes, ${stats.count} documents`);
      } catch (error) {
        console.error(`❌ Error analyzing ${collection.name}:`, error.message);
      }
    }
  }

  async testQueryPerformance() {
    console.log('⚡ Testing query performance...');

    const queries = [
      {
        name: 'Find user by email',
        test: async () => {
          const start = Date.now();
          await User.findOne({ email: 'admin@gymflow.com' });
          return Date.now() - start;
        }
      },
      {
        name: 'Count gym owners',
        test: async () => {
          const start = Date.now();
          await User.countDocuments({ role: 'gym-owner' });
          return Date.now() - start;
        }
      },
      {
        name: 'Find active subscriptions',
        test: async () => {
          const start = Date.now();
          await Subscription.find({ isActive: true }).limit(10);
          return Date.now() - start;
        }
      },
      {
        name: 'Count active subscriptions',
        test: async () => {
          const start = Date.now();
          await Subscription.countDocuments({ 
            isActive: true,
            endDate: { $gte: new Date() }
          });
          return Date.now() - start;
        }
      },
      {
        name: 'Find user notifications',
        test: async () => {
          const start = Date.now();
          const users = await User.find({ role: 'gym-owner' }).limit(1);
          if (users.length > 0) {
            await Notification.find({ recipient: users[0]._id }).limit(10);
          }
          return Date.now() - start;
        }
      },
      {
        name: 'Aggregate subscription revenue',
        test: async () => {
          const start = Date.now();
          await Subscription.aggregate([
            { $match: { isActive: true } },
            { $unwind: "$paymentHistory" },
            { $match: { "paymentHistory.status": "Success" } },
            { $group: { _id: null, total: { $sum: "$paymentHistory.amount" } } }
          ]);
          return Date.now() - start;
        }
      }
    ];

    for (const query of queries) {
      try {
        const times = [];
        // Run each query 5 times to get average
        for (let i = 0; i < 5; i++) {
          const time = await query.test();
          times.push(time);
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        this.results.queryPerformance[query.name] = {
          avgTime: avgTime.toFixed(2),
          minTime,
          maxTime,
          times
        };

        console.log(`📊 ${query.name}: ${avgTime.toFixed(2)}ms avg (${minTime}-${maxTime}ms)`);
      } catch (error) {
        console.error(`❌ Error testing ${query.name}:`, error.message);
      }
    }
  }

  generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');

    // Check for missing indexes
    const userIndexes = this.results.indexes.users?.indexes || [];
    const subscriptionIndexes = this.results.indexes.subscriptions?.indexes || [];
    const notificationIndexes = this.results.indexes.notifications?.indexes || [];

    // Check if essential indexes exist
    const hasEmailIndex = userIndexes.some(idx => idx.key.email);
    const hasRoleIndex = userIndexes.some(idx => idx.key.role);
    const hasActiveSubIndex = subscriptionIndexes.some(idx => idx.key.isActive);
    const hasRecipientIndex = notificationIndexes.some(idx => idx.key.recipient);

    if (!hasEmailIndex) {
      this.results.recommendations.push({
        type: 'INDEX',
        priority: 'HIGH',
        message: 'Add index on User.email for faster authentication queries'
      });
    }

    if (!hasRoleIndex) {
      this.results.recommendations.push({
        type: 'INDEX',
        priority: 'MEDIUM',
        message: 'Add index on User.role for faster role-based queries'
      });
    }

    if (!hasActiveSubIndex) {
      this.results.recommendations.push({
        type: 'INDEX',
        priority: 'HIGH',
        message: 'Add index on Subscription.isActive for faster subscription queries'
      });
    }

    if (!hasRecipientIndex) {
      this.results.recommendations.push({
        type: 'INDEX',
        priority: 'MEDIUM',
        message: 'Add index on Notification.recipient for faster notification queries'
      });
    }

    // Check query performance
    Object.entries(this.results.queryPerformance).forEach(([queryName, performance]) => {
      if (parseFloat(performance.avgTime) > 100) {
        this.results.recommendations.push({
          type: 'PERFORMANCE',
          priority: 'HIGH',
          message: `Query "${queryName}" is slow (${performance.avgTime}ms). Consider optimization.`
        });
      } else if (parseFloat(performance.avgTime) > 50) {
        this.results.recommendations.push({
          type: 'PERFORMANCE',
          priority: 'MEDIUM',
          message: `Query "${queryName}" could be optimized (${performance.avgTime}ms).`
        });
      }
    });

    // Check collection sizes
    Object.entries(this.results.indexes).forEach(([collectionName, stats]) => {
      if (stats.documentCount > 10000 && stats.indexSize < stats.storageSize * 0.1) {
        this.results.recommendations.push({
          type: 'INDEX',
          priority: 'MEDIUM',
          message: `Collection "${collectionName}" has ${stats.documentCount} documents but low index coverage. Consider adding more indexes.`
        });
      }
    });
  }

  printReport() {
    console.log('\n📋 DATABASE OPTIMIZATION REPORT');
    console.log('='.repeat(60));

    // Index summary
    console.log('\n📊 INDEX SUMMARY');
    Object.entries(this.results.indexes).forEach(([collection, stats]) => {
      console.log(`\n${collection.toUpperCase()}:`);
      console.log(`  📄 Documents: ${stats.documentCount.toLocaleString()}`);
      console.log(`  📇 Indexes: ${stats.count}`);
      console.log(`  💾 Storage: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  🔍 Index Size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  📏 Avg Doc Size: ${stats.avgObjSize} bytes`);
      
      console.log('  Indexes:');
      stats.indexes.forEach(idx => {
        const keyStr = Object.keys(idx.key).map(k => `${k}:${idx.key[k]}`).join(', ');
        const flags = [];
        if (idx.unique) flags.push('unique');
        if (idx.sparse) flags.push('sparse');
        console.log(`    - ${idx.name}: {${keyStr}} ${flags.length ? `[${flags.join(', ')}]` : ''}`);
      });
    });

    // Query performance
    console.log('\n⚡ QUERY PERFORMANCE');
    Object.entries(this.results.queryPerformance).forEach(([queryName, perf]) => {
      const status = parseFloat(perf.avgTime) < 50 ? '✅' : parseFloat(perf.avgTime) < 100 ? '🟡' : '❌';
      console.log(`${status} ${queryName}: ${perf.avgTime}ms avg (${perf.minTime}-${perf.maxTime}ms)`);
    });

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    if (this.results.recommendations.length === 0) {
      console.log('✅ No optimization recommendations. Database is well optimized!');
    } else {
      const highPriority = this.results.recommendations.filter(r => r.priority === 'HIGH');
      const mediumPriority = this.results.recommendations.filter(r => r.priority === 'MEDIUM');
      const lowPriority = this.results.recommendations.filter(r => r.priority === 'LOW');

      if (highPriority.length > 0) {
        console.log('\n🔴 HIGH PRIORITY:');
        highPriority.forEach(rec => console.log(`  • ${rec.message}`));
      }

      if (mediumPriority.length > 0) {
        console.log('\n🟡 MEDIUM PRIORITY:');
        mediumPriority.forEach(rec => console.log(`  • ${rec.message}`));
      }

      if (lowPriority.length > 0) {
        console.log('\n🟢 LOW PRIORITY:');
        lowPriority.forEach(rec => console.log(`  • ${rec.message}`));
      }
    }

    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT');
    console.log('='.repeat(60));
    
    const highPriorityCount = this.results.recommendations.filter(r => r.priority === 'HIGH').length;
    const avgQueryTime = Object.values(this.results.queryPerformance)
      .reduce((sum, perf) => sum + parseFloat(perf.avgTime), 0) / Object.keys(this.results.queryPerformance).length;

    if (highPriorityCount === 0 && avgQueryTime < 50) {
      console.log('🏆 EXCELLENT: Database is well optimized for high concurrency');
    } else if (highPriorityCount <= 2 && avgQueryTime < 100) {
      console.log('🟡 GOOD: Database performance is acceptable with minor optimizations needed');
    } else {
      console.log('❌ NEEDS WORK: Database requires optimization for high concurrency');
    }

    console.log(`📊 Average Query Time: ${avgQueryTime.toFixed(2)}ms`);
    console.log(`🔍 Total Indexes: ${Object.values(this.results.indexes).reduce((sum, stats) => sum + stats.count, 0)}`);
    console.log(`📄 Total Documents: ${Object.values(this.results.indexes).reduce((sum, stats) => sum + stats.documentCount, 0).toLocaleString()}`);
  }

  async run() {
    console.log('🔍 Starting Database Optimization Analysis...\n');
    
    await this.connect();
    await this.analyzeIndexes();
    await this.testQueryPerformance();
    this.generateRecommendations();
    this.printReport();
    
    await mongoose.disconnect();
    console.log('\n✅ Analysis complete. Database connection closed.');
  }
}

// Run the analysis
const analyzer = new DatabaseOptimizationAnalyzer();
analyzer.run().catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});