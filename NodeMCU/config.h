// Configuration file for NodeMCU Gym Access Control System

#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Server Configuration
#define SERVER_HOST "your-backend-server.com"  // or IP address like "192.168.1.100"
#define SERVER_PORT 5000                       // Your backend server port
#define VALIDATE_ENDPOINT "/api/nodemcu/validate"
#define STATUS_ENDPOINT "/api/nodemcu/status"

// Pin Configuration (NodeMCU GPIO pins)
#define PIN_LED_GREEN    2    // D4 - Access granted LED (Green)
#define PIN_LED_RED     16    // D0 - Access denied LED (Red)
#define PIN_BUZZER      14    // D5 - Buzzer for audio feedback
#define PIN_RELAY       12    // D6 - Relay for door/gate control
#define PIN_BUTTON      13    // D7 - Manual test button
#define PIN_QR_SCANNER   4    // D2 - QR Scanner data pin (if using serial scanner)

// Timing Configuration
#define VALIDATION_TIMEOUT 10000    // 10 seconds - how long door stays open
#define WIFI_TIMEOUT 30000          // 30 seconds - WiFi connection timeout
#define HTTP_TIMEOUT 5000           // 5 seconds - HTTP request timeout

// QR Code Configuration
#define QR_SEPARATOR ":"            // Separator between gymOwnerId and memberId
#define QR_BUFFER_SIZE 100          // Maximum QR code data length

// Debug Configuration
#define DEBUG_MODE true             // Enable/disable debug serial output
#define SERIAL_BAUD 115200          // Serial communication speed

// LED Animation Configuration
#define BLINK_FAST 100              // Fast blink delay (ms)
#define BLINK_SLOW 500              // Slow blink delay (ms)
#define BLINK_PROCESSING 150        // Processing indication blink delay

// Sound Configuration
#define SOUND_SUCCESS_FREQ 1000     // Success sound frequency (Hz)
#define SOUND_ERROR_FREQ 400        // Error sound frequency (Hz)
#define SOUND_DURATION 200          // Default sound duration (ms)

#endif // CONFIG_H