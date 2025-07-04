/*
  NodeMCU Gym Access Control Device
  Always listening for QR scan responses from server
  Controls physical access (door locks, LEDs, etc.)
*/

#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <ESP8266HTTPClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverHost = "192.168.43.196"; // Replace with your server IP
const int serverPort = 8081;
const char* gymOwnerId = "685032addcf36956819943e8"; // Replace with actual gym owner ID

// Device configuration
String deviceId = "NodeMCU_GYM_001";
bool deviceRegistered = false;
unsigned long lastHeartbeat = 0;
const unsigned long heartbeatInterval = 30000; // 30 seconds

// Hardware pins
#define LED_GREEN 2    // GPIO2 (D4) - Access granted indicator
#define LED_RED 16     // GPIO16 (D0) - Access denied indicator
#define RELAY_PIN 5    // GPIO5 (D1) - Door lock relay
#define BUZZER_PIN 4   // GPIO4 (D2) - Buzzer for audio feedback
#define STATUS_LED 12  // GPIO12 (D6) - Connection status LED

// WebSocket client
WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  Serial.println("\n🚀 NodeMCU Gym Access Control Device Starting...");
  
  // Initialize hardware pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED, OUTPUT);
  
  // Set initial states
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);    // Red LED on by default (access denied)
  digitalWrite(RELAY_PIN, LOW);   // Door locked by default
  digitalWrite(STATUS_LED, LOW);  // Status LED off until connected
  
  // Connect to WiFi
  connectToWiFi();
  
  // Initialize WebSocket connection
  initializeWebSocket();
  
  Serial.println("📻 Device ready and listening for server responses...");
}

void loop() {
  // Keep WebSocket connection alive
  webSocket.loop();
  
  // Send heartbeat periodically
  if (millis() - lastHeartbeat > heartbeatInterval && deviceRegistered) {
    sendHeartbeat();
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi disconnected, reconnecting...");
    connectToWiFi();
  }
  
  delay(100); // Small delay to prevent overloading
}

void connectToWiFi() {
  Serial.print("🔌 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("✅ WiFi connected!");
  Serial.print("📡 IP address: ");
  Serial.println(WiFi.localIP());
  
  // Blink status LED to indicate WiFi connection
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(200);
    digitalWrite(STATUS_LED, LOW);
    delay(200);
  }
}

void initializeWebSocket() {
  Serial.println("🔌 Initializing WebSocket connection...");
  
  // Configure WebSocket client
  webSocket.begin(serverHost, serverPort, "/");
  
  // Set WebSocket event handler
  webSocket.onEvent(webSocketEvent);
  
  // Enable heartbeat
  webSocket.enableHeartbeat(15000, 3000, 2);
  
  Serial.println("📻 WebSocket initialized, connecting to server...");
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("❌ WebSocket Disconnected");
      deviceRegistered = false;
      digitalWrite(STATUS_LED, LOW);
      digitalWrite(LED_RED, HIGH);
      break;
      
    case WStype_CONNECTED:
      Serial.print("✅ WebSocket Connected to: ");
      Serial.println((char*)payload);
      digitalWrite(STATUS_LED, HIGH);
      registerDevice();
      break;
      
    case WStype_TEXT:
      Serial.print("📨 Message received: ");
      Serial.println((char*)payload);
      handleServerMessage((char*)payload);
      break;
      
    case WStype_ERROR:
      Serial.print("❌ WebSocket Error: ");
      Serial.println((char*)payload);
      break;
      
    default:
      break;
  }
}

void registerDevice() {
  Serial.println("📡 Registering device with server...");
  
  // Create registration JSON
  StaticJsonDocument<200> doc;
  doc["gymOwnerId"] = gymOwnerId;
  doc["deviceId"] = deviceId;
  
  String message;
  serializeJson(doc, message);
  
  // Send registration message
  String registrationMessage = "42[\"register-device\"," + message + "]";
  webSocket.sendTXT(registrationMessage);
  
  Serial.println("📋 Registration message sent");
}

