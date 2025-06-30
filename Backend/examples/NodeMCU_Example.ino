/*
 * NodeMCU Gym Access Control System
 * This example shows how to integrate NodeMCU with the Gym Management System API
 * 
 * Hardware Requirements:
 * - NodeMCU ESP8266
 * - RFID Reader (RC522)
 * - Relay Module (for door lock)
 * - LED indicators (Green/Red)
 * - Buzzer (optional)
 * 
 * API Endpoints:
 * - POST /api/nodemcu/verify - Verify membership
 * - POST /api/nodemcu/health - Device health check
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* serverURL = "http://YOUR_SERVER_IP:8081/api/nodemcu";
const String gymOwnerId = "YOUR_GYM_OWNER_ID"; // Get this from your gym owner account
const String deviceId = "DEVICE_001"; // Unique identifier for this device

// Pin definitions
#define RST_PIN         9
#define SS_PIN          10
#define RELAY_PIN       2   // Door lock relay
#define GREEN_LED_PIN   4   // Access granted LED
#define RED_LED_PIN     5   // Access denied LED
#define BUZZER_PIN      6   // Buzzer for feedback

// RFID
MFRC522 mfrc522(SS_PIN, RST_PIN);

// WiFi and HTTP client
WiFiClient wifiClient;
HTTPClient http;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize all outputs to OFF
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Initialize SPI and RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Connect to WiFi
  connectToWiFi();
  
  // Send device health check
  sendHealthCheck();
  
  Serial.println("Gym Access Control System Ready!");
  Serial.println("Present RFID card to verify membership...");
}

void loop() {
  // Check for new RFID card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardUID = getCardUID();
    Serial.println("Card detected: " + cardUID);
    
    // Use card UID as member ID (you might want to map this differently)
    verifyMembership(cardUID);
    
    // Halt PICC
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }
  
  delay(1000);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

String getCardUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void verifyMembership(String memberId) {
  if (WiFi.status() == WL_CONNECTED) {
    http.begin(wifiClient, String(serverURL) + "/verify");
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["gymOwnerId"] = gymOwnerId;
    doc["memberId"] = memberId;
    doc["deviceId"] = deviceId;
    doc["timestamp"] = WiFi.getTime(); // You might want to use NTP for accurate time
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    Serial.println("Sending verification request...");
    Serial.println("Payload: " + jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
      
      // Parse response
      StaticJsonDocument<300> responseDoc;
      deserializeJson(responseDoc, response);
      
      String status = responseDoc["status"];
      String message = responseDoc["message"];
      String memberName = responseDoc["memberName"];
      
      if (status == "ACTIVE") {
        grantAccess(memberName, message);
      } else {
        denyAccess(message);
      }
    } else {
      Serial.println("Error in HTTP request: " + String(httpResponseCode));
      denyAccess("System Error");
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
    denyAccess("No Network");
  }
}

void grantAccess(String memberName, String message) {
  Serial.println("ACCESS GRANTED: " + memberName);
  Serial.println("Message: " + message);
  
  // Visual feedback
  digitalWrite(GREEN_LED_PIN, HIGH);
  digitalWrite(RED_LED_PIN, LOW);
  
  // Audio feedback - success beep
  digitalWrite(BUZZER_PIN, HIGH);
  delay(200);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(200);
  digitalWrite(BUZZER_PIN, LOW);
  
  // Unlock door
  digitalWrite(RELAY_PIN, HIGH);
  
  // Keep door unlocked for 5 seconds
  delay(5000);
  
  // Lock door and turn off LED
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, LOW);
}

void denyAccess(String reason) {
  Serial.println("ACCESS DENIED: " + reason);
  
  // Visual feedback
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);
  
  // Audio feedback - error beep
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }
  
  // Keep red LED on for 3 seconds
  delay(3000);
  digitalWrite(RED_LED_PIN, LOW);
}

void sendHealthCheck() {
  if (WiFi.status() == WL_CONNECTED) {
    http.begin(wifiClient, String(serverURL) + "/health");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<100> doc;
    doc["deviceId"] = deviceId;
    doc["gymOwnerId"] = gymOwnerId;
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Health check response: " + response);
    }
    
    http.end();
  }
}