/**
 * @file light.cpp
 * @brief Light sensor reading module (VCNL4010)
 */

#include <Arduino.h>
#include "sensors.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  /**
   * Initialize light sensor (TEST MODE)
   */
  void initLightSensor() {
    Serial.println("✅ [TEST] Light sensor (VCNL4010) initialized (MOCK)");
  }

  /**
   * Read current light level (TEST MODE)
   * @return Light intensity (mock value)
   */
  float readLight() {
    // Return mock light intensity with variation
    float mockLight = 400.0 + (random(-200, 300)); // 200 to 700 units
    Serial.print("💡 [TEST] Light: ");
    Serial.print(mockLight);
    Serial.println(" units (MOCK)");
    return mockLight;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  #include <Wire.h>
  #include <Adafruit_VCNL4010.h>

  // I2C configuration for VCNL4010
  const int LIGHT_SENSOR_SDA = 22; // GPIO23
  const int LIGHT_SENSOR_SCL = 23; // GPIO22

  // VCNL4010 sensor instance
  Adafruit_VCNL4010 vcnl;
  bool lightSensorAvailable = false;

  /**
   * Initialize light sensor
   */
  void initLightSensor() {
    // Don't reinitialize Wire if already initialized in main.cpp
    // Wire.begin(LIGHT_SENSOR_SDA, LIGHT_SENSOR_SCL);
    
    if (!vcnl.begin()) {
      Serial.println("⚠️  VCNL4010 sensor not found (sensor may not be connected)");
      lightSensorAvailable = false;
      return;
    }
    
    lightSensorAvailable = true;
    Serial.println("✅ Light sensor (VCNL4010) initialized");
  }

  /**
   * Read current light level
   * @return Light intensity (ambient light in arbitrary units, -1 if not available)
   */
  float readLight() {
    if (!lightSensorAvailable) {
      return -1.0; // Sensor not available
    }
    
    uint16_t ambient = vcnl.readAmbient();
    return (float)ambient;
  }

#endif