void handleServerMessage(String message) {
  // Parse Socket.IO message format
  if (message.startsWith("42[")) {
    // Extract JSON from Socket.IO format
    int startIndex = message.indexOf('[', 2);
    int endIndex = message.lastIndexOf(']');
    
    if (startIndex != -1 && endIndex != -1) {
      String jsonArray = message.substring(startIndex, endIndex + 1);
      
      // Parse JSON array
      StaticJsonDocument<1024> doc;
      deserializeJson(doc, jsonArray);
      
      if (doc.size() >= 2) {
        String eventName = doc[0];
        JsonObject eventData = doc[1];
        
        Serial.print("📢 Event: ");
        Serial.println(eventName);
        
        // Handle different events
        if (eventName == "registration-success") {
          handleRegistrationSuccess(eventData);
        } else if (eventName == "registration-error") {
          handleRegistrationError(eventData);
        } else if (eventName == "qr-scan-response") {
          handleQRScanResponse(eventData);
        } else if (eventName == "access-response") {
          handleAccessResponse(eventData);
        } else if (eventName == "test-message") {
          handleTestMessage(eventData);
        } else if (eventName == "heartbeat-response") {
          handleHeartbeatResponse(eventData);
        }
      }
    }
  }
}

void handleRegistrationSuccess(JsonObject data) {
  Serial.println("✅ Device registered successfully!");
  deviceRegistered = true;
  
  // Blink green LED to indicate successful registration
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(100);
    digitalWrite(LED_GREEN, LOW);
    delay(100);
  }
  
  // Play success sound
  playSuccessSound();
  
  Serial.println("📻 Device is now listening for QR scan responses...");
}

void handleRegistrationError(JsonObject data) {
  Serial.println("❌ Device registration failed!");
  const char* errorMessage = data["message"];
  Serial.print("Error: ");
  Serial.println(errorMessage);
  
  deviceRegistered = false;
  
  // Blink red LED to indicate registration failure
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED_RED, HIGH);
    delay(100);
    digitalWrite(LED_RED, LOW);
    delay(100);
  }
  
  // Play error sound
  playErrorSound();
}

void handleQRScanResponse(JsonObject data) {
  Serial.println("\n🎯 QR SCAN RESPONSE RECEIVED:");
  Serial.println("================================================");
  
  const char* status = data["status"];
  const char* message = data["message"];
  const char* nodeMcuResponse = data["nodeMcuResponse"];
  const char* timestamp = data["timestamp"];
  
  Serial.print("📅 Timestamp: ");
  Serial.println(timestamp);
  Serial.print("📊 Status: ");
  Serial.println(status);
  Serial.print("💬 Message: ");
  Serial.println(message);
  Serial.print("🔐 Access: ");
  Serial.println(nodeMcuResponse);
  
  // Extract member and gym info
  if (data.containsKey("data")) {
    JsonObject responseData = data["data"];
    
    if (responseData.containsKey("member")) {
      JsonObject member = responseData["member"];
      const char* memberName = member["name"];
      const char* membershipStatus = member["membershipStatus"];
      
      Serial.print("👤 Member: ");
      Serial.println(memberName);
      Serial.print("📋 Status: ");
      Serial.println(membershipStatus);
    }
    
    if (responseData.containsKey("gym")) {
      JsonObject gym = responseData["gym"];
      const char* gymName = gym["name"];
      
      Serial.print("🏠 Gym: ");
      Serial.println(gymName);
    }
  }
  
  Serial.println("================================================");
  
  // Control physical access based on response
  if (String(nodeMcuResponse) == "allow") {
    Serial.println("🚪 OPENING DOOR/GATE - ACCESS GRANTED");
    grantAccess();
  } else {
    Serial.println("🚫 KEEPING DOOR/GATE CLOSED - ACCESS DENIED");
    denyAccess();
  }
}

