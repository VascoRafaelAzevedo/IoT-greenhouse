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
#include "../constants.h"
#include "../control/control.h"
#include "../buffer/buffer.h"
#include "mqtt.h"

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
bool ntpSynced = false;

// Sequence counter for message ordering (must be positive, incrementing)
static unsigned long sequenceCounter = 0;

// Topic buffers
char telemetryTopic[MQTT_TOPIC_BUFFER_SIZE];
char setpointTopic[MQTT_TOPIC_BUFFER_SIZE];

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
 * First creates AP, then tries to connect to WiFi for MQTT
 */
void initWiFi() {
  // 1. Start Access Point for local web interface
  Serial.println("\n📡 Starting Access Point...");
  Serial.println("AP SSID: GardenAway-ESP32");
  Serial.println("AP Password: greenhouse123");
  
  WiFi.mode(WIFI_AP_STA); // Both AP and Station mode
  WiFi.softAP("GardenAway-ESP32", "greenhouse123");
  
  IPAddress apIP = WiFi.softAPIP();
  Serial.print("✅ AP started! IP address: ");
  Serial.println(apIP);
  Serial.println("🌐 Web interface available at: http://192.168.4.1");
  
  // 2. Try to connect to WiFi for MQTT (optional)
  Serial.println("\n🌐 Attempting WiFi connection for MQTT...");
  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < WIFI_MAX_CONNECTION_ATTEMPTS) {
    delay(WIFI_CONNECTION_RETRY_DELAY_MS);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi connected!");
    Serial.print("Station IP address: ");
    Serial.println(WiFi.localIP());
    
    // Initialize NTP time synchronization
    Serial.println("\n⏰ Synchronizing time with NTP...");
    configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER);
    
    // Wait for time to be set
    struct tm timeinfo;
    int ntpAttempts = 0;
    while (!getLocalTime(&timeinfo) && ntpAttempts < NTP_MAX_SYNC_ATTEMPTS) {
      Serial.print(".");
      delay(NTP_SYNC_RETRY_DELAY_MS);
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
    Serial.println("\n⚠️  WiFi connection failed!");
    Serial.println("✅ System will continue with AP mode only (no MQTT)");
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
  mqttClient.setBufferSize(MQTT_MESSAGE_BUFFER_SIZE); // Increase buffer for larger JSON messages
  
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
 * If MQTT is offline, stores data in circular buffers
 * @param temperature Temperature in Celsius
 * @param humidity Humidity percentage
 * @param light Light intensity
 * @param tankLevel Tank water level status
 * @param pumpOn Pump status
 * @param lightsOn LED status
 * @return true if published successfully or buffered, false on error
 */
bool publishTelemetry(float temperature, float humidity, float light, 
                      bool tankLevel, bool pumpOn, bool lightsOn) {
  // Check if irrigation occurred since last transmission
  bool irrigated = checkAndResetIrrigationFlag();
  
  // Get Unix timestamp (seconds since epoch)
  time_t unixTimestamp = 0;
  if (ntpSynced) {
    struct tm timeinfo;
    if (getLocalTime(&timeinfo)) {
      unixTimestamp = mktime(&timeinfo);
    } else {
      // Fallback: use approximate time based on uptime
      unixTimestamp = 1733100000 + (millis() / 1000); // Base: ~Dec 2025
      ntpSynced = false;
    }
  } else {
    // Fallback: use approximate time based on uptime
    unixTimestamp = 1733100000 + (millis() / 1000); // Base: ~Dec 2025
  }
  
  // Increment sequence counter (must be positive)
  sequenceCounter++;
  
  // If MQTT is offline, buffer the data
  if (!mqttClient.connected()) {
    Serial.println("⚠️  MQTT offline - buffering telemetry");
    
    // Create telemetry reading struct
    TelemetryReading reading;
    // Store Unix timestamp as string for buffer compatibility
    snprintf(reading.timestamp, sizeof(reading.timestamp), "%ld", (long)unixTimestamp);
    reading.temperature = temperature;
    reading.humidity = humidity;
    reading.light = light;
    reading.tankLevel = tankLevel;
    reading.pumpOn = pumpOn;
    reading.lightsOn = lightsOn;
    reading.irrigated = irrigated;
    reading.valid = true;
    
    // Check Buffer #1 status
    if (is1MinBufferFull()) {
      Serial.println("⚠️  Buffer #1 full - aggregating to Buffer #2");
      
      // Get all readings from Buffer #1
      TelemetryReading buffer1Data[10];
      int count = 0;
      while (get1MinBufferCount() > 0 && count < 10) {
        if (getOldestFrom1MinBuffer(buffer1Data[count])) {
          removeOldestFrom1MinBuffer();
          count++;
        }
      }
      
      // Aggregate and store in Buffer #2
      if (count > 0) {
        // Check if Buffer #2 is also full
        if (is10MinBufferFull()) {
          Serial.println("⚠️  Buffer #2 also full - dropping oldest aggregate");
          removeOldestFrom10MinBuffer();
        }
        aggregateAndStore(buffer1Data, count);
      }
    }
    
    // Add current reading to Buffer #1
    addToBuffer1Min(reading);
    Serial.printf("📦 Buffered (B1: %d, B2: %d)\n", get1MinBufferCount(), get10MinBufferCount());
    
    return true; // Successfully buffered
  }
  
  // MQTT is connected - publish directly
  // Build JSON payload
  JsonDocument doc;
  
  doc["device_id"] = DEVICE_ID;
  doc["timestamp"] = (long long)unixTimestamp;  // Unix timestamp as i64
  doc["sequence"] = (long long)sequenceCounter;  // Sequence number as i64
  
  // Only include valid sensor readings
  if (temperature != SENSOR_ERROR_TEMP) {
    doc["temperature"] = temperature;
  }
  if (humidity != SENSOR_ERROR_HUM) {
    doc["humidity"] = humidity;
  }
  if (light >= 0) {
    doc["light"] = (double)light;  // Ensure it's a float/double
  }
  
  doc["tank_level"] = tankLevel;
  doc["irrigated_since_last_transmission"] = irrigated;
  doc["lights_are_on"] = lightsOn;
  doc["pump_on"] = pumpOn;
  
  // Serialize to string
  char jsonBuffer[MQTT_JSON_BUFFER_SIZE];
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
 * Flush buffered telemetry data to MQTT
 * Called automatically after reconnection
 * @return Number of readings successfully sent
 */
int flushBufferedTelemetry() {
  if (!mqttClient.connected()) {
    Serial.println("⚠️  Cannot flush - MQTT offline");
    return 0;
  }
  
  int sentCount = 0;
  int buffer1Count = get1MinBufferCount();
  int buffer2Count = get10MinBufferCount();
  
  Serial.println("\n📤 Starting buffer flush (chronological order)...");
  Serial.printf("   Buffer #2: %d aggregated readings (OLDEST)\n", buffer2Count);
  Serial.printf("   Buffer #1: %d high-res readings (NEWER)\n", buffer1Count);
  Serial.println();
  
  // FIRST: Flush Buffer #2 (oldest aggregated data)
  if (buffer2Count > 0) {
    Serial.println("📤 Flushing Buffer #2 (aggregated - oldest data)...");
    while (get10MinBufferCount() > 0) {
      TelemetryReading reading;
      if (getOldestFrom10MinBuffer(reading)) {
        // Build JSON for aggregated reading
        JsonDocument doc;
        doc["device_id"] = DEVICE_ID;
        
        // Parse stored Unix timestamp string back to i64
        long storedTimestamp = atol(reading.timestamp);
        doc["timestamp"] = (long long)storedTimestamp;
        
        // Increment sequence for each buffered message
        sequenceCounter++;
        doc["sequence"] = (long long)sequenceCounter;
        
        if (reading.temperature != -999.0) {
          doc["temperature"] = reading.temperature;
        }
        if (reading.humidity != -999.0) {
          doc["humidity"] = reading.humidity;
        }
        if (reading.light >= 0) {
          doc["light"] = (double)reading.light;
        }
        
        doc["tank_level"] = reading.tankLevel;
        doc["irrigated_since_last_transmission"] = reading.irrigated;
        doc["lights_are_on"] = reading.lightsOn;
        doc["pump_on"] = reading.pumpOn;
        
        // Serialize and publish
        char jsonBuffer[MQTT_JSON_BUFFER_SIZE];
        size_t len = serializeJson(doc, jsonBuffer);
        
        if (mqttClient.publish(telemetryTopic, jsonBuffer, len)) {
          Serial.printf("  ✓ Sent aggregated reading (B2: %s)\n", reading.timestamp);
          removeOldestFrom10MinBuffer();
          sentCount++;
          delay(MQTT_PUBLISH_DELAY_MS);
        } else {
          Serial.println("  ✗ Failed to send - stopping flush");
          return sentCount;
        }
      }
    }
  }
  
  // SECOND: Flush Buffer #1 (newer high-resolution data)
  if (buffer1Count > 0) {
    Serial.println("\n📤 Flushing Buffer #1 (high-resolution - newer data)...");
  }
  while (get1MinBufferCount() > 0) {
    TelemetryReading reading;
    if (getOldestFrom1MinBuffer(reading)) {
      // Build JSON for buffered reading
      JsonDocument doc;
      doc["device_id"] = DEVICE_ID;
      
      // Parse stored Unix timestamp string back to i64
      long storedTimestamp = atol(reading.timestamp);
      doc["timestamp"] = (long long)storedTimestamp;
      
      // Increment sequence for each buffered message
      sequenceCounter++;
      doc["sequence"] = (long long)sequenceCounter;
      
      if (reading.temperature != SENSOR_ERROR_TEMP) {
        doc["temperature"] = reading.temperature;
      }
      if (reading.humidity != SENSOR_ERROR_HUM) {
        doc["humidity"] = reading.humidity;
      }
      if (reading.light >= 0) {
        doc["light"] = (double)reading.light;
      }
      
      doc["tank_level"] = reading.tankLevel;
      doc["irrigated_since_last_transmission"] = reading.irrigated;
      doc["lights_are_on"] = reading.lightsOn;
      doc["pump_on"] = reading.pumpOn;
      
      // Serialize and publish
      char jsonBuffer[MQTT_JSON_BUFFER_SIZE];
      size_t len = serializeJson(doc, jsonBuffer);
      
      if (mqttClient.publish(telemetryTopic, jsonBuffer, len)) {
        Serial.printf("  ✓ Sent buffered reading (B1: %s)\n", reading.timestamp);
        removeOldestFrom1MinBuffer();
        sentCount++;
        delay(MQTT_PUBLISH_DELAY_MS); // Small delay to avoid overwhelming broker
      } else {
        Serial.println("  ✗ Failed to send - stopping flush");
        return sentCount;
      }
    }
  }
  
  // Flush complete
  if (sentCount > 0) {
    Serial.println("\n╔════════════════════════════════════╗");
    Serial.printf("║  ✅ FLUSH COMPLETE: %d readings   ║\n", sentCount);
    Serial.println("╚════════════════════════════════════╝");
  } else {
    Serial.println("⚠️  No data was flushed");
  }
  
  return sentCount;
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
