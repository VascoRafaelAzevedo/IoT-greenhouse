/**
 * @file led.cpp
 * @brief LED strips control module
 */

#include <Arduino.h>
#include "actuators.h"

// Relay pin configuration
const int LED_RELAY_PIN = 25; // GPIO27

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
