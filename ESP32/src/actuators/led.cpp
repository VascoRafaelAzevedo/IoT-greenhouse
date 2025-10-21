/**
 * @file led.cpp
 * @brief LED strips control module
 */

#include <Arduino.h>
#include "actuators.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  bool mockLEDState = false;
  
  /**
   * Initialize LED strips relay (TEST MODE)
   */
  void initLED() {
    mockLEDState = false;
    Serial.println("✅ [TEST] LED strips initialized (MOCK)");
  }

  /**
   * Turn LED strips ON (TEST MODE)
   */
  void turnLEDOn() {
    mockLEDState = true;
    Serial.println("💡 [TEST] LED ON (MOCK)");
  }

  /**
   * Turn LED strips OFF (TEST MODE)
   */
  void turnLEDOff() {
    mockLEDState = false;
    Serial.println("💡 [TEST] LED OFF (MOCK)");
  }

  /**
   * Get LED status (TEST MODE)
   * @return true if LEDs are ON, false if OFF
   */
  bool isLEDOn() {
    return mockLEDState;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware
  // ============================================
  
  // Relay pin configuration
  const int LED_RELAY_PIN = 25; // GPIO25

  /**
   * Initialize LED strips relay
   */
  void initLED() {
    pinMode(LED_RELAY_PIN, OUTPUT);
    digitalWrite(LED_RELAY_PIN, LOW); // Start with LEDs OFF
    Serial.println("LED strips initialized");
  }

  /**
   * Turn LED strips ON
   */
  void turnLEDOn() {
    digitalWrite(LED_RELAY_PIN, HIGH);
    Serial.println("💡 LED ON");
  }

  /**
   * Turn LED strips OFF
   */
  void turnLEDOff() {
    digitalWrite(LED_RELAY_PIN, LOW);
    Serial.println("💡 LED OFF");
  }

  /**
   * Get LED status
   * @return true if LEDs are ON, false if OFF
   */
  bool isLEDOn() {
    return digitalRead(LED_RELAY_PIN) == HIGH;
  }

#endif
