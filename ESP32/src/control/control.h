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

// Get pump cycle timing information
unsigned long getPumpCycleInfo(bool &isInOnCycle);

#endif // CONTROL_H
