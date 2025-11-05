/**
 * @file server.cpp
 * @brief Local web server for real-time greenhouse monitoring
 * 
 * Provides a minimal, elegant interface accessible via local AP
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include "../control/control.h"

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
 * Handle API endpoint for getting current setpoints (JSON)
 */
void handleGetSetpoints() {
  float temp_min, temp_max, hum_air_max, light_intensity;
  unsigned long irrigation_interval_minutes, irrigation_duration_seconds;
  
  getCurrentSetpoints(temp_min, temp_max, hum_air_max, light_intensity,
                     irrigation_interval_minutes, irrigation_duration_seconds);
  
  char json[512];
  snprintf(json, sizeof(json),
    "{"
    "\"temp_min\":%.1f,"
    "\"temp_max\":%.1f,"
    "\"hum_air_max\":%.1f,"
    "\"light_intensity\":%.0f,"
    "\"irrigation_interval_minutes\":%lu,"
    "\"irrigation_duration_seconds\":%lu"
    "}",
    temp_min, temp_max, hum_air_max, light_intensity,
    irrigation_interval_minutes, irrigation_duration_seconds
  );
  
  server.send(200, "application/json", json);
}

/**
 * Handle API endpoint for updating setpoints (POST)
 */
void handleUpdateSetpoints() {
  if (server.method() != HTTP_POST) {
    server.send(405, "text/plain", "Method Not Allowed");
    return;
  }
  
  // Parse URL parameters
  float temp_min = server.arg("temp_min").toFloat();
  float temp_max = server.arg("temp_max").toFloat();
  float hum_air_max = server.arg("hum_air_max").toFloat();
  float light_intensity = server.arg("light_intensity").toFloat();
  unsigned long irrigation_interval = server.arg("irrigation_interval_minutes").toInt();
  unsigned long irrigation_duration = server.arg("irrigation_duration_seconds").toInt();
  
  // Basic validation
  if (temp_min <= 0 || temp_max <= 0 || temp_min >= temp_max) {
    server.send(400, "text/plain", "Invalid temperature range");
    return;
  }
  
  if (hum_air_max <= 0 || hum_air_max > 100) {
    server.send(400, "text/plain", "Invalid humidity (0-100)");
    return;
  }
  
  if (light_intensity < 0) {
    server.send(400, "text/plain", "Invalid light intensity");
    return;
  }
  
  if (irrigation_interval == 0 || irrigation_duration == 0) {
    server.send(400, "text/plain", "Invalid irrigation values");
    return;
  }
  
  // Update setpoints (same function used by MQTT)
  updateSetpoints(temp_min, temp_max, hum_air_max, light_intensity,
                 irrigation_interval, irrigation_duration);
  
  server.send(200, "application/json", "{\"status\":\"ok\",\"message\":\"Setpoints updated\"}");
}

/**
 * Initialize web server
 */
void initWebServer() {
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.on("/setpoints", HTTP_GET, handleGetSetpoints);
  server.on("/setpoints", HTTP_POST, handleUpdateSetpoints);
  
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
