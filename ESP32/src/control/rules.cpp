/**
 * @file rules.cpp
 * @brief Autonomous control logic based on thresholds
 * 
 * Implements control rules for maintaining optimal greenhouse conditions
 */

#include <Arduino.h>
#include "../config.h"
#include "../constants.h"
#include "../control/control.h"
#include "../actuators/actuators.h"

// ============================================
// DYNAMIC SETPOINTS (can be updated via MQTT)
// ============================================
// Temperature control (in Celsius)
float setpoint_temp_min = DEFAULT_TEMP_MIN;
float setpoint_temp_max = DEFAULT_TEMP_MAX;

// Humidity control (in percentage)
float setpoint_hum_air_max = DEFAULT_HUM_AIR_MAX;

// Light control (in arbitrary units)
float setpoint_light_intensity = DEFAULT_LIGHT_INTENSITY;

// Irrigation control
unsigned long setpoint_irrigation_interval_minutes = DEFAULT_IRRIGATION_INTERVAL_MINUTES;
unsigned long setpoint_irrigation_duration_seconds = DEFAULT_IRRIGATION_DURATION_SECONDS;

// ============================================
// IRRIGATION STATE TRACKING
// ============================================
unsigned long lastIrrigationStartTime = 0;  // When last irrigation started
bool isIrrigating = false;                  // Currently irrigating?
bool irrigatedSinceLastTransmission = false; // For telemetry reporting

/**
 * Initialize control logic
 */
void initControlLogic() {
  lastIrrigationStartTime = millis();
  isIrrigating = false;
  irrigatedSinceLastTransmission = false;
  
  Serial.println("\n📋 Control Rules (Default Setpoints):");
  Serial.print("   �️  Temperature: ");
  Serial.print(setpoint_temp_min);
  Serial.print("°C - ");
  Serial.print(setpoint_temp_max);
  Serial.println("°C");
  
  Serial.print("   💧 Humidity:    Max ");
  Serial.print(setpoint_hum_air_max);
  Serial.println("%");
  
  Serial.print("   🌬️  Fan:        ON if Humidity > ");
  Serial.print(setpoint_hum_air_max);
  Serial.print("% OR Temp > ");
  Serial.print(setpoint_temp_max);
  Serial.println("°C");
  
  Serial.print("   💡 Light:       Target ");
  Serial.print(setpoint_light_intensity);
  Serial.println(" units");
  
  Serial.print("   🚰 Irrigation:  Every ");
  Serial.print(setpoint_irrigation_interval_minutes);
  Serial.print(" min, for ");
  Serial.print(setpoint_irrigation_duration_seconds);
  Serial.println(" sec");
  
  Serial.println("   💡 LED:         Manual control (OFF)\n");
}

/**
 * Execute fan control logic (Humidity-based AND Temperature-based)
 * Fan turns ON if:
 * - Humidity exceeds maximum setpoint OR
 * - Temperature exceeds maximum setpoint (for cooling)
 */
void controlFan(float humidity, float temperature) {
  bool shouldFanBeOn = false;
  
  // Check humidity condition
  if (humidity != SENSOR_ERROR_TEMP && humidity > setpoint_hum_air_max) {
    shouldFanBeOn = true;
  }
  
  // Check temperature condition (fan helps cool down)
  if (temperature != SENSOR_ERROR_TEMP && temperature > setpoint_temp_max) {
    shouldFanBeOn = true;
  }
  
  // Apply fan state
  if (shouldFanBeOn) {
    if (!isFanOn()) {
      turnFanOn();
    }
  } else {
    if (isFanOn()) {
      turnFanOff();
    }
  }
}

/**
 * Execute heating control logic (Temperature-based)
 * Heating turns ON if temperature is below minimum setpoint
 * Heating turns OFF if temperature reaches maximum setpoint
 */
void controlHeating(float temperature) {
  if (temperature != SENSOR_ERROR_TEMP) {
    if (temperature < setpoint_temp_min) {
      if (!isHeatingOn()) {
        turnHeatingOn();
      }
    } else if (temperature >= setpoint_temp_max) {
      if (isHeatingOn()) {
        turnHeatingOff();
      }
    }
    // Keep current state if temperature is between min and max
  }
}

/**
 * Execute pump control logic (Irrigation interval/duration based)
 * Irrigates for a set duration at specified intervals
 */
