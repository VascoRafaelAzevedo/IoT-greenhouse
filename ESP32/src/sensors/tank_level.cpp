/**
 * @file tank_level.cpp
 * @brief Tank water level sensor module (VS804-021 Float Switch)
 */

#include <Arduino.h>
#include "sensors.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  /**
   * Initialize tank level sensor (TEST MODE)
   */
  void initTankLevelSensor() {
    Serial.println("✅ [TEST] Tank level sensor (VS804-021) initialized (MOCK)");
  }

  /**
   * Read tank level status (TEST MODE)
   * @return true if tank has water (mock - always true for testing)
   */
  bool readTankLevel() {
    // Mock: Always return true (tank has water) for testing
    bool mockLevel = true;
    Serial.print("🚰 [TEST] Tank: ");
    Serial.println(mockLevel ? "✓ WATER OK (MOCK)" : "✗ EMPTY (MOCK)");
    return mockLevel;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  // Pin configuration
  const int TANK_LEVEL_PIN = 13; // GPIO13

  /**
   * Initialize tank level sensor
   */
  void initTankLevelSensor() {
    pinMode(TANK_LEVEL_PIN, INPUT_PULLUP);  // Use internal pull-up resistor
    Serial.println("✅ Tank level sensor (VS804-021) initialized");
  }

  /**
   * Read tank level status
   * @return true if tank has water (liquid detected), false if empty
   */
  bool readTankLevel() {
    int sensorState = digitalRead(TANK_LEVEL_PIN);
    
    // VS804-021: LOW = no liquid, HIGH = liquid detected
    if (sensorState == LOW) {
      return false; // No liquid
    } else {
      return true; // Liquid detected
    }
  }

#endif
