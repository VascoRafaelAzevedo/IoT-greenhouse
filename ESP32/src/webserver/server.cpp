/**
 * @file server.cpp
 * @brief Local web server for real-time greenhouse monitoring
 * 
 * Provides a minimal, elegant interface accessible via local AP
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

// External HTML content
extern const char* HTML_CONTENT;

WebServer server(80);

// Current sensor readings (updated by main loop)
struct CurrentReadings {
  float temperature;
  float humidity;
  float light;
  bool tankLevel;
  bool pumpOn;
  bool heatingOn;
  bool ledOn;
  bool fanOn;
  unsigned long lastUpdate;
} currentReadings;

/**
 * Handle root page request
 */
void handleRoot() {
  server.send(200, "text/html", HTML_CONTENT);
}

/**
 * Handle API endpoint for current data (JSON)
 */
void handleData() {
  char json[512];
  snprintf(json, sizeof(json),
    "{"
    "\"temperature\":%.1f,"
    "\"humidity\":%.1f,"
    "\"light\":%.0f,"
    "\"tank_level\":%s,"
    "\"pump\":%s,"
    "\"heating\":%s,"
    "\"led\":%s,"
    "\"fan\":%s,"
    "\"last_update\":%lu"
    "}",
    currentReadings.temperature,
    currentReadings.humidity,
    currentReadings.light,
    currentReadings.tankLevel ? "true" : "false",
    currentReadings.pumpOn ? "true" : "false",
    currentReadings.heatingOn ? "true" : "false",
    currentReadings.ledOn ? "true" : "false",
    currentReadings.fanOn ? "true" : "false",
    currentReadings.lastUpdate
  );
  
  server.send(200, "application/json", json);
}

/**
 * Initialize web server
 */
void initWebServer() {
  server.on("/", handleRoot);
  server.on("/data", handleData);
  
  server.begin();
  Serial.println("Web server started on http://192.168.4.1");
}

/**
 * Update current readings (called from main loop)
 */
void updateCurrentReadings(float temp, float hum, float light, bool tank,
                          bool pump, bool heating, bool led, bool fan) {
  currentReadings.temperature = temp;
  currentReadings.humidity = hum;
  currentReadings.light = light;
  currentReadings.tankLevel = tank;
  currentReadings.pumpOn = pump;
  currentReadings.heatingOn = heating;
  currentReadings.ledOn = led;
  currentReadings.fanOn = fan;
  currentReadings.lastUpdate = millis();
}

/**
 * Process web server (must be called regularly in loop)
 */
void processWebServer() {
  server.handleClient();
}
