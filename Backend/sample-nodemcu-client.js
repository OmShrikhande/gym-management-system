// Sample NodeMCU Client Code for Testing (JavaScript version)
// This simulates how a NodeMCU device would connect and listen for responses

import { io } from 'socket.io-client';

class NodeMCUClient {
  constructor(serverUrl, gymOwnerId) {
    this.serverUrl = serverUrl;
    this.gymOwnerId = gymOwnerId;
    this.socket = null;
    this.deviceId = `NodeMCU_${Date.now()}`;
  }

  connect() {
    console.log(`🔌 Connecting to server: ${this.serverUrl}`);
    
    this.socket = io(this.serverUrl, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.setupEventHandlers();
    this.socket.connect();
  }

  setupEventHandlers() {
    // Connection established
    this.socket.on('connect', () => {
      console.log(`✅ Connected to server with socket ID: ${this.socket.id}`);
      this.registerDevice();
    });

    // Registration successful
    this.socket.on('registration-success', (data) => {
      console.log('📋 Device registered successfully:', data);
      console.log('📻 Device is now listening for QR scan responses...');
      this.startHeartbeat();
    });

    // Registration error
    this.socket.on('registration-error', (error) => {
      console.error('❌ Registration failed:', error);
    });

    // QR Scan Response (Main event to listen for)
    this.socket.on('qr-scan-response', (data) => {
      console.log('\n🎯 QR SCAN RESPONSE RECEIVED:');
      console.log('================================================');
      console.log(`📅 Timestamp: ${data.timestamp}`);
      console.log(`🏠 Gym: ${data.data?.gym?.name || 'Unknown'}`);
      console.log(`👤 Member: ${data.data?.member?.name || 'Unknown'}`);
      console.log(`📊 Status: ${data.status}`);
      console.log(`🔐 Access: ${data.nodeMcuResponse}`);
      console.log(`💬 Message: ${data.message}`);
      console.log('================================================');
      
      // This is where NodeMCU would control physical access
      if (data.nodeMcuResponse === 'allow') {
        console.log('🚪 OPENING DOOR/GATE - ACCESS GRANTED');
        this.controlAccess('open');
      } else {
        console.log('🚫 KEEPING DOOR/GATE CLOSED - ACCESS DENIED');
        this.controlAccess('close');
      }
    });

    // Access Response (For direct device verification)
    this.socket.on('access-response', (data) => {
      console.log('\n🔐 ACCESS RESPONSE RECEIVED:');
      console.log('================================================');
      console.log(`📅 Timestamp: ${data.timestamp}`);
      console.log(`🏠 Gym: ${data.data?.gym?.name || 'Unknown'}`);
      console.log(`👤 Member: ${data.data?.member?.name || 'Unknown'}`);
      console.log(`📊 Status: ${data.status}`);
      console.log(`🔐 Access: ${data.nodeMcuResponse}`);
      console.log(`💬 Message: ${data.message}`);
      console.log('================================================');
      
      // Control physical access
      if (data.nodeMcuResponse === 'allow') {
        console.log('🚪 OPENING DOOR/GATE - ACCESS GRANTED');
        this.controlAccess('open');
      } else {
        console.log('🚫 KEEPING DOOR/GATE CLOSED - ACCESS DENIED');
        this.controlAccess('close');
      }
    });

    // Test message
    this.socket.on('test-message', (data) => {
      console.log('\n🧪 TEST MESSAGE RECEIVED:');
      console.log('================================================');
      console.log(`📅 Timestamp: ${data.timestamp}`);
      console.log(`💬 Message: ${data.message}`);
      console.log('================================================');
    });

    // Heartbeat response
    this.socket.on('heartbeat-response', (data) => {
      console.log(`💓 Heartbeat received - Status: ${data.status}`);
    });

    // Disconnection
    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });
  }

  registerDevice() {
    console.log(`📡 Registering device for gym owner: ${this.gymOwnerId}`);
    
    this.socket.emit('register-device', {
      gymOwnerId: this.gymOwnerId,
      deviceId: this.deviceId
    });
  }

  startHeartbeat() {
    // Send heartbeat every 30 seconds to maintain connection
    setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('heartbeat', {
          gymOwnerId: this.gymOwnerId,
          deviceId: this.deviceId
        });
      }
    }, 30000);
  }

  controlAccess(action) {
    // This simulates physical access control
    // In real NodeMCU, this would control relays, servo motors, etc.
    console.log(`🔧 PHYSICAL ACCESS CONTROL: ${action.toUpperCase()}`);
    
    if (action === 'open') {
      console.log('   - Activating door lock relay');
      console.log('   - Turning on green LED');
      console.log('   - Playing access granted sound');
      
      // Simulate keeping door open for 5 seconds
      setTimeout(() => {
        console.log('🔧 PHYSICAL ACCESS CONTROL: AUTO-CLOSE');
        console.log('   - Deactivating door lock relay');
        console.log('   - Turning off green LED');
      }, 5000);
    } else {
      console.log('   - Keeping door lock relay off');
      console.log('   - Turning on red LED');
      console.log('   - Playing access denied sound');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

// Usage example
const SERVER_URL = 'http://localhost:5000';
const GYM_OWNER_ID = '6734cfa6e1b67d5b6e36c3ed'; // Replace with actual gym owner ID

console.log('🚀 Starting NodeMCU Client Simulation...');
console.log(`📡 Server: ${SERVER_URL}`);
console.log(`🏠 Gym Owner ID: ${GYM_OWNER_ID}`);
console.log('===============================================\n');

const client = new NodeMCUClient(SERVER_URL, GYM_OWNER_ID);
client.connect();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down NodeMCU client...');
  client.disconnect();
  process.exit(0);
});

export default NodeMCUClient;