void controlPump(bool tankLevel) {
  unsigned long currentTime = millis();
  unsigned long irrigation_interval_ms = setpoint_irrigation_interval_minutes * 60UL * 1000UL;
  unsigned long irrigation_duration_ms = setpoint_irrigation_duration_seconds * 1000UL;
  
  if (isIrrigating) {
    // Currently irrigating - check if duration has elapsed
    unsigned long timeSinceStart = currentTime - lastIrrigationStartTime;
    
    if (timeSinceStart >= irrigation_duration_ms) {
      // Irrigation complete
      turnPumpOff();
      isIrrigating = false;
      irrigatedSinceLastTransmission = true;
      Serial.println("✅ Irrigation cycle completed");
    }
  } else {
    // Not irrigating - check if it's time to start
    unsigned long timeSinceLastIrrigation = currentTime - lastIrrigationStartTime;
    
    if (timeSinceLastIrrigation >= irrigation_interval_ms) {
      // Time to irrigate
      if (tankLevel) {
        turnPumpOn();
        isIrrigating = true;
        lastIrrigationStartTime = currentTime;
        Serial.print("🚰 Starting irrigation (");
        Serial.print(setpoint_irrigation_duration_seconds);
        Serial.println(" seconds)");
      } else {
        // Tank empty, skip this cycle and try again at next interval
        Serial.println("⚠️  Irrigation skipped - Tank empty!");
        lastIrrigationStartTime = currentTime; // Reset timer
      }
    }
  }
}

/**
 * Execute all control logic
 * Should be called regularly with current sensor readings
 */
void executeControlLogic(float temperature, float humidity, float light, bool tankLevel) {
  controlFan(humidity, temperature);  // Fan uses both humidity and temperature
  controlHeating(temperature);
  controlPump(tankLevel);
  // LED is manual control, no automatic control
}

/**
 * Get irrigation timing information
 * @param isCurrentlyIrrigating Output parameter - true if currently irrigating
 * @return Time remaining until next event (ms): either until irrigation ends or until next irrigation starts
 */
unsigned long getIrrigationInfo(bool &isCurrentlyIrrigating) {
  unsigned long currentTime = millis();
  unsigned long irrigation_interval_ms = setpoint_irrigation_interval_minutes * 60UL * 1000UL;
  unsigned long irrigation_duration_ms = setpoint_irrigation_duration_seconds * 1000UL;
  
  isCurrentlyIrrigating = isIrrigating;
  
  if (isIrrigating) {
    // Return time remaining in current irrigation
    unsigned long timeSinceStart = currentTime - lastIrrigationStartTime;
    if (timeSinceStart >= irrigation_duration_ms) {
      return 0;
    }
    return irrigation_duration_ms - timeSinceStart;
  } else {
    // Return time until next irrigation
    unsigned long timeSinceLastIrrigation = currentTime - lastIrrigationStartTime;
    if (timeSinceLastIrrigation >= irrigation_interval_ms) {
      return 0;
    }
    return irrigation_interval_ms - timeSinceLastIrrigation;
  }
}

/**
 * Update setpoints from MQTT message
 * @param temp_min Minimum temperature (Celsius)
 * @param temp_max Maximum temperature (Celsius)
 * @param hum_air_max Maximum humidity (percentage)
 * @param light_intensity Target light intensity
 * @param irrigation_interval_minutes Minutes between irrigations
 * @param irrigation_duration_seconds Duration of each irrigation in seconds
 */
void updateSetpoints(float temp_min, float temp_max, float hum_air_max, 
                     float light_intensity, unsigned long irrigation_interval_minutes, 
                     unsigned long irrigation_duration_seconds) {
  setpoint_temp_min = temp_min;
  setpoint_temp_max = temp_max;
  setpoint_hum_air_max = hum_air_max;
  setpoint_light_intensity = light_intensity;
  setpoint_irrigation_interval_minutes = irrigation_interval_minutes;
  setpoint_irrigation_duration_seconds = irrigation_duration_seconds;
  
  Serial.println("\n🔄 Setpoints updated via MQTT:");
  Serial.print("   🌡️  Temperature: ");
  Serial.print(setpoint_temp_min);
  Serial.print("°C - ");
  Serial.print(setpoint_temp_max);
  Serial.println("°C");
  
  Serial.print("   💧 Humidity:    Max ");
  Serial.print(setpoint_hum_air_max);
  Serial.println("%");
  
  Serial.print("   💡 Light:       Target ");
  Serial.print(setpoint_light_intensity);
  Serial.println(" units");
  
  Serial.print("   🚰 Irrigation:  Every ");
  Serial.print(setpoint_irrigation_interval_minutes);
  Serial.print(" min, for ");
  Serial.print(setpoint_irrigation_duration_seconds);
  Serial.println(" sec\n");
}

/**
 * Check if irrigation occurred since last call and reset flag
 * @return true if irrigation happened since last check
 */
bool checkAndResetIrrigationFlag() {
  bool result = irrigatedSinceLastTransmission;
  irrigatedSinceLastTransmission = false;
  return result;
}
