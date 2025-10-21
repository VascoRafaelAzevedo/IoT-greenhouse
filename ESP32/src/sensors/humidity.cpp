/**
 * @file humidity.cpp
 * @brief Humidity sensor reading module (DHT11)
 */

#include <Arduino.h>
#include "sensors.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  /**
   * Initialize humidity sensor (TEST MODE)
   */
  void initHumiditySensor() {
    Serial.println("✅ [TEST] Humidity sensor (DHT11) ready (MOCK)");
  }

  /**
   * Read current humidity (TEST MODE)
   * @return Humidity percentage (mock value)
   */
  float readHumidity() {
    // Return mock humidity with slight variation
    float mockHumidity = 65.0 + (random(-100, 100) / 10.0); // 55.0 to 75.0%
    Serial.print("💧 [TEST] Humidity: ");
    Serial.print(mockHumidity);
    Serial.println(" % (MOCK)");
    return mockHumidity;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  #include <DHT.h>
  
  // Pin configuration (shared with temperature)
  const int HUMIDITY_SENSOR_PIN = 5; // GPIO5
  #define DHTTYPE DHT11

  // DHT sensor instance (shared with temperature)
  extern DHT dht;

  /**
   * Initialize humidity sensor
   */
  void initHumiditySensor() {
    // DHT already initialized in temperature.cpp
    Serial.println("✅ Humidity sensor (DHT11) ready");
  }

  /**
   * Read current humidity
   * @return Humidity percentage (0-100%, returns -999.0 on error)
   */
  float readHumidity() {
    float humidity = dht.readHumidity();
    
    if (isnan(humidity)) {
      Serial.println("❌ Failed to read humidity from DHT11!");
      return -999.0; // Error value
    }
    
    return humidity;
  }

#endif
