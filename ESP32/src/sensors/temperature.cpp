/**
 * @file temperature.cpp
 * @brief Temperature sensor reading module (DHT11)
 */

#include <Arduino.h>
#include <DHT.h>
#include "sensors.h"

// Pin configuration
const int TEMP_SENSOR_PIN = 5; // GPIO5
#define DHTTYPE DHT11

// DHT sensor instance (shared with humidity)
DHT dht(TEMP_SENSOR_PIN, DHTTYPE);

/**
 * Initialize temperature sensor
 */
void initTemperatureSensor() {
  dht.begin();
  Serial.println("✅ Temperature sensor (DHT11) initialized");
}

/**
 * Read current temperature
 * @return Temperature in Celsius (returns NaN on error)
 */
float readTemperature() {
  float temp = dht.readTemperature();
  
  if (isnan(temp)) {
    Serial.println("❌ Failed to read temperature from DHT11!");
    return -999.0; // Error value
  }
  
  return temp;
}
