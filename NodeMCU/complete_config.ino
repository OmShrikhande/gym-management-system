/*
 * Complete NodeMCU Configuration for Your Setup
 * Ready to use with your laptop backend server
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== YOUR CONFIGURATION =====
const char* ssid = "YOUR_WIFI_NAME";           // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi password

// Your laptop's IP address (192.168.1.4) + backend port (5000)
const char* serverURL = "http://192.168.1.4:5000/api/nodemcu/validate";
const char* statusURL = "http://192.168.1.4:5000/api/nodemcu/status";

// Pin definitions for NodeMCU
#define BUILTIN_LED 2  // Built-in LED (GPIO2) - Only LED we use
#define BUTTON D3      // Test button
#define RELAY D6       // Relay for door control (optional)

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== NodeMCU Gym Access Control ===");
  Serial.println("Connecting to your laptop backend...");
  
  // Initialize pins
  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  pinMode(RELAY, OUTPUT);
  
  // Set initial states
  digitalWrite(BUILTIN_LED, HIGH); // OFF initially (built-in LED is active LOW)
  digitalWrite(RELAY, LOW);        // Door locked
  
  // Connect to WiFi
  connectToWiFi();
  
  // Test backend connection
  testBackendConnection();
  
  Serial.println("\n🚀 System Ready!");
  Serial.println("📱 Send QR data format: gymOwnerId:memberId");
  Serial.println("🔘 Press button for test validation");
  Serial.println("\n💡 Built-in LED Indicators:");
  Serial.println("   - WiFi connecting: Fast blinking");
  Serial.println("   - Request processing: Slow blinking");
  Serial.println("   - Access granted: Steady ON for 5 seconds");
  Serial.println("   - Access denied: 3 quick blinks");
}

void loop() {
  // Check for button press (manual test)
  if (digitalRead(BUTTON) == LOW) {
    delay(50); // Debounce
    if (digitalRead(BUTTON) == LOW) {
      Serial.println("🔘 Test button pressed");
      runTestValidation();
      delay(1000);
    }
  }
  
  // Check for QR data via Serial Monitor
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("📱 QR Code received: " + qrData);
      processQRCode(qrData);
    }
  }
  
  delay(100);
}

void connectToWiFi() {
  Serial.print("📶 Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  // Blink built-in LED while connecting
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    digitalWrite(BUILTIN_LED, LOW);  // ON
    delay(250);
    digitalWrite(BUILTIN_LED, HIGH); // OFF
    delay(250);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📍 NodeMCU IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("🖥️ Backend IP: 192.168.1.4:5000");
    
    // Success indication: 3 quick blinks then OFF
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUILTIN_LED, LOW);  // ON
      delay(200);
      digitalWrite(BUILTIN_LED, HIGH); // OFF
      delay(200);
    }
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    // Error indication: 5 quick blinks
    for (int i = 0; i < 5; i++) {
      digitalWrite(BUILTIN_LED, LOW);
      delay(100);
      digitalWrite(BUILTIN_LED, HIGH);
      delay(100);
    }
  }
}

void testBackendConnection() {
  Serial.println("🔍 Testing backend connection...");
  
  http.begin(wifiClient, statusURL);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("📥 Backend response: " + response);
    
    if (httpCode == 200) {
      Serial.println("✅ Backend connection successful!");
      // Success: 2 quick blinks
      for (int i = 0; i < 2; i++) {
        digitalWrite(BUILTIN_LED, LOW);
        delay(150);
        digitalWrite(BUILTIN_LED, HIGH);
        delay(150);
      }
    } else {
      Serial.println("⚠️ Backend responded with code: " + String(httpCode));
    }
  } else {
    Serial.println("❌ Cannot connect to backend server!");
    Serial.println("❗ Make sure your backend is running on your laptop");
    // Error: 4 quick blinks
    for (int i = 0; i < 4; i++) {
      digitalWrite(BUILTIN_LED, LOW);
      delay(100);
      digitalWrite(BUILTIN_LED, HIGH);
      delay(100);
    }
  }
  
  http.end();
}

void processQRCode(String qrData) {
  // Parse QR code format: "gymOwnerId:memberId"
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("❌ Invalid QR format! Use: gymOwnerId:memberId");
    // Error: 3 quick blinks
    for (int i = 0; i < 3; i++) {
      digitalWrite(BUILTIN_LED, LOW);
      delay(150);
      digitalWrite(BUILTIN_LED, HIGH);
      delay(150);
    }
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("🏋️ Gym Owner ID: " + gymOwnerId);
  Serial.println("👤 Member ID: " + memberId);
  
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("🔍 Validating with your backend...");
  
  // Show processing with slow blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUILTIN_LED, LOW);  // ON
    delay(300);
    digitalWrite(BUILTIN_LED, HIGH); // OFF
    delay(300);
  }
  
  // Prepare HTTP request to your laptop
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000); // 10 second timeout
  
  // Create JSON payload
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";
  
  Serial.println("📤 Sending to laptop: " + payload);
  
  // Send POST request
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("📥 Laptop response: " + response);
    
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
        
        // Show member info if available
        if (doc.containsKey("data")) {
          Serial.println("👤 Member: " + String((const char*)doc["data"]["memberName"]));
          Serial.println("🏋️ Gym: " + String((const char*)doc["data"]["gymName"]));
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
    Serial.println("❗ Check if your laptop backend is running");
    denyAccess();
  }
  
  http.end();
}

void grantAccess() {
  Serial.println("✅ 🔓 ACCESS GRANTED!");
  
  // Turn LED ON for 5 seconds
  digitalWrite(BUILTIN_LED, LOW);  // ON
  
  // Open door/relay
  digitalWrite(RELAY, HIGH);
  
  // Keep access granted for 5 seconds
  delay(5000);
  
  // Reset to locked state
  digitalWrite(BUILTIN_LED, HIGH); // OFF
  digitalWrite(RELAY, LOW);
  
  Serial.println("🔒 Access timeout - door locked");
}

void denyAccess() {
  Serial.println("❌ 🔒 ACCESS DENIED!");
  
  // Keep door locked
  digitalWrite(RELAY, LOW);
  
  // Blink LED 3 times for access denied
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUILTIN_LED, LOW);  // ON
    delay(200);
    digitalWrite(BUILTIN_LED, HIGH); // OFF
    delay(200);
  }
}

void runTestValidation() {
  Serial.println("🧪 Running test validation...");
  Serial.println("❗ Replace these IDs with real ones from your database:");
  
  // Test with sample IDs - REPLACE WITH REAL IDs FROM YOUR DATABASE
  String testGymOwnerId = "675e0123456789012345678a";  // ← Replace this
  String testMemberId = "675e0123456789012345678b";    // ← Replace this
  
  validateMembership(testGymOwnerId, testMemberId);
}

// LED utility functions
void ledON() {
  digitalWrite(BUILTIN_LED, LOW);   // LOW = ON for built-in LED
}

void ledOFF() {
  digitalWrite(BUILTIN_LED, HIGH);  // HIGH = OFF for built-in LED
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    ledON();
    delay(delayMs);
    ledOFF();
    delay(delayMs);
  }
}