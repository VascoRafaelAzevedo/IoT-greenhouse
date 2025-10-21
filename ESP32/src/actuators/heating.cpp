/**
 * @file heating.cpp
 * @brief Heating element control module
 * 
 * Note: For prototyping, this will control a second fan instead of actual heating
 */

#include <Arduino.h>
#include "actuators.h"

// Relay pin configuration
const int HEATING_RELAY_PIN = 18; // GPIO26

/**
 * Initialize heating element relay
 */
void initHeating() {
  pinMode(HEATING_RELAY_PIN, OUTPUT);
  digitalWrite(HEATING_RELAY_PIN, LOW); // Start with heating OFF
  Serial.println("Heating element initialized");
}

/**
 * Turn heating element ON
 */
void turnHeatingOn() {
  digitalWrite(HEATING_RELAY_PIN, HIGH);
  Serial.println("🔥 Heating ON");
}

/**
 * Turn heating element OFF
 */
void turnHeatingOff() {
  digitalWrite(HEATING_RELAY_PIN, LOW);
  Serial.println("🔥 Heating OFF");
}

/**
 * Get heating status
 * @return true if heating is ON, false if OFF
 */
bool isHeatingOn() {
  return digitalRead(HEATING_RELAY_PIN) == HIGH;
}
