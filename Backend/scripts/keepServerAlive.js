import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SERVER_URL = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || 'https://gym-management-system-ckb0.onrender.com';
const PING_INTERVAL = 13 * 60 * 1000; // 13 minutes in milliseconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

console.log('🚀 Starting Keep-Alive Script');
console.log(`📡 Server URL: ${SERVER_URL}`);
console.log(`⏰ Ping interval: ${13} minutes`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

async function pingServer(attempt = 1) {
  try {
    const startTime = Date.now();
    console.log(`\n🔄 Pinging server (Attempt ${attempt}/${MAX_RETRIES})...`);
    
    const response = await axios.get(`${SERVER_URL}/keep-alive`, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Keep-Alive-Script/1.0',
        'X-Keep-Alive': 'external-script'
      }
    });

    const responseTime = Date.now() - startTime;
    const uptime = Math.floor(response.data.uptime / 60);
    
    console.log(`✅ Server is alive! Response time: ${responseTime}ms`);
    console.log(`📊 Server uptime: ${uptime} minutes`);
    console.log(`🧠 Memory usage: ${Math.round(response.data.memoryUsage.rss / 1024 / 1024)}MB RSS`);
    console.log(`⏱️  Next ping: ${new Date(Date.now() + PING_INTERVAL).toLocaleTimeString()}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Ping failed (Attempt ${attempt}/${MAX_RETRIES}):`, error.message);
    
    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY / 1000} seconds...`);
      setTimeout(() => pingServer(attempt + 1), RETRY_DELAY);
    } else {
      console.error('🚨 All attempts failed. Server might be down.');
      
      // Log additional details for debugging
      if (error.response) {
        console.error(`HTTP Status: ${error.response.status}`);
        console.error(`Response Headers:`, error.response.headers);
      } else if (error.request) {
        console.error('No response received from server');
        console.error('Request timeout or network error');
      }
    }
    
    return false;
  }
}

// Start the keep-alive process
console.log('🎯 Starting keep-alive monitoring...\n');

// Ping immediately
pingServer();

// Set up interval to ping every 13 minutes
setInterval(() => {
  pingServer();
}, PING_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Keep-alive script stopped by user');
  console.log('👋 Goodbye!');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Keep-alive script terminated');
  process.exit(0);
});

// Keep the script running
process.stdin.resume();