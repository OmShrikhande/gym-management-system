/*
 * Minimal NodeMCU Test - Built-in LED Only
 * Super simple version for testing
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== CONFIGURATION =====
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.4:5000/api/nodemcu/validate";

#define LED LED_BUILTIN  // Built-in LED (GPIO2)

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n=== NodeMCU Minimal Test ===");
  
  // Initialize LED
  pinMode(LED, OUTPUT);
  digitalWrite(LED, HIGH); // OFF initially
  
  // Connect to WiFi
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  // Fast blink while connecting
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED, LOW);   // ON
    delay(100);
    digitalWrite(LED, HIGH);  // OFF
    delay(100);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi connected!");
  Serial.println("IP: " + WiFi.localIP().toString());
  
  // Success: 3 quick blinks
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
  }
  
  Serial.println("Ready! Send QR data: gymOwnerId:memberId");
  Serial.println("LED: Fast blink=WiFi connecting, 3 blinks=Connected");
  Serial.println("     Slow blink=Processing, Steady ON=Access granted");
  Serial.println("     3 quick blinks=Access denied");
}

void loop() {
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("QR: " + qrData);
      processQR(qrData);
    }
  }
  
  delay(100);
}

void processQR(String qrData) {
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("Invalid format! Use: gymOwnerId:memberId");
    blinkError();
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("Gym ID: " + gymOwnerId);
  Serial.println("Member ID: " + memberId);
  
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("Validating...");
  
  // Show processing with slow blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(300);
    digitalWrite(LED, HIGH);
    delay(300);
  }
  
  // Prepare request
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";
  
  Serial.println("Sending: " + payload);
  
  // Blink during request
  digitalWrite(LED, LOW);
  delay(200);
  digitalWrite(LED, HIGH);
  delay(200);
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    // Parse response
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      String nodeMcuResponse = doc["nodeMcuResponse"];
      Serial.println("Result: " + nodeMcuResponse);
      
      if (nodeMcuResponse == "ACTIVE") {
        // ACCESS GRANTED - LED ON for 5 seconds
        Serial.println("✅ ACCESS GRANTED!");
        digitalWrite(LED, LOW);  // ON
        delay(5000);
        digitalWrite(LED, HIGH); // OFF
        Serial.println("Access timeout");
      } else {
        // ACCESS DENIED - 3 quick blinks
        Serial.println("❌ ACCESS DENIED!");
        blinkError();
      }
    } else {
      Serial.println("JSON error!");
      blinkError();
    }
  } else {
    Serial.println("HTTP error: " + String(httpCode));
    blinkError();
  }
  
  http.end();
}

void blinkError() {
  // 3 quick blinks for error/denied
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
  }
}