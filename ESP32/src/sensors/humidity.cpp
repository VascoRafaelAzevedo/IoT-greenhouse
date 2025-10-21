/**
 * @file humidity.cpp
 * @brief Humidity sensor reading module (DHT11)
 */

#include <Arduino.h>
#include <DHT.h>
#include "sensors.h"

// Pin configuration (shared with temperature)
const int HUMIDITY_SENSOR_PIN = 5; // GPIO5
#define DHTTYPE DHT11

// DHT sensor instance (shared with temperature)
extern DHT dht;

/**
 * Initialize humidity sensor
 */
void initHumiditySensor() {
  // DHT already initialized in temperature.cpp
  Serial.println("✅ Humidity sensor (DHT11) ready");
}

/**
 * Read current humidity
 * @return Humidity percentage (0-100%, returns NaN on error)
 */
float readHumidity() {
  float humidity = dht.readHumidity();
  
  if (isnan(humidity)) {
    Serial.println("❌ Failed to read humidity from DHT11!");
    return -999.0; // Error value
  }
  
  return humidity;
}
