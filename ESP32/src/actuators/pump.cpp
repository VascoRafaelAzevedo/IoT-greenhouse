/**
 * @file pump.cpp
 * @brief Water pump control module
 */

#include <Arduino.h>
#include "actuators.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  bool mockPumpState = false;
  
  /**
   * Initialize water pump relay (TEST MODE)
   */
  void initPump() {
    mockPumpState = false;
    Serial.println("✅ [TEST] Water pump initialized (MOCK)");
  }

  /**
   * Turn water pump ON (TEST MODE)
   */
  void turnPumpOn() {
    mockPumpState = true;
    Serial.println("💧 [TEST] Pump ON (MOCK)");
  }

  /**
   * Turn water pump OFF (TEST MODE)
   */
  void turnPumpOff() {
    mockPumpState = false;
    Serial.println("💧 [TEST] Pump OFF (MOCK)");
  }

  /**
   * Get pump status (TEST MODE)
   * @return true if pump is ON, false if OFF
   */
  bool isPumpOn() {
    return mockPumpState;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  // Relay pin configuration
  const int PUMP_RELAY_PIN = 21; // GPIO21

  /**>
   * Initialize water pump relay
   */
  void initPump() {
    pinMode(PUMP_RELAY_PIN, OUTPUT);
    digitalWrite(PUMP_RELAY_PIN, LOW); // Start with pump OFF
    Serial.println("Water pump initialized");
  }

  /**
   * Turn water pump ON
   */
  void turnPumpOn() {
    digitalWrite(PUMP_RELAY_PIN, HIGH);
    Serial.println("💧 Pump ON");
  }

  /**
   * Turn water pump OFF
   */
  void turnPumpOff() {
    digitalWrite(PUMP_RELAY_PIN, LOW);
    Serial.println("💧 Pump OFF");
  }

  /**
   * Get pump status
   * @return true if pump is ON, false if OFF
   */
  bool isPumpOn() {
    return digitalRead(PUMP_RELAY_PIN) == HIGH;
  }

#endif