void handleAccessResponse(JsonObject data) {
  Serial.println("\n🔐 ACCESS RESPONSE RECEIVED:");
  Serial.println("================================================");
  
  const char* status = data["status"];
  const char* message = data["message"];
  const char* nodeMcuResponse = data["nodeMcuResponse"];
  
  Serial.print("📊 Status: ");
  Serial.println(status);
  Serial.print("💬 Message: ");
  Serial.println(message);
  Serial.print("🔐 Access: ");
  Serial.println(nodeMcuResponse);
  
  Serial.println("================================================");
  
  // Control physical access
  if (String(nodeMcuResponse) == "allow") {
    Serial.println("🚪 OPENING DOOR/GATE - ACCESS GRANTED");
    grantAccess();
  } else {
    Serial.println("🚫 KEEPING DOOR/GATE CLOSED - ACCESS DENIED");
    denyAccess();
  }
}

void handleTestMessage(JsonObject data) {
  Serial.println("\n🧪 TEST MESSAGE RECEIVED:");
  Serial.println("================================================");
  
  const char* message = data["message"];
  const char* timestamp = data["timestamp"];
  
  Serial.print("📅 Timestamp: ");
  Serial.println(timestamp);
  Serial.print("💬 Message: ");
  Serial.println(message);
  Serial.println("================================================");
  
  // Blink both LEDs for test
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, HIGH);
    delay(300);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, LOW);
    delay(300);
  }
}

void handleHeartbeatResponse(JsonObject data) {
  const char* status = data["status"];
  Serial.print("💓 Heartbeat response - Status: ");
  Serial.println(status);
  
  // Quick blink status LED
  digitalWrite(STATUS_LED, LOW);
  delay(50);
  digitalWrite(STATUS_LED, HIGH);
}

void grantAccess() {
  Serial.println("🔧 PHYSICAL ACCESS CONTROL: GRANT ACCESS");
  
  // Turn on green LED
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, LOW);
  
  // Open door lock (activate relay)
  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("   - Door lock relay activated");
  
  // Play access granted sound
  playAccessGrantedSound();
  
  // Keep door open for 5 seconds
  delay(5000);
  
  // Auto-close door
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  
  Serial.println("🔧 PHYSICAL ACCESS CONTROL: AUTO-CLOSE");
  Serial.println("   - Door lock relay deactivated");
  
  // Play closing sound
  playClosingSound();
}

void denyAccess() {
  Serial.println("🔧 PHYSICAL ACCESS CONTROL: DENY ACCESS");
  
  // Keep red LED on
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_GREEN, LOW);
  
  // Ensure door remains locked
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("   - Door lock relay kept off");
  
  // Play access denied sound
  playAccessDeniedSound();
  
  // Blink red LED for emphasis
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_RED, LOW);
    delay(200);
    digitalWrite(LED_RED, HIGH);
    delay(200);
  }
}

void sendHeartbeat() {
  if (deviceRegistered) {
    // Create heartbeat JSON
    StaticJsonDocument<200> doc;
    doc["gymOwnerId"] = gymOwnerId;
    doc["deviceId"] = deviceId;
    
    String message;
    serializeJson(doc, message);
    
    // Send heartbeat message
    String heartbeatMessage = "42[\"heartbeat\"," + message + "]";
    webSocket.sendTXT(heartbeatMessage);
    
    lastHeartbeat = millis();
    Serial.println("💓 Heartbeat sent");
  }
}

// Sound functions
void playSuccessSound() {
  tone(BUZZER_PIN, 1000, 200);
  delay(250);
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  tone(BUZZER_PIN, 1500, 200);
}

void playErrorSound() {
  tone(BUZZER_PIN, 400, 500);
  delay(200);
  tone(BUZZER_PIN, 300, 500);
}

void playAccessGrantedSound() {
  tone(BUZZER_PIN, 800, 100);
  delay(150);
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  tone(BUZZER_PIN, 1200, 200);
}

void playAccessDeniedSound() {
  tone(BUZZER_PIN, 300, 300);
  delay(100);
  tone(BUZZER_PIN, 300, 300);
  delay(100);
  tone(BUZZER_PIN, 300, 300);
}

void playClosingSound() {
  tone(BUZZER_PIN, 600, 100);
  delay(150);
  tone(BUZZER_PIN, 400, 100);
}