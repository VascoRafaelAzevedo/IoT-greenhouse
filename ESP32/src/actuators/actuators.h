/**
 * @file actuators.h
 * @brief Actuator module function declarations
 */

#ifndef ACTUATORS_H
#define ACTUATORS_H

// Pump functions
void initPump();
void turnPumpOn();
void turnPumpOff();
bool isPumpOn();

// Heating functions
void initHeating();
void turnHeatingOn();
void turnHeatingOff();
bool isHeatingOn();

// LED functions
void initLED();
void turnLEDOn();
void turnLEDOff();
bool isLEDOn();

// Fan functions
void initFan();
void turnFanOn();
void turnFanOff();
bool isFanOn();

#endif // ACTUATORS_H
