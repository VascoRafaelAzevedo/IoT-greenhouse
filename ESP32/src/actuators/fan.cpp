/**
 * @file fan.cpp
 * @brief Ventilation fan control module
 */

#include <Arduino.h>
#include "actuators.h"

// Relay pin configuration
const int FAN_RELAY_PIN = 19; // GPIO14

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
