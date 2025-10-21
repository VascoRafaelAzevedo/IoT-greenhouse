/**
 * @file sensors.h
 * @brief Sensor module function declarations
 */

#ifndef SENSORS_H
#define SENSORS_H

// Temperature sensor functions
void initTemperatureSensor();
float readTemperature();

// Humidity sensor functions
void initHumiditySensor();
float readHumidity();

// Light sensor functions
void initLightSensor();
float readLight();

// Tank level sensor functions
void initTankLevelSensor();
bool readTankLevel();

#endif // SENSORS_H
