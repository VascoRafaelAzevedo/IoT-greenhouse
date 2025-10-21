/**
 * @file temperature.cpp
 * @brief Temperature sensor reading module (DHT11)
 */

#include <Arduino.h>
#include "sensors.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  /**
   * Initialize temperature sensor (TEST MODE)
   */
  void initTemperatureSensor() {
    Serial.println("✅ [TEST] Temperature sensor (DHT11) initialized (MOCK)");
  }

  /**
   * Read current temperature (TEST MODE)
   * @return Temperature in Celsius (mock value)
   */
  float readTemperature() {
    // Return mock temperature with slight variation
    float mockTemp = 22.0 + (random(-30, 30) / 10.0); // 19.0 to 25.0°C
    Serial.print("🌡️  [TEST] Temperature: ");
    Serial.print(mockTemp);
    Serial.println(" °C (MOCK)");
    return mockTemp;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  #include <DHT.h>
  
  // Pin configuration
  const int TEMP_SENSOR_PIN = 5; // GPIO5
  #define DHTTYPE DHT11

  // DHT sensor instance (shared with humidity)
  DHT dht(TEMP_SENSOR_PIN, DHTTYPE);

  /**
   * Initialize temperature sensor
   */
  void initTemperatureSensor() {
    dht.begin();
    Serial.println("✅ Temperature sensor (DHT11) initialized");
  }

  /**
   * Read current temperature
   * @return Temperature in Celsius (returns -999.0 on error)
   */
  float readTemperature() {
    float temp = dht.readTemperature();
    
    if (isnan(temp)) {
      Serial.println("❌ Failed to read temperature from DHT11!");
      return -999.0; // Error value
    }
    
    return temp;
  }

#endif
