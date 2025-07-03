# NodeMCU Gym Access Control System

This system allows NodeMCU ESP8266 to validate gym membership by communicating with your backend server.

## 🔧 Hardware Setup

### Required Components:
- NodeMCU ESP8266 board
- 2x LEDs (Green & Red)
- 1x Buzzer
- 1x Relay module (for door control)
- 1x Push button
- Resistors (220Ω for LEDs, 10kΩ for button)
- Breadboard and jumper wires

### Pin Connections:
```
NodeMCU Pin  | Component        | Description
-------------|------------------|------------------
D4 (GPIO2)   | Green LED        | Access granted indicator
D0 (GPIO16)  | Red LED          | Access denied indicator  
D5 (GPIO14)  | Buzzer           | Audio feedback
D6 (GPIO12)  | Relay Module     | Door/gate control
D3 (GPIO0)   | Push Button      | Manual test button
3.3V         | VCC              | Power supply
GND          | GND              | Ground
```

## 📱 Software Setup

### 1. Arduino IDE Configuration:
```
1. Install Arduino IDE
2. Add ESP8266 board manager URL:
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
3. Install ESP8266 board package
4. Install required libraries:
   - ESP8266WiFi
   - ESP8266HTTPClient
   - ArduinoJson (version 6.x)
```

### 2. Code Configuration:
```cpp
// Update these in your code:
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://YOUR_SERVER_IP:5000/api/nodemcu/validate";
```

### 3. Upload Code:
1. Connect NodeMCU to computer via USB
2. Select board: "NodeMCU 1.0 (ESP-12E Module)"
3. Select correct COM port
4. Upload the code

## 🚀 Usage

### Method 1: QR Code Integration
```cpp
// QR Code format: "gymOwnerId:memberId"
// Example: "675e0123456789012345678a:675e0123456789012345678b"

// Send QR data via Serial Monitor:
// 1. Open Serial Monitor (115200 baud)
// 2. Type: gymOwnerId:memberId
// 3. Press Send
```

### Method 2: Manual Testing
```cpp
// Press the test button on NodeMCU
// or call testValidation() function with real IDs
```

### Method 3: External QR Scanner
```cpp
// Connect QR scanner to NodeMCU serial pins
// Scanner should output: gymOwnerId:memberId
```

## 🔄 System Flow

```
1. QR Code Scanned → NodeMCU receives data
2. NodeMCU parses gymOwnerId and memberId
3. NodeMCU sends HTTP POST to /api/nodemcu/validate
4. Backend validates membership
5. Backend responds with "ACTIVE" or "INACTIVE"
6. NodeMCU grants/denies access based on response
```

## 📊 Response Format

### Success Response:
```json
{
  "status": "success",
  "message": "Access granted to Gym Name",
  "nodeMcuResponse": "ACTIVE",
  "data": {
    "memberName": "John Doe",
    "gymName": "Fitness Center",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Error Response:
```json
{
  "status": "error",
  "message": "Member subscription is inactive",
  "nodeMcuResponse": "INACTIVE"
}
```

## 🔍 LED Indicators

| LED State | Meaning |
|-----------|---------|
| Red ON | System ready / Access denied |
| Green ON | Access granted |
| Both blinking | Processing request |
| Red blinking | WiFi connecting |
| Green blinking | System startup |

## 🔊 Audio Feedback

| Sound | Meaning |
|-------|---------|
| 3 ascending tones | Access granted |
| 3 low tones | Access denied |
| Single beep | System notification |

## 🛠️ Troubleshooting

### WiFi Connection Issues:
```
- Check SSID and password
- Ensure 2.4GHz network (ESP8266 doesn't support 5GHz)
- Check signal strength
```

### Server Connection Issues:
```
- Verify server IP address and port
- Check if server is running
- Test endpoint with Postman first
- Ensure firewall allows connections
```

### QR Code Issues:
```
- Verify QR format: gymOwnerId:memberId
- Check if IDs exist in database
- Ensure IDs are valid MongoDB ObjectIds
```

## 📋 Testing Checklist

### Before Deployment:
- [ ] WiFi connection working
- [ ] Server endpoint responding
- [ ] LEDs functioning correctly
- [ ] Buzzer working
- [ ] Relay controlling door/gate
- [ ] QR code parsing correct
- [ ] Valid member test passes
- [ ] Invalid member test fails
- [ ] Network timeout handling

### Test Commands:
```cpp
// Test with valid member (replace with real IDs):
675e0123456789012345678a:675e0123456789012345678b

// Test with invalid member:
invalid_gym_id:invalid_member_id
```

## 🔐 Security Considerations

1. **WiFi Security**: Use WPA2/WPA3 encrypted networks
2. **Server Security**: Use HTTPS in production
3. **Data Validation**: Server validates all input data
4. **Access Control**: Limited time access granted
5. **Audit Trail**: All access attempts logged

## 🚀 Production Deployment

### Hardware:
- Use proper enclosure for NodeMCU
- Add proper power supply (not USB)
- Install relay in control panel
- Mount LEDs and buzzer visibly
- Secure all connections

### Software:
- Change default WiFi credentials
- Update server URL to production
- Enable watchdog timer
- Add OTA update capability
- Configure logging level

## 🆘 Support

For issues:
1. Check Serial Monitor output
2. Verify network connectivity
3. Test server endpoint independently
4. Check hardware connections
5. Review backend logs

## 📝 Example QR Code Data

```
Valid QR Code Examples:
- 675e0123456789012345678a:675e0123456789012345678b
- 507f1f77bcf86cd799439011:507f1f77bcf86cd799439012

Invalid Examples:
- 12345:67890 (too short)
- invalid_data (no separator)
- :675e0123456789012345678b (missing gym ID)
```

## 🔧 Advanced Features

### OTA Updates:
```cpp
#include <ArduinoOTA.h>
// Add OTA update capability for remote code updates
```

### Watchdog Timer:
```cpp
#include <Ticker.h>
// Add watchdog to reset system if it hangs
```

### Deep Sleep:
```cpp
// Add power saving features for battery operation
ESP.deepSleep(10e6); // Sleep for 10 seconds
```