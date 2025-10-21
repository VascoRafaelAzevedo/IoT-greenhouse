/**
 * @file main.cpp
 * @brief ESP32 GardenAway - Automatic Control System
 */

#include <Arduino.h>
#include <time.h>
#include "config.h"

// Include module headers
#include "sensors/sensors.h"
#include "actuators/actuators.h"
#include "control/control.h"
#include "mqtt/mqtt.h"

#ifndef TEST_MODE
  // Only include Wire for production (I2C hardware)
  #include <Wire.h>
#endif

// Timing intervals
unsigned long lastCycleTime = 0;
const unsigned long CYCLE_INTERVAL = 5000; // Master cycle interval - change this to 60000 for production (1 minute)

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.print(MODE_EMOJI);
  Serial.print(" GardenAway ESP32 - ");
  Serial.println(MODE_NAME);
  Serial.println("========================================\n");
  
  #ifndef TEST_MODE
    // Initialize I2C (only in production mode)
    Wire.begin(22, 23);
  #else
    Serial.println("⚠️  TEST MODE: Hardware I2C disabled\n");
  #endif
  
  // Initialize all sensors
  Serial.println("Initializing sensors...");
  initTemperatureSensor();
  initHumiditySensor();
  initLightSensor();
  initTankLevelSensor();
  
  // Initialize all actuators (relays)
  Serial.println("\nInitializing actuators...");
  initPump();
  initHeating();
  initLED();
  initFan();
  
  // Initialize control logic
  initControlLogic();
  
  // Initialize WiFi and MQTT
  initWiFi();
  initMQTT();
  
  // Attempt initial MQTT connection
  if (connectMQTT()) {
    Serial.println("\n✅ System ready with MQTT!");
  } else {
    Serial.println("\n✅ System ready (MQTT offline)!");
  }
  
  #ifndef TEST_MODE
    delay(2000); // DHT stabilization (only in production)
  #endif
}

// Helper function to format timestamp
String getFormattedTimestamp() {
  char timestamp[30];
  struct tm timeinfo;
  
  // Try to get real time from NTP (UTC)
  if (getLocalTime(&timeinfo)) {
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S+00", &timeinfo);
  } else {
    // Fallback to uptime-based timestamp
    unsigned long totalSeconds = millis() / 1000;
    unsigned long hours = (totalSeconds / 3600) % 24;
    unsigned long minutes = (totalSeconds / 60) % 60;
    unsigned long seconds = totalSeconds % 60;
    sprintf(timestamp, "UPTIME %02lu:%02lu:%02lu", hours, minutes, seconds);
  }
  
  return String(timestamp);
}

void loop() {
  unsigned long currentTime = millis();
  
  // Process MQTT (handles incoming messages) - always process
  processMQTT();
  
  // Handle MQTT reconnection if disconnected - always check
  if (!isMQTTConnected()) {
    handleMQTTReconnection();
  }
  
  // Execute one complete cycle every CYCLE_INTERVAL
  if (currentTime - lastCycleTime >= CYCLE_INTERVAL) {
    lastCycleTime = currentTime;
    
    Serial.println("\n╔════════════════════════════════════════════════════════╗");
    Serial.print("║ CYCLE START @ ");
    Serial.print(getFormattedTimestamp());
    Serial.println("              ║");
    Serial.println("╚════════════════════════════════════════════════════════╝");
    
    // 1. Read all sensors
    Serial.println("\n[1/4] SENSOR READINGS:");
    float temperature = readTemperature();
    float humidity = readHumidity();
    float light = readLight();
    bool tankLevel = readTankLevel();
    
    Serial.print("  Temperature ... ");
    if (temperature != -999.0) {
      Serial.print(temperature, 1);
      Serial.println(" °C");
    } else {
      Serial.println("ERROR");
    }
    
    Serial.print("  Humidity ...... ");
    if (humidity != -999.0) {
      Serial.print(humidity, 1);
      Serial.println(" %");
    } else {
      Serial.println("ERROR");
    }
    
    Serial.print("  Light ......... ");
    if (light >= 0) {
      Serial.print(light, 0);
      Serial.println(" lux");
    } else {
      Serial.println("N/A");
    }
    
    Serial.print("  Water Tank .... ");
    Serial.println(tankLevel ? "OK" : "EMPTY");
    
    // 2. Execute automatic control logic
    Serial.println("\n[2/4] CONTROL LOGIC:");
    executeControlLogic(temperature, humidity, light, tankLevel);
    
    // Get irrigation info for display
    bool isCurrentlyIrrigating;
    unsigned long timeRemaining = getIrrigationInfo(isCurrentlyIrrigating);
    
    Serial.print("  Fan ........... ");
    Serial.println(isFanOn() ? "ON" : "OFF");
    
    Serial.print("  Heating ....... ");
    Serial.println(isHeatingOn() ? "ON" : "OFF");
    
    Serial.print("  LED ........... ");
    Serial.println(isLEDOn() ? "ON" : "OFF");
    
    Serial.print("  Pump .......... ");
    if (isPumpOn()) {
      Serial.print("ON (");
      Serial.print(timeRemaining / 1000);
      Serial.println("s left)");
    } else {
      Serial.print("OFF (next: ");
      unsigned long minutes = timeRemaining / 60000;
      unsigned long seconds = (timeRemaining % 60000) / 1000;
      if (minutes > 0) {
        Serial.print(minutes);
        Serial.print("m ");
      }
      Serial.print(seconds);
      Serial.println("s)");
    }
    
    // 3. Publish telemetry
    Serial.println("\n[3/4] MQTT TELEMETRY:");
    bool pumpStatus = isPumpOn();
    bool ledStatus = isLEDOn();
    
    Serial.print("  Connection .... ");
    Serial.println(isMQTTConnected() ? "CONNECTED" : "OFFLINE");
    
    if (isMQTTConnected()) {
      Serial.print("  Publishing .... ");
      if (publishTelemetry(temperature, humidity, light, tankLevel, pumpStatus, ledStatus)) {
        Serial.println("SUCCESS");
      } else {
        Serial.println("FAILED");
      }
    } else {
      Serial.println("  Publishing .... SKIPPED (offline)");
    }
    
    // 4. Cycle summary
    Serial.println("\n[4/4] CYCLE SUMMARY:");
    Serial.print("  Next cycle .... ");
    Serial.print(CYCLE_INTERVAL / 1000);
    Serial.println("s");
    Serial.print("  Uptime ........ ");
    unsigned long uptimeSeconds = currentTime / 1000;
    unsigned long uptimeMinutes = uptimeSeconds / 60;
    unsigned long uptimeHours = uptimeMinutes / 60;
    if (uptimeHours > 0) {
      Serial.print(uptimeHours);
      Serial.print("h ");
    }
    if (uptimeMinutes % 60 > 0) {
      Serial.print(uptimeMinutes % 60);
      Serial.print("m ");
    }
    Serial.print(uptimeSeconds % 60);
    Serial.println("s");
    
    Serial.println("\n────────────────────────────────────────────────────────");
  }
  
  // Small delay to prevent CPU hogging
  delay(100);
}
