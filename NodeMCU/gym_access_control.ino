#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server configuration
const char* serverURL = "http://your-backend-server.com/api/nodemcu/validate";
const char* statusURL = "http://your-backend-server.com/api/nodemcu/status";

// Pin definitions
#define LED_GREEN 2    // GPIO2 (D4) - Access granted LED
#define LED_RED 16     // GPIO16 (D0) - Access denied LED
#define BUZZER 14      // GPIO14 (D5) - Buzzer for notifications
#define RELAY 12       // GPIO12 (D6) - Relay for door control
#define BUTTON 13      // GPIO13 (D7) - Manual test button

// Global variables
WiFiClient wifiClient;
HTTPClient http;
bool accessGranted = false;
unsigned long lastValidation = 0;
const unsigned long VALIDATION_TIMEOUT = 10000; // 10 seconds

void setup() {
  Serial.begin(115200);
  delay(100);
  
  // Initialize pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(RELAY, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  
  // Set initial states
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);  // Red LED on by default
  digitalWrite(BUZZER, LOW);
  digitalWrite(RELAY, LOW);     // Door locked by default
  
  // Connect to WiFi
  setupWiFi();
  
  // Test server connection
  testServerConnection();
  
  Serial.println("NodeMCU Gym Access Control System Ready!");
  Serial.println("Waiting for validation requests...");
}

void loop() {
  // Check for manual test button press
  if (digitalRead(BUTTON) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON) == LOW) {
      Serial.println("Manual test button pressed");
      testValidation();
      delay(1000); // Prevent multiple triggers
    }
  }
  
  // Check for serial commands (QR code data)
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("QR Code data received: " + qrData);
      processQRCode(qrData);
    }
  }
  
  // Auto-lock after timeout
  if (accessGranted && (millis() - lastValidation > VALIDATION_TIMEOUT)) {
    lockAccess();
  }
  
  delay(100);
}

void setupWiFi() {
  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  // Blink red LED while connecting
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_RED, HIGH);
    delay(250);
    digitalWrite(LED_RED, LOW);
    delay(250);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected successfully!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Success indication
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    delay(200);
    digitalWrite(LED_GREEN, LOW);
    delay(200);
  }
}

void testServerConnection() {
  Serial.println("Testing server connection...");
  
  http.begin(wifiClient, statusURL);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Server response: " + response);
    
    if (httpCode == 200) {
      Serial.println("✅ Server connection successful!");
      playSuccessSound();
    } else {
      Serial.println("⚠️ Server responded with error code: " + String(httpCode));
    }
  } else {
    Serial.println("❌ Failed to connect to server");
    playErrorSound();
  }
  
  http.end();
}

void processQRCode(String qrData) {
  Serial.println("Processing QR Code...");
  
  // Parse QR code data - expecting format: "gymOwnerId:memberId"
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("Invalid QR code format");
    playErrorSound();
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("Gym Owner ID: " + gymOwnerId);
  Serial.println("Member ID: " + memberId);
  
  // Validate membership
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("Validating membership...");
  
  // Show validation in progress
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, LOW);
  
  // Blink both LEDs to show processing
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, HIGH);
    delay(100);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, LOW);
    delay(100);
  }
  
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  String timestamp = getCurrentTimestamp();
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + timestamp + "\"";
  payload += "}";
  
  Serial.println("Sending request: " + payload);
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Server response: " + response);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (error) {
      Serial.println("JSON parsing failed: " + String(error.c_str()));
      denyAccess();
    } else {
      processValidationResponse(doc);
    }
  } else {
    Serial.println("HTTP request failed. Error code: " + String(httpCode));
    denyAccess();
  }
  
  http.end();
}

void processValidationResponse(DynamicJsonDocument &doc) {
  String status = doc["status"];
  String message = doc["message"];
  String nodeMcuResponse = doc["nodeMcuResponse"];
  
  Serial.println("Status: " + status);
  Serial.println("Message: " + message);
  Serial.println("NodeMCU Response: " + nodeMcuResponse);
  
  if (nodeMcuResponse == "ACTIVE") {
    // Access granted
    grantAccess();
    
    // Extract additional data if available
    if (doc.containsKey("data")) {
      String memberName = doc["data"]["memberName"];
      String gymName = doc["data"]["gymName"];
      
      Serial.println("✅ Access granted to: " + memberName);
      Serial.println("🏋️ Gym: " + gymName);
    }
  } else {
    // Access denied
    denyAccess();
    Serial.println("❌ Access denied: " + message);
  }
}

void grantAccess() {
  Serial.println("🔓 ACCESS GRANTED");
  
  accessGranted = true;
  lastValidation = millis();
  
  // Visual indicators
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, LOW);
  
  // Open door/relay
  digitalWrite(RELAY, HIGH);
  
  // Success sound
  playSuccessSound();
  
  Serial.println("Door unlocked for " + String(VALIDATION_TIMEOUT / 1000) + " seconds");
}

void denyAccess() {
  Serial.println("🔒 ACCESS DENIED");
  
  accessGranted = false;
  
  // Visual indicators
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  
  // Keep door locked
  digitalWrite(RELAY, LOW);
  
  // Error sound
  playErrorSound();
}

void lockAccess() {
  Serial.println("🔒 Auto-locking door");
  
  accessGranted = false;
  
  // Visual indicators
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  
  // Lock door
  digitalWrite(RELAY, LOW);
  
  // Brief sound indication
  tone(BUZZER, 1000, 200);
}

void playSuccessSound() {
  // Success melody
  tone(BUZZER, 1000, 200);
  delay(250);
  tone(BUZZER, 1200, 200);
  delay(250);
  tone(BUZZER, 1400, 300);
  delay(100);
}

void playErrorSound() {
  // Error sound
  for (int i = 0; i < 3; i++) {
    tone(BUZZER, 400, 200);
    delay(300);
  }
}

String getCurrentTimestamp() {
  // Get current time (you might want to use NTP for accurate time)
  unsigned long currentMillis = millis();
  return String(currentMillis);
}

void testValidation() {
  Serial.println("Running test validation...");
  
  // Test with sample data - replace with actual IDs for testing
  String testGymOwnerId = "675e0123456789012345678a";
  String testMemberId = "675e0123456789012345678b";
  
  validateMembership(testGymOwnerId, testMemberId);
}

// Additional utility functions
void blinkLED(int pin, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
  }
}

void displayStatus() {
  Serial.println("\n=== System Status ===");
  Serial.println("WiFi Status: " + String(WiFi.status()));
  Serial.println("IP Address: " + WiFi.localIP().toString());
  Serial.println("Access Status: " + String(accessGranted ? "GRANTED" : "DENIED"));
  Serial.println("Uptime: " + String(millis() / 1000) + " seconds");
  Serial.println("Free Heap: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("====================\n");
}