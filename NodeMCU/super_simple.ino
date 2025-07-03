/*
 * Super Simple NodeMCU Test
 * Minimal code that definitely works
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>

// ===== UPDATE THESE =====
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.4:5000/api/nodemcu/validate";

#define LED LED_BUILTIN

WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("");
  Serial.println("=== NodeMCU Gym Access Control ===");
  Serial.println("Starting up...");
  
  pinMode(LED, OUTPUT);
  digitalWrite(LED, HIGH); // OFF
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED, LOW);
    delay(250);
    digitalWrite(LED, HIGH);
    delay(250);
    Serial.print(".");
  }
  
  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // Success blink
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(200);
    digitalWrite(LED, HIGH);
    delay(200);
  }
  
  Serial.println("");
  Serial.println("System ready!");
  Serial.println("Send QR code in format: gymOwnerId:memberId");
  Serial.println("Example: 675e0123456789012345678a:675e0123456789012345678b");
  Serial.println("");
}

void loop() {
  if (Serial.available()) {
    String qrData = Serial.readString();
    qrData.trim();
    
    if (qrData.length() > 0) {
      Serial.println("-----------------------------");
      Serial.println("QR Code received: " + qrData);
      processQR(qrData);
      Serial.println("-----------------------------");
    }
  }
  
  delay(100);
}

void processQR(String qrData) {
  Serial.println("Processing QR code...");
  
  int separatorIndex = qrData.indexOf(':');
  
  if (separatorIndex == -1) {
    Serial.println("ERROR: Invalid format! Use: gymOwnerId:memberId");
    blinkError();
    return;
  }
  
  String gymOwnerId = qrData.substring(0, separatorIndex);
  String memberId = qrData.substring(separatorIndex + 1);
  
  Serial.println("Gym Owner ID: " + gymOwnerId);
  Serial.println("Member ID: " + memberId);
  
  validateMembership(gymOwnerId, memberId);
}

void validateMembership(String gymOwnerId, String memberId) {
  Serial.println("Validating membership...");
  
  // Show processing
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(300);
    digitalWrite(LED, HIGH);
    delay(300);
  }
  
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("ERROR: WiFi disconnected!");
    blinkError();
    return;
  }
  
  Serial.println("Sending request to server...");
  
  http.begin(wifiClient, serverURL);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  
  String payload = "{";
  payload += "\"gymOwnerId\":\"" + gymOwnerId + "\",";
  payload += "\"memberId\":\"" + memberId + "\",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";
  
  Serial.println("Payload: " + payload);
  
  digitalWrite(LED, LOW);
  delay(200);
  digitalWrite(LED, HIGH);
  delay(200);
  
  int httpCode = http.POST(payload);
  
  Serial.println("HTTP Response Code: " + String(httpCode));
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
    
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    
    if (!error) {
      String nodeMcuResponse = doc["nodeMcuResponse"];
      String message = doc["message"];
      
      Serial.println("NodeMCU Response: " + nodeMcuResponse);
      Serial.println("Message: " + message);
      
      if (nodeMcuResponse == "ACTIVE") {
        Serial.println("ACCESS GRANTED!");
        grantAccess();
      } else {
        Serial.println("ACCESS DENIED!");
        denyAccess();
      }
    } else {
      Serial.println("JSON parsing failed!");
      blinkError();
    }
  } else {
    Serial.println("HTTP request failed!");
    Serial.println("Make sure your backend server is running");
    blinkError();
  }
  
  http.end();
}

void grantAccess() {
  Serial.println("Granting access...");
  
  // LED ON for 5 seconds
  digitalWrite(LED, LOW);  // ON
  Serial.println("LED ON - Access granted for 5 seconds");
  
  delay(5000);
  
  digitalWrite(LED, HIGH); // OFF
  Serial.println("LED OFF - Access timeout");
  Serial.println("System ready for next scan");
}

void denyAccess() {
  Serial.println("Access denied - blinking LED");
  
  // 3 quick blinks
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
  }
  
  Serial.println("System ready for next scan");
}

void blinkError() {
  Serial.println("Error - blinking LED");
  
  // 3 quick blinks for error
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED, LOW);
    delay(150);
    digitalWrite(LED, HIGH);
    delay(150);
  }
}