/**
 * @file fan.cpp
 * @brief Ventilation fan control module
 */

#include <Arduino.h>
#include "actuators.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  bool mockFanState = false;
  
  /**
   * Initialize ventilation fan relay (TEST MODE)
   */
  void initFan() {
    mockFanState = false;
    Serial.println("✅ [TEST] Ventilation fan initialized (MOCK)");
  }

  /**
   * Turn ventilation fan ON (TEST MODE)
   */
  void turnFanOn() {
    mockFanState = true;
    Serial.println("🌬️  [TEST] Fan ON (MOCK)");
  }

  /**
   * Turn ventilation fan OFF (TEST MODE)
   */
  void turnFanOff() {
    mockFanState = false;
    Serial.println("🌬️  [TEST] Fan OFF (MOCK)");
  }

  /**
   * Get fan status (TEST MODE)
   * @return true if fan is ON, false if OFF
   */
  bool isFanOn() {
    return mockFanState;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  // Relay pin configuration
  const int FAN_RELAY_PIN = 19; // GPIO19

  /**
   * Initialize ventilation fan relay
   */
  void initFan() {
    pinMode(FAN_RELAY_PIN, OUTPUT);
    digitalWrite(FAN_RELAY_PIN, LOW); // Start with fan OFF
    Serial.println("Ventilation fan initialized");
  }

  /**
   * Turn ventilation fan ON
   */
  void turnFanOn() {
    digitalWrite(FAN_RELAY_PIN, HIGH);
    Serial.println("🌬️  Fan ON");
  }

  /**
   * Turn ventilation fan OFF
   */
  void turnFanOff() {
    digitalWrite(FAN_RELAY_PIN, LOW);
    Serial.println("🌬️  Fan OFF");
  }

  /**
   * Get fan status
   * @return true if fan is ON, false if OFF
   */
  bool isFanOn() {
    return digitalRead(FAN_RELAY_PIN) == HIGH;
  }

#endif
