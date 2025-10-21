/**
 * @file light.cpp
 * @brief Light sensor reading module (VCNL4010)
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_VCNL4010.h>
#include "sensors.h"

// I2C configuration for VCNL4010
const int LIGHT_SENSOR_SDA = 22; // GPIO22
const int LIGHT_SENSOR_SCL = 23; // GPIO23

// VCNL4010 sensor instance
Adafruit_VCNL4010 vcnl;
bool lightSensorAvailable = false;

/**
 * Initialize light sensor
 */
void initLightSensor() {
  Wire.begin(LIGHT_SENSOR_SDA, LIGHT_SENSOR_SCL);
  
  if (!vcnl.begin()) {
    Serial.println("⚠️  VCNL4010 sensor not found (sensor may not be connected)");
    lightSensorAvailable = false;
    return;
  }
  
  lightSensorAvailable = true;
  Serial.println("✅ Light sensor (VCNL4010) initialized");
}

/**
 * Read current light level
 * @return Light intensity (ambient light in arbitrary units, -1 if not available)
 */
float readLight() {
  if (!lightSensorAvailable) {
    return -1.0; // Sensor not available
  }
  
  uint16_t ambient = vcnl.readAmbient();
  return (float)ambient;
}
