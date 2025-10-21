/**
 * @file rules.cpp
 * @brief Autonomous control logic based on thresholds
 * 
 * Implements control rules for maintaining optimal greenhouse conditions
 */

#include <Arduino.h>
#include "../control/control.h"
#include "../actuators/actuators.h"

// Control thresholds
const float HUMIDITY_THRESHOLD = 70.0;  // Turn fan ON if humidity > 70%
const float TEMP_TARGET = 22.0;         // Turn heating ON if temp < 22°C

// Pump cycle timing (in milliseconds)
const unsigned long PUMP_ON_TIME = 10000;   // 10 seconds ON
const unsigned long PUMP_OFF_TIME = 5000;   // 5 seconds OFF
unsigned long lastPumpChange = 0;
bool pumpCycleState = false; // false = OFF cycle, true = ON cycle

/**
 * Initialize control logic
 */
void initControlLogic() {
  lastPumpChange = millis();
  pumpCycleState = false;
  
  Serial.println("\n📋 Control Rules:");
  Serial.println("   🌬️  Fan:     ON if Humidity > 70%");
  Serial.println("   🔥 Heating:  ON if Temperature < 22°C");
  Serial.println("   💧 Pump:     10s ON / 5s OFF cycle");
  Serial.println("   💡 LED:      Manual control (OFF)\n");
}

/**
 * Execute fan control logic (Humidity-based)
 */
void controlFan(float humidity) {
  if (humidity != -999.0) {
    if (humidity > HUMIDITY_THRESHOLD) {
      if (!isFanOn()) {
        turnFanOn();
      }
    } else {
      if (isFanOn()) {
        turnFanOff();
      }
    }
  }
}

/**
 * Execute heating control logic (Temperature-based)
 */
void controlHeating(float temperature) {
  if (temperature != -999.0) {
    if (temperature < TEMP_TARGET) {
      if (!isHeatingOn()) {
        turnHeatingOn();
      }
    } else {
      if (isHeatingOn()) {
        turnHeatingOff();
      }
    }
  }
}

/**
 * Execute pump control logic (Timed cycle)
 */
void controlPump(bool tankLevel) {
  unsigned long currentTime = millis();
  unsigned long timeSinceLastChange = currentTime - lastPumpChange;
  
  if (pumpCycleState) {
    // Currently in ON cycle
    if (timeSinceLastChange >= PUMP_ON_TIME) {
      turnPumpOff();
      pumpCycleState = false;
      lastPumpChange = currentTime;
    }
  } else {
    // Currently in OFF cycle
    if (timeSinceLastChange >= PUMP_OFF_TIME) {
      if (tankLevel) { // Only turn ON if tank has water
        turnPumpOn();
        pumpCycleState = true;
        lastPumpChange = currentTime;
      } else {
        Serial.println("⚠️  Pump cycle skipped - Tank empty!");
        lastPumpChange = currentTime; // Reset timer to try again after OFF cycle
      }
    }
  }
}

/**
 * Execute all control logic
 * Should be called regularly with current sensor readings
 */
void executeControlLogic(float temperature, float humidity, float light, bool tankLevel) {
  controlFan(humidity);
  controlHeating(temperature);
  controlPump(tankLevel);
  // LED is manual control, no automatic control
}

/**
 * Get pump cycle timing information
 * @param isInOnCycle Output parameter - true if currently in ON cycle
 * @return Time remaining in current cycle (milliseconds)
 */
unsigned long getPumpCycleInfo(bool &isInOnCycle) {
  unsigned long currentTime = millis();
  unsigned long timeSinceLastChange = currentTime - lastPumpChange;
  isInOnCycle = pumpCycleState;
  
  if (pumpCycleState) {
    return PUMP_ON_TIME - timeSinceLastChange;
  } else {
    return PUMP_OFF_TIME - timeSinceLastChange;
  }
}
