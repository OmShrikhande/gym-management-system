import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

class WebSocketService {
  constructor() {
    this.clients = new Map(); // Map of userId -> WebSocket connection
    this.wss = null;
  }

  initialize(server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      maxPayload: 16 * 1024, // 16KB max payload
      perMessageDeflate: {
        zlibDeflateOptions: {
          level: 3,
          chunkSize: 1024,
        },
        threshold: 1024,
        concurrencyLimit: 10,
        clientMaxWindowBits: 13,
        serverMaxWindowBits: 13,
        serverMaxNoContextTakeover: false,
        clientMaxNoContextTakeover: false,
      },
      verifyClient: (info) => {
        // Basic verification - more detailed auth happens in connection handler
        return true;
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection established');
      
      // Set up message handler
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      // Handle connection close
      ws.on('close', () => {
        // Remove client from active connections
        for (const [userId, client] of this.clients) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            console.log(`WebSocket connection closed for user ${userId}`);
            break;
          }
        }
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    console.log('WebSocket server initialized');
  }

  async handleMessage(ws, data) {
    switch (data.type) {
      case 'auth':
        await this.handleAuth(ws, data);
        break;
      case 'settings_update':
        await this.handleSettingsUpdate(ws, data);
        break;
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  }

  async handleAuth(ws, data) {
    try {
      const { token, userId, role } = data;
      
      if (!token || !userId) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Token and userId are required'
        }));
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.userId !== userId) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid token'
        }));
        return;
      }

      // Get user details
      const user = await User.findById(userId);
      
      if (!user) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'User not found'
        }));
        return;
      }

      // Store client connection
      this.clients.set(userId, {
        ws,
        user,
        lastActivity: Date.now()
      });

      // Send auth success
      ws.send(JSON.stringify({
        type: 'auth_success',
        message: 'Authentication successful'
      }));

      console.log(`User ${userId} (${user.role}) authenticated via WebSocket`);
    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
    }
  }

  async handleSettingsUpdate(ws, data) {
    try {
      const { settings, targetUsers, updatedBy, timestamp } = data;
      
      // Verify the sender is authenticated
      const senderClient = Array.from(this.clients.values()).find(client => client.ws === ws);
      
      if (!senderClient) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Not authenticated'
        }));
        return;
      }

      // Only gym owners can broadcast settings updates
      if (senderClient.user.role !== 'gym-owner') {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unauthorized to broadcast settings'
        }));
        return;
      }

      // Broadcast to target users
      this.broadcastSettingsUpdate(settings, targetUsers, updatedBy, timestamp);
      
    } catch (error) {
      console.error('Error handling settings update:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process settings update'
      }));
    }
  }

  // Broadcast settings update to specific users
  broadcastSettingsUpdate(settings, targetUsers, updatedBy, timestamp) {
    const message = JSON.stringify({
      type: 'settings_update',
      settings,
      targetUsers,
      updatedBy,
      timestamp: timestamp || new Date().toISOString()
    });

    let broadcastCount = 0;

    targetUsers.forEach(userId => {
      const client = this.clients.get(userId);
      
      if (client && client.ws.readyState === 1) { // WebSocket.OPEN = 1
        try {
          client.ws.send(message);
          broadcastCount++;
          console.log(`Settings update sent to user ${userId}`);
        } catch (error) {
          console.error(`Error sending settings update to user ${userId}:`, error);
          // Remove dead connection
          this.clients.delete(userId);
        }
      }
    });

    console.log(`Settings update broadcasted to ${broadcastCount} users`);
    return broadcastCount;
  }

  // Broadcast settings update to all users in a gym
  async broadcastToGym(gymId, settings, updatedBy) {
    try {
      // Find all users in the gym
      const gymUsers = await User.find({
        gymId,
        role: { $in: ['trainer', 'member'] }
      });

      const targetUsers = gymUsers.map(user => user._id.toString());
      
      return this.broadcastSettingsUpdate(settings, targetUsers, updatedBy);
    } catch (error) {
      console.error('Error broadcasting to gym:', error);
      return 0;
    }
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.clients.size;
  }

  // Get connected clients for a specific gym
  getGymClientsCount(gymId) {
    return Array.from(this.clients.values())
      .filter(client => client.user.gymId === gymId)
      .length;
  }

  // Clean up dead connections
  cleanupConnections() {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [userId, client] of this.clients) {
      if (now - client.lastActivity > timeout || client.ws.readyState !== 1) {
        this.clients.delete(userId);
        console.log(`Cleaned up stale connection for user ${userId}`);
      }
    }
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

// Clean up connections every 5 minutes
setInterval(() => {
  webSocketService.cleanupConnections();
}, 5 * 60 * 1000);

export default webSocketService;