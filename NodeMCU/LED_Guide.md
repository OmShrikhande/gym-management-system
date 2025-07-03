# NodeMCU Built-in LED Behavior Guide

## 🔧 Hardware Setup
- **Only NodeMCU ESP8266** - No external components needed
- **Built-in LED** (GPIO2) - Only indicator used
- **Optional**: Test button on D3 (GPIO0)

## 💡 LED Behavior Patterns

### 1. **WiFi Connection Phase**
| Pattern | Meaning |
|---------|---------|
| **Fast blinking** (250ms on/off) | Connecting to WiFi |
| **3 quick blinks then OFF** | WiFi connected successfully |
| **5 quick blinks then OFF** | WiFi connection failed |

### 2. **Backend Connection Test**
| Pattern | Meaning |
|---------|---------|
| **2 slow blinks** | Testing backend connection |
| **2 quick blinks** | Backend connection successful |
| **4 quick blinks** | Backend connection failed |

### 3. **QR Code Validation**
| Pattern | Meaning |
|---------|---------|
| **Slow blinking** (300ms on/off) | Processing QR code |
| **3 quick blinks** | Invalid QR format |

### 4. **Access Control**
| Pattern | Meaning | Duration |
|---------|---------|----------|
| **Steady ON** | ✅ Access granted | 5 seconds |
| **3 quick blinks then OFF** | ❌ Access denied | 2 seconds |

### 5. **Error Conditions**
| Pattern | Meaning |
|---------|---------|
| **3 quick blinks** | JSON parsing error |
| **4 quick blinks** | HTTP request failed |
| **5 quick blinks** | System error |

## 🔍 Visual Timeline Example

```
Power ON → LED OFF
WiFi Connecting → ⚡⚡⚡⚡⚡⚡ (Fast blink)
WiFi Connected → ⚡⚡⚡ OFF (3 quick blinks)
Backend Test → ⚡⚡ (2 slow blinks)
Backend OK → ⚡⚡ (2 quick blinks)
System Ready → OFF

QR Code Received → ⚡⚡⚡ (Slow blink - processing)
Access Granted → ████████ (ON for 5 seconds)
Access Denied → ⚡⚡⚡ OFF (3 quick blinks)
```

## 🧪 Testing Patterns

### WiFi Test:
1. Power on NodeMCU
2. Watch for fast blinking (connecting)
3. Should see 3 quick blinks when connected

### Backend Test:
1. After WiFi connection
2. Watch for 2 slow blinks (testing)
3. Should see 2 quick blinks if successful

### QR Code Test:
1. Send via Serial Monitor: `gymOwnerId:memberId`
2. Watch for slow blinking (processing)
3. Result: Steady ON (granted) or 3 blinks (denied)

## 🚀 Quick Start

1. **Upload Code**: Use `minimal_test.ino` for simplest version
2. **Update WiFi**: Change SSID and password
3. **Start Backend**: Run your server on laptop
4. **Test**: Send QR data via Serial Monitor

## 📱 Serial Monitor Commands

```
// Valid test (replace with real IDs):
675e0123456789012345678a:675e0123456789012345678b

// Invalid test:
invalid:format
```

## 🔧 Troubleshooting

### LED Not Blinking During WiFi:
- Check WiFi credentials
- Ensure 2.4GHz network
- Check power supply

### No Response to QR:
- Check Serial Monitor baud rate (115200)
- Verify QR format: `gymOwnerId:memberId`
- Ensure backend is running

### Always Access Denied:
- Check if gym owner and member exist in database
- Verify member belongs to gym
- Check member subscription status

## 🎯 Production Tips

1. **Enclosure**: Use clear case to see LED
2. **Positioning**: Mount LED visibly
3. **Documentation**: Label LED meanings for users
4. **Testing**: Test all patterns before deployment