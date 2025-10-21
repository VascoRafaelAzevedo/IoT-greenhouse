/**
 * @file client.cpp
 * @brief MQTT client implementation with WiFi and JSON support
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "../config.h"
#include "../control/control.h"
#include "mqtt.h"

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
bool ntpSynced = false;

// Topic buffers
char telemetryTopic[100];
char setpointTopic[100];

/**
 * Callback for incoming MQTT messages
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Message received on topic: ");
  Serial.println(topic);
  
  // Convert payload to string
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';
  
  Serial.print("Payload: ");
  Serial.println(message);
  
  // Parse JSON
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("❌ JSON parsing failed: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract setpoints from JSON
  // Database schema: target_temp_min, target_temp_max, target_hum_air_max,
  // irrigation_interval_minutes, irrigation_duration_seconds, target_light_intensity
  
  float temp_min = doc["target_temp_min"] | DEFAULT_TEMP_MIN;
  float temp_max = doc["target_temp_max"] | DEFAULT_TEMP_MAX;
  float hum_air_max = doc["target_hum_air_max"] | DEFAULT_HUM_AIR_MAX;
  float light_intensity = doc["target_light_intensity"] | DEFAULT_LIGHT_INTENSITY;
  unsigned long irrigation_interval = doc["irrigation_interval_minutes"] | DEFAULT_IRRIGATION_INTERVAL_MINUTES;
  unsigned long irrigation_duration = doc["irrigation_duration_seconds"] | DEFAULT_IRRIGATION_DURATION_SECONDS;
  
  // Update control logic setpoints
  updateSetpoints(temp_min, temp_max, hum_air_max, light_intensity, 
                  irrigation_interval, irrigation_duration);
}

/**
 * Initialize WiFi connection
 */
void initWiFi() {
  Serial.println("\n🌐 Connecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    
    // Initialize NTP time synchronization
    Serial.println("\n⏰ Synchronizing time with NTP...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    
    // Wait for time to be set
    struct tm timeinfo;
    int ntpAttempts = 0;
    while (!getLocalTime(&timeinfo) && ntpAttempts < 10) {
      Serial.print(".");
      delay(500);
      ntpAttempts++;
    }
    
    if (getLocalTime(&timeinfo)) {
      ntpSynced = true;
      Serial.println("\n✅ Time synchronized!");
      Serial.print("Current time: ");
      Serial.println(&timeinfo, "%Y-%m-%d %H:%M:%S");
    } else {
      Serial.println("\n⚠️  Time sync failed, will use uptime-based timestamps");
      ntpSynced = false;
    }
  } else {
    Serial.println("\n❌ WiFi connection failed!");
    Serial.println("⚠️  System will continue without MQTT");
  }
}

/**
 * Initialize MQTT client
 */
void initMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️  WiFi not connected, skipping MQTT initialization");
    return;
  }
  
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512); // Increase buffer for larger JSON messages
  
  // Build topic strings
  snprintf(telemetryTopic, sizeof(telemetryTopic), "greenhouse/%s/telemetry", GREENHOUSE_ID);
  snprintf(setpointTopic, sizeof(setpointTopic), "greenhouse/%s/setpoints", GREENHOUSE_ID);
  
  Serial.println("📡 MQTT client initialized");
  Serial.print("Telemetry topic: ");
  Serial.println(telemetryTopic);
  Serial.print("Setpoint topic: ");
  Serial.println(setpointTopic);
}

/**
 * Connect to MQTT broker
 * @return true if connected, false otherwise
 */
bool connectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }
  
  Serial.print("📡 Connecting to MQTT broker (");
  Serial.print(MQTT_BROKER);
  Serial.print(":");
  Serial.print(MQTT_PORT);
  Serial.print(")...");
  
  bool connected = false;
  
  // Connect with or without authentication
  if (strlen(MQTT_USER) > 0) {
    connected = mqttClient.connect(DEVICE_ID, MQTT_USER, MQTT_PASSWORD);
  } else {
    connected = mqttClient.connect(DEVICE_ID);
  }
  
  if (connected) {
    Serial.println(" ✅ Connected");
    
    // Subscribe to setpoints topic
    if (mqttClient.subscribe(setpointTopic)) {
      Serial.print("✅ Subscribed to: ");
      Serial.println(setpointTopic);
    } else {
      Serial.println("❌ Failed to subscribe to setpoints topic");
    }
    
    return true;
  } else {
    Serial.print(" ❌ Failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }
}

/**
 * Check if MQTT is connected
 * @return true if connected, false otherwise
 */
bool isMQTTConnected() {
  return mqttClient.connected();
}

/**
 * Publish telemetry data to MQTT
 * @param temperature Temperature in Celsius
 * @param humidity Humidity percentage
 * @param light Light intensity
 * @param tankLevel Tank water level status
 * @param pumpOn Pump status
 * @param lightsOn LED status
 * @return true if published successfully, false otherwise
 */
bool publishTelemetry(float temperature, float humidity, float light, 
                      bool tankLevel, bool pumpOn, bool lightsOn) {
  if (!mqttClient.connected()) {
    return false;
  }
  
  // Check if irrigation occurred since last transmission
  bool irrigated = checkAndResetIrrigationFlag();
  
  // Format timestamp
  char timestamp[30];
  if (ntpSynced) {
    // Use real NTP time (UTC)
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
      strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S+00", &timeinfo);
    } else {
      // Fallback to uptime if getLocalTime fails
      sprintf(timestamp, "UPTIME-%lu", millis() / 1000);
      ntpSynced = false; // Mark as not synced
    }
  } else {
    // Fallback to uptime-based timestamp
    unsigned long totalSeconds = millis() / 1000;
    unsigned long hours = (totalSeconds / 3600) % 24;
    unsigned long minutes = (totalSeconds / 60) % 60;
    unsigned long seconds = totalSeconds % 60;
    sprintf(timestamp, "UPTIME %02lu:%02lu:%02lu", hours, minutes, seconds);
  }
  
  // Build JSON payload
  JsonDocument doc;
  
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = timestamp;
  
  // Only include valid sensor readings
  if (temperature != -999.0) {
    doc["temperature"] = temperature;
  }
  if (humidity != -999.0) {
    doc["humidity"] = humidity;
  }
  if (light >= 0) {
    doc["light"] = light;
  }
  
  doc["tank_level"] = tankLevel;
  doc["irrigated_since_last_transmission"] = irrigated;
  doc["lights_are_on"] = lightsOn;
  doc["pump_on"] = pumpOn;
  
  // Serialize to string
  char jsonBuffer[512];
  size_t len = serializeJson(doc, jsonBuffer);
  
  // Publish
  bool success = mqttClient.publish(telemetryTopic, jsonBuffer, len);
  
  if (success) {
    Serial.println("📤 Telemetry published:");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("❌ Failed to publish telemetry");
  }
  
  return success;
}

/**
 * Process MQTT client (must be called regularly in loop)
 */
void processMQTT() {
  if (!mqttClient.connected()) {
    // Reconnection handled by reconnect.cpp
    return;
  }
  
  mqttClient.loop();
}
