/**
 * @file pump.cpp
 * @brief Water pump control module
 */

#include <Arduino.h>
#include "actuators.h"

// Relay pin configuration
const int PUMP_RELAY_PIN = 21; // GPIO25

/**
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
