/*
 * Fixed Debug Version - Clean NodeMCU Code
 * Compatible with Arduino IDE
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
const char* ssid = "LUCIFER08 6521";     // Replace with your WiFi name
const char* password = "12345678"; // Replace with your WiFi password
const char* serverURL = "http://192.168.1.4:5000/api/nodemcu/validate";

#define LED LED_BUILTIN  // Built-in LED

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(2000);  // Wait 2 seconds for serial to initialize
  
  Serial.println("\n==================================================");
  Serial.println("🔧 NODEMCU DEBUG VERSION");
  Serial.println("🔧 Version: 1.0");
  Serial.println("🔧 Build: " + String(__DATE__) + " " + String(__TIME__));
  Serial.println("==================================================");
  
  // Initialize LED
  pinMode(LED, OUTPUT);
  digitalWrite(LED, HIGH); // OFF initially
  Serial.println("💡 LED initialized");
  
  // Connect to WiFi
  Serial.println("📶 Starting WiFi connection...");
  Serial.println("📶 SSID: " + String(ssid));
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  Serial.print("📶 Connecting");
  
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    digitalWrite(LED, LOW);   // ON
    delay(250);
    digitalWrite(LED, HIGH);  // OFF
    delay(250);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected successfully!");
    Serial.println("📍 IP Address: " + WiFi.localIP().toString());
    Serial.println("📍 Gateway: " + WiFi.gatewayIP().toString());
    Serial.println("📍 Subnet: " + WiFi.subnetMask().toString());
    
    // Success blink
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED, LOW);
      delay(200);
      digitalWrite(LED, HIGH);
      delay(200);
    }
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    Serial.println("❌ Status: " + String(WiFi.status()));
    
    // Error blink
    for (int i = 0; i < 5; i++) {
      digitalWrite(LED, LOW);
      delay(100);
      digitalWrite(LED, HIGH);
      delay(100);
    }
  }
  
  Serial.println("\n🚀 System ready!");
  Serial.println("📝 Instructions:");
  Serial.println("   1. Send QR format: gymOwnerId:memberId");
  Serial.println("   2. Example: 675e0123456789012345678a:675e0123456789012345678b");
  Serial.println("   3. Watch Serial Monitor for detailed logs");
  Serial.println("==================================================");
}

void loop() {
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("\n------------------------------");
      Serial.println("📱 QR Code received: [" + qrData + "]");
      Serial.println("📱 Length: " + String(qrData.length()));
      processQR(qrData);
      Serial.println("------------------------------");
    }
  }
  
  delay(100);
}

void processQR(String qrData) {
  Serial.println("🔍 Processing QR code...");
  
  int separatorIndex = qrData.indexOf(':');
  Serial.println("🔍 Separator found at position: " + String(separatorIndex));
  
  if (separatorIndex == -1) {
    Serial.println("❌ ERROR: Invalid QR format!");
    Serial.println("❌ Expected format: gymOwnerId:memberId");
    Serial.println("❌ Received: [" + qrData + "]");
    blinkError();
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("🏋️ Gym Owner ID: [" + gymOwnerId + "]");
  Serial.println("👤 Member ID: [" + memberId + "]");
  Serial.println("🏋️ Gym ID Length: " + String(gymOwnerId.length()));
  Serial.println("👤 Member ID Length: " + String(memberId.length()));
  
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("🔍 Starting validation...");
  
  // Show processing
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(300);
    digitalWrite(LED, HIGH);
    delay(300);
    Serial.println("🔍 Processing step " + String(i + 1) + "/3");
  }
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ ERROR: WiFi disconnected!");
    blinkError();
    return;
  }
  
  Serial.println("📤 Preparing HTTP request...");
  Serial.println("📤 Server URL: " + String(serverURL));
  
  // Prepare request
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";
  
  Serial.println("📤 Payload: " + payload);
  Serial.println("📤 Payload length: " + String(payload.length()));
  
  // Send request
  Serial.println("📤 Sending POST request...");
  digitalWrite(LED, LOW);
  delay(200);
  digitalWrite(LED, HIGH);
  delay(200);
  
  int httpCode = http.POST(payload);
  
  Serial.println("📥 HTTP Response Code: " + String(httpCode));
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("📥 Response received:");
    Serial.println("📥 Response length: " + String(response.length()));
    Serial.println("📥 Raw response: [" + response + "]");
    
    // Parse response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      String nodeMcuResponse = doc["nodeMcuResponse"];
      String message = doc["message"];
      String status = doc["status"];
      
      Serial.println("📥 Status: [" + status + "]");
      Serial.println("📥 Message: [" + message + "]");
      Serial.println("📥 NodeMCU Response: [" + nodeMcuResponse + "]");
      
      if (nodeMcuResponse == "ACTIVE") {
        Serial.println("✅ SUCCESS: ACCESS GRANTED!");
        grantAccess();
      } else {
        Serial.println("❌ DENIED: ACCESS DENIED!");
        Serial.println("❌ Reason: " + message);
        denyAccess();
      }
    } else {
      Serial.println("❌ ERROR: JSON parsing failed!");
      Serial.println("❌ JSON Error: " + String(error.c_str()));
      Serial.println("❌ Raw response: [" + response + "]");
      blinkError();
    }
  } else {
    Serial.println("❌ ERROR: HTTP request failed!");
    Serial.println("❌ HTTP Code: " + String(httpCode));
    Serial.println("❌ WiFi Status: " + String(WiFi.status()));
    blinkError();
  }
  
  http.end();
  Serial.println("🔚 Validation complete");
}

void grantAccess() {
  Serial.println("🔓 GRANTING ACCESS...");
  
  // LED ON for 5 seconds
  digitalWrite(LED, LOW);  // ON
  Serial.println("💡 LED ON - Access granted for 5 seconds");
  
  delay(5000);
  
  digitalWrite(LED, HIGH); // OFF
  Serial.println("💡 LED OFF - Access timeout");
  Serial.println("🔒 System ready for next scan");
}

void denyAccess() {
  Serial.println("🔒 ACCESS DENIED - Blinking LED");
  
  // 3 quick blinks
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
    Serial.println("💡 Blink " + String(i + 1) + "/3");
  }
  
  Serial.println("🔒 System ready for next scan");
}

void blinkError() {
  Serial.println("⚠️ ERROR INDICATION - Blinking LED");
  
  // 3 quick blinks for error
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
    Serial.println("⚠️ Error blink " + String(i + 1) + "/3");
  }
}