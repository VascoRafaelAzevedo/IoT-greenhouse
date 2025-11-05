/**
 * @file control.h
 * @brief Control logic module function declarations
 */

#ifndef CONTROL_H
#define CONTROL_H

// Initialize control logic
void initControlLogic();

// Execute all control logic
void executeControlLogic(float temperature, float humidity, float light, bool tankLevel);

// Get irrigation timing information
unsigned long getIrrigationInfo(bool &isCurrentlyIrrigating);

// Update setpoints from MQTT
void updateSetpoints(float temp_min, float temp_max, float hum_air_max, 
                     float light_intensity, unsigned long irrigation_interval_minutes, 
                     unsigned long irrigation_duration_seconds);

// Get current setpoints (for webserver display)
void getCurrentSetpoints(float &temp_min, float &temp_max, float &hum_air_max,
                        float &light_intensity, unsigned long &irrigation_interval_minutes,
                        unsigned long &irrigation_duration_seconds);

// Check and reset irrigation flag for telemetry
bool checkAndResetIrrigationFlag();

#endif // CONTROL_H
