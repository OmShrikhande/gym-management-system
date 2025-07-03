/*
 * Simple NodeMCU Test Code for Gym Access Control
 * This is a basic version for testing the backend integration
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.4:5000/api/nodemcu/validate";  // Your laptop's IP address

// Pin definitions
#define LED_GREEN D4   // Green LED - Access granted
#define LED_RED D0     // Red LED - Access denied
#define BUZZER D5      // Buzzer for sounds
#define BUTTON D3      // Test button

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== NodeMCU Gym Access Control Test ===");
  
  // Initialize pins
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  
  // Set initial states
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(BUZZER, LOW);
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Success indication
  blinkLED(LED_GREEN, 3, 200);
  
  Serial.println("System ready! Press button to test or send QR data via Serial");
  Serial.println("QR Format: gymOwnerId:memberId");
}

void loop() {
  // Check for button press
  if (digitalRead(BUTTON) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON) == LOW) {
      Serial.println("Button pressed - running test");
      testValidation();
      delay(1000);
    }
  }
  
  // Check for QR data via Serial
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("QR Code received: " + qrData);
      processQRCode(qrData);
    }
  }
  
  delay(100);
}

void processQRCode(String qrData) {
  // Parse QR code - expecting format: "gymOwnerId:memberId"
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("❌ Invalid QR code format! Expected: gymOwnerId:memberId");
    playErrorSound();
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("Gym Owner ID: " + gymOwnerId);
  Serial.println("Member ID: " + memberId);
  
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("🔍 Validating membership...");
  
  // Show processing
  blinkBothLEDs(3, 100);
  
  // Prepare HTTP request
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  
  // Create JSON payload
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";
  
  Serial.println("📤 Sending: " + payload);
  
  // Send request
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("📥 Response: " + response);
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      String nodeMcuResponse = doc["nodeMcuResponse"];
      String message = doc["message"];
      
      Serial.println("🎯 NodeMCU Response: " + nodeMcuResponse);
      Serial.println("💬 Message: " + message);
      
      if (nodeMcuResponse == "ACTIVE") {
        grantAccess();
        
        // Print member info if available
        if (doc.containsKey("data")) {
          String memberName = doc["data"]["memberName"];
          String gymName = doc["data"]["gymName"];
          Serial.println("👤 Member: " + memberName);
          Serial.println("🏋️ Gym: " + gymName);
        }
      } else {
        denyAccess();
      }
    } else {
      Serial.println("❌ JSON parsing failed!");
      denyAccess();
    }
  } else {
    Serial.println("❌ HTTP request failed! Code: " + String(httpCode));
    denyAccess();
  }
  
  http.end();
}

void grantAccess() {
  Serial.println("✅ ACCESS GRANTED!");
  
  // Visual feedback
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_RED, LOW);
  
  // Audio feedback
  playSuccessSound();
  
  // Keep access granted for 5 seconds
  delay(5000);
  
  // Reset to default state
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  
  Serial.println("🔒 Access timeout - system reset");
}

void denyAccess() {
  Serial.println("❌ ACCESS DENIED!");
  
  // Visual feedback
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_RED, HIGH);
  
  // Audio feedback
  playErrorSound();
}

void testValidation() {
  Serial.println("🧪 Running test validation...");
  
  // Replace these with actual IDs from your database for testing
  String testGymOwnerId = "675e0123456789012345678a";  // Replace with real gym owner ID
  String testMemberId = "675e0123456789012345678b";    // Replace with real member ID
  
  validateMembership(testGymOwnerId, testMemberId);
}

void playSuccessSound() {
  tone(BUZZER, 1000, 200);
  delay(250);
  tone(BUZZER, 1200, 200);
  delay(250);
  tone(BUZZER, 1400, 300);
}

void playErrorSound() {
  for (int i = 0; i < 3; i++) {
    tone(BUZZER, 400, 200);
    delay(300);
  }
}

void blinkLED(int pin, int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(delayMs);
    digitalWrite(pin, LOW);
    delay(delayMs);
  }
}

void blinkBothLEDs(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_RED, HIGH);
    delay(delayMs);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_RED, LOW);
    delay(delayMs);
  }
}