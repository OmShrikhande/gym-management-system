import axios from 'axios';

class FrontendKeepAliveService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.serverUrl = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com';
    this.intervalMinutes = 13; // Ping every 13 minutes
    this.enabled = import.meta.env.PROD; // Only run in production
  }

  start() {
    if (!this.enabled) {
      console.log('Keep-alive service disabled in development');
      return;
    }

    if (this.isRunning) {
      console.log('Keep-alive service already running');
      return;
    }

    console.log(`🚀 Starting frontend keep-alive service (${this.intervalMinutes}min intervals)`);
    
    this.isRunning = true;
    
    // Start after 5 minutes, then every 13 minutes
    setTimeout(() => {
      this.ping();
      this.intervalId = setInterval(() => {
        this.ping();
      }, this.intervalMinutes * 60 * 1000);
    }, 5 * 60 * 1000); // Wait 5 minutes before starting
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Frontend keep-alive service stopped');
  }

  async ping() {
    try {
      const response = await axios.get(`${this.serverUrl}/keep-alive`, {
        timeout: 10000,
        headers: {
          'X-Keep-Alive': 'frontend',
          'User-Agent': 'GymFlow-Frontend/1.0'
        }
      });

      console.log(`✅ Server pinged successfully - Status: ${response.data.status}`);
      
      // Log to localStorage for debugging
      const logEntry = {
        timestamp: new Date().toISOString(),
        status: 'success',
        serverStatus: response.data.status,
        uptime: Math.floor(response.data.uptime / 60)
      };
      
      this.saveLog(logEntry);
      
    } catch (error) {
      console.error('❌ Keep-alive ping failed:', error.message);
      
      const logEntry = {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error.message,
        statusCode: error.response?.status
      };
      
      this.saveLog(logEntry);
    }
  }

  saveLog(entry) {
    try {
      const logs = JSON.parse(localStorage.getItem('keepAliveLogs') || '[]');
      logs.push(entry);
      
      // Keep only last 50 entries
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('keepAliveLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save keep-alive log:', error);
    }
  }

  getLogs() {
    try {
      return JSON.parse(localStorage.getItem('keepAliveLogs') || '[]');
    } catch (error) {
      console.error('Failed to get keep-alive logs:', error);
      return [];
    }
  }

  clearLogs() {
    localStorage.removeItem('keepAliveLogs');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      enabled: this.enabled,
      serverUrl: this.serverUrl,
      intervalMinutes: this.intervalMinutes,
      lastLogs: this.getLogs().slice(-5) // Last 5 entries
    };
  }
}

// Create singleton instance
const frontendKeepAliveService = new FrontendKeepAliveService();

export default frontendKeepAliveService;