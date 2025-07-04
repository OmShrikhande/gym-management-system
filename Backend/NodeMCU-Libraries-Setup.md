# NodeMCU Libraries Setup

## Required Libraries:

### 1. **ESP8266 Board Package**
- In Arduino IDE: File → Preferences → Additional Boards Manager URLs
- Add: `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
- Tools → Board → Boards Manager → Search "ESP8266" → Install

### 2. **WebSocketsClient Library**
- Library Manager → Search "WebSocketsClient" → Install "WebSockets by Markus Sattler"

### 3. **ArduinoJson Library**
- Library Manager → Search "ArduinoJson" → Install "ArduinoJson by Benoit Blanchon"

### 4. **ESP8266HTTPClient Library**
- Usually comes with ESP8266 board package

## Hardware Connections:

### **NodeMCU Pin Connections:**
```
Device Component  → NodeMCU Pin → GPIO
==========================================
Green LED         → D4         → GPIO2
Red LED           → D0         → GPIO16
Door Lock Relay   → D1         → GPIO5
Buzzer            → D2         → GPIO4
Status LED        → D6         → GPIO12
```

### **Relay Module Connection:**
```
Relay Module:
- VCC → 3.3V (NodeMCU)
- GND → GND (NodeMCU)
- IN  → D1 (GPIO5)
- NO  → Door Lock Positive
- COM → 12V Power Supply
```

### **LED Connections:**
```
LED Connection:
- Anode (Long leg) → NodeMCU Pin
- Cathode (Short leg) → 220Ω Resistor → GND
```

## Configuration Steps:

### 1. **Update WiFi Credentials:**
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. **Update Server Details:**
```cpp
const char* serverHost = "192.168.1.100"; // Your server IP
const int serverPort = 5000;
```

### 3. **Update Gym Owner ID:**
```cpp
const char* gymOwnerId = "YOUR_ACTUAL_GYM_OWNER_ID";
```

### 4. **Update Device ID:**
```cpp
String deviceId = "NodeMCU_GYM_001"; // Unique device identifier
```

## Installation Steps:

1. **Install Arduino IDE**
2. **Install ESP8266 Board Package**
3. **Install Required Libraries**
4. **Connect NodeMCU to Computer**
5. **Select Board: NodeMCU 1.0 (ESP-12E Module)**
6. **Select Port: COM Port where NodeMCU is connected**
7. **Upload the Code**

## Testing:

1. **Power on NodeMCU**
2. **Check Serial Monitor (115200 baud)**
3. **Device should connect to WiFi**
4. **Device should register with server**
5. **Test QR scan from mobile app**
6. **Device should receive response and control access**

## Troubleshooting:

### **Common Issues:**
- **WiFi Connection Failed:** Check SSID/Password
- **Server Connection Failed:** Check server IP and port
- **Device Not Registered:** Check gymOwnerId format
- **No Response from Server:** Check server is running with Socket.IO

### **Debug Steps:**
1. **Check Serial Monitor output**
2. **Verify WiFi connection**
3. **Check server logs**
4. **Test with sample client first**
5. **Verify hardware connections**