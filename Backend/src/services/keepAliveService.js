import axios from 'axios';

class KeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.serverUrl = process.env.RENDER_EXTERNAL_URL || process.env.SERVER_URL || 'http://localhost:5000';
    this.intervalMinutes = 13; // Ping every 13 minutes (before 15-minute timeout)
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  start() {
    if (this.isRunning) {
      console.log('Keep-alive service is already running');
      return;
    }

    // Only start keep-alive in production (Render)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Keep-alive service disabled in development mode');
      return;
    }

    console.log(`🚀 Starting keep-alive service - pinging every ${this.intervalMinutes} minutes`);
    console.log(`📡 Server URL: ${this.serverUrl}`);

    this.isRunning = true;
    
    // Start pinging immediately, then every 13 minutes
    this.ping();
    this.intervalId = setInterval(() => {
      this.ping();
    }, this.intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Keep-alive service stopped');
  }

  async ping(retryCount = 0) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.serverUrl}/keep-alive`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'Keep-Alive-Service/1.0',
          'X-Keep-Alive': 'true'
        }
      });

      const responseTime = Date.now() - startTime;
      
      console.log(`✅ Keep-alive ping successful - Response time: ${responseTime}ms`);
      console.log(`📊 Server status: ${response.data.status} | Uptime: ${Math.floor(response.data.uptime / 60)} minutes`);
      
      return response.data;
    } catch (error) {
      console.error(`❌ Keep-alive ping failed (attempt ${retryCount + 1}/${this.maxRetries}):`, error.message);
      
      if (retryCount < this.maxRetries - 1) {
        console.log(`🔄 Retrying in ${this.retryDelay / 1000} seconds...`);
        setTimeout(() => {
          this.ping(retryCount + 1);
        }, this.retryDelay);
      } else {
        console.error('🚨 Max retries reached. Keep-alive ping failed completely.');
        
        // Log additional error details for debugging
        if (error.response) {
          console.error(`HTTP Status: ${error.response.status}`);
          console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
        } else if (error.request) {
          console.error('No response received from server');
        }
      }
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      serverUrl: this.serverUrl,
      intervalMinutes: this.intervalMinutes,
      nextPingIn: this.isRunning ? 'Running' : 'Stopped'
    };
  }
}

// Create singleton instance
const keepAliveService = new KeepAliveService();

export default keepAliveService;