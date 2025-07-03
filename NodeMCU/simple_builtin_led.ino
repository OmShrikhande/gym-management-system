/*
 * NodeMCU Gym Access Control - Built-in LED Only
 * Using only the built-in LED for all indications
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

// Built-in LED pin (GPIO2 - D4)
#define BUILTIN_LED 2    // Built-in LED on NodeMCU
#define BUTTON D3        // Test button (optional)

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== NodeMCU Gym Access Control ===");
  Serial.println("Using built-in LED for all indications");
  
  // Initialize built-in LED
  pinMode(BUILTIN_LED, OUTPUT);
  pinMode(BUTTON, INPUT_PULLUP);
  
  // LED OFF initially (HIGH = OFF for built-in LED)
  digitalWrite(BUILTIN_LED, HIGH);
  
  // Connect to WiFi with LED indication
  connectToWiFi();
  
  // Test backend connection
  testBackendConnection();
  
  Serial.println("\n🚀 System Ready!");
  Serial.println("📱 Send QR data format: gymOwnerId:memberId");
  Serial.println("🔘 Press button for test validation");
  Serial.println("\n💡 LED Indicators:");
  Serial.println("   - WiFi connecting: Fast blinking");
  Serial.println("   - WiFi connected: 3 quick blinks then OFF");
  Serial.println("   - Processing request: Slow blinking");
  Serial.println("   - Access granted: Steady ON for 5 seconds");
  Serial.println("   - Access denied: 3 quick blinks then OFF");
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
  
  // Fast blink while connecting to WiFi
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 60) {
    blinkLED(1, 100);  // Fast blink
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("📍 NodeMCU IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("🖥️ Backend IP: 192.168.1.4:5000");
    
    // Success indication: 3 quick blinks then OFF
    blinkLED(3, 150);
    ledOFF();
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    // Error indication: 5 quick blinks then OFF
    blinkLED(5, 100);
    ledOFF();
  }
}

void testBackendConnection() {
  Serial.println("🔍 Testing backend connection...");
  
  // Show processing with slow blink
  blinkLED(2, 300);
  
  http.begin(wifiClient, statusURL);
  http.setTimeout(5000);
  
  int httpCode = http.GET();
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("📥 Backend response: " + response);
    
    if (httpCode == 200) {
      Serial.println("✅ Backend connection successful!");
      // Success: 2 quick blinks
      blinkLED(2, 150);
    } else {
      Serial.println("⚠️ Backend responded with code: " + String(httpCode));
      // Warning: 4 quick blinks
      blinkLED(4, 100);
    }
  } else {
    Serial.println("❌ Cannot connect to backend server!");
    Serial.println("❗ Make sure your backend is running on your laptop");
    // Error: 5 quick blinks
    blinkLED(5, 100);
  }
  
  ledOFF();
  http.end();
}

void processQRCode(String qrData) {
  // Parse QR code format: "gymOwnerId:memberId"
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("❌ Invalid QR format! Use: gymOwnerId:memberId");
    // Error: 3 quick blinks
    blinkLED(3, 100);
    ledOFF();
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
  
  // Show processing with slow blinking
  for (int i = 0; i < 3; i++) {
    ledON();
    delay(200);
    ledOFF();
    delay(200);
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
  
  // Show request in progress with continuous slow blink
  for (int i = 0; i < 2; i++) {
    ledON();
    delay(300);
    ledOFF();
    delay(300);
  }
  
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
  
  // Turn LED ON continuously for 5 seconds
  ledON();
  delay(5000);
  
  // Turn LED OFF
  ledOFF();
  
  Serial.println("🔒 Access timeout - system ready");
}

void denyAccess() {
  Serial.println("❌ 🔒 ACCESS DENIED!");
  
  // Blink LED 3 times for access denied
  blinkLED(3, 200);
  
  // Turn LED OFF
  ledOFF();
}

void runTestValidation() {
  Serial.println("🧪 Running test validation...");
  Serial.println("❗ Replace these IDs with real ones from your database:");
  
  // Test with sample IDs - REPLACE WITH REAL IDs FROM YOUR DATABASE
  String testGymOwnerId = "675e0123456789012345678a";  // ← Replace this
  String testMemberId = "675e0123456789012345678b";    // ← Replace this
  
  validateMembership(testGymOwnerId, testMemberId);
}

// LED control functions (Built-in LED is active LOW)
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

// Status check function
void showStatus() {
  Serial.println("\n=== System Status ===");
  Serial.println("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("IP: " + WiFi.localIP().toString());
  }
  Serial.println("Free Memory: " + String(ESP.getFreeHeap()) + " bytes");
  Serial.println("Uptime: " + String(millis() / 1000) + " seconds");
  Serial.println("==================\n");
}