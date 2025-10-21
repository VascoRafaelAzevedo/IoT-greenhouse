/**
 * @file main.cpp
 * @brief ESP32 GardenAway - Automatic Control System
 */

#include <Arduino.h>
#include <Wire.h>

// Include module headers
#include "sensors/sensors.h"
#include "actuators/actuators.h"
#include "control/control.h"

// Display timing
unsigned long lastPrintTime = 0;
const unsigned long PRINT_INTERVAL = 2000; // 2 seconds

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n");
  Serial.println("========================================");
  Serial.println("🌱 GardenAway ESP32 - AUTO CONTROL MODE");
  Serial.println("========================================\n");
  
  // Initialize I2C
  Wire.begin(22, 23);
  
  // Initialize all sensors
  Serial.println("Initializing sensors...");
  initTemperatureSensor();
  initHumiditySensor();
  initLightSensor();
  initTankLevelSensor();
  
  // Initialize all actuators (relays)
  Serial.println("\nInitializing actuators...");
  initPump();
  initHeating();
  initLED();
  initFan();
  
  // Initialize control logic
  Serial.println("\n✅ System ready!");
  initControlLogic();
  
  delay(2000); // DHT stabilization
}

void loop() {
  unsigned long currentTime = millis();
  
  // Read all sensors
  float temperature = readTemperature();
  float humidity = readHumidity();
  float light = readLight();
  bool tankLevel = readTankLevel();
  
  // Execute automatic control logic
  executeControlLogic(temperature, humidity, light, tankLevel);
  
  // Display status
  if (currentTime - lastPrintTime >= PRINT_INTERVAL) {
    lastPrintTime = currentTime;
    
    Serial.println("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    Serial.print("⏰ Time: ");
    Serial.print(currentTime / 1000);
    Serial.println("s\n");
    
    // Sensor readings
    Serial.println("📊 SENSORS:");
    Serial.print("   🌡️  Temperature: ");
    if (temperature != -999.0) {
      Serial.print(temperature);
      Serial.println(" °C  [Target: 22°C]");
    } else {
      Serial.println("ERROR");
    }
    
    Serial.print("   💧 Humidity:    ");
    if (humidity != -999.0) {
      Serial.print(humidity);
      Serial.println(" %  [Threshold: 70%]");
    } else {
      Serial.println("ERROR");
    }
    
    Serial.print("   💡 Light:       ");
    if (light >= 0) {
      Serial.print(light);
      Serial.println(" units");
    } else {
      Serial.println("N/A");
    }
    
    Serial.print("   🚰 Tank:        ");
    Serial.println(tankLevel ? "✓ WATER OK" : "✗ EMPTY");
    
    // Actuator status
    Serial.println("\n⚙️  ACTUATORS:");
    Serial.print("   🌬️  Fan:     ");
    Serial.println(isFanOn() ? "🟢 ON" : "⚫ OFF");
    
    Serial.print("   🔥 Heating:  ");
    Serial.println(isHeatingOn() ? "🟢 ON" : "⚫ OFF");
    
    Serial.print("   💧 Pump:     ");
    Serial.print(isPumpOn() ? "🟢 ON" : "⚫ OFF");
    bool isInOnCycle;
    unsigned long timeRemaining = getPumpCycleInfo(isInOnCycle);
    if (isPumpOn()) {
      Serial.print("  (");
      Serial.print(timeRemaining / 1000);
      Serial.println("s remaining)");
    } else {
      Serial.print("  (next in ");
      Serial.print(timeRemaining / 1000);
      Serial.println("s)");
    }
    
    Serial.print("   💡 LED:      ");
    Serial.println(isLEDOn() ? "🟢 ON" : "⚫ OFF");
  }
  
  delay(100);
}
