/**
 * @file reconnect.cpp
 * @brief MQTT reconnection logic with exponential backoff
 */

#include <Arduino.h>
#include "mqtt.h"

// Reconnection state
unsigned long lastReconnectAttempt = 0;
const unsigned long RECONNECT_INTERVAL = 5000; // 5 seconds

/**
 * Handle MQTT reconnection with backoff
 * Should be called regularly in main loop
 */
void handleMQTTReconnection() {
  if (isMQTTConnected()) {
    return; // Already connected
  }
  
  unsigned long now = millis();
  
  if (now - lastReconnectAttempt > RECONNECT_INTERVAL) {
    lastReconnectAttempt = now;
    
    Serial.println("🔄 Attempting MQTT reconnection...");
    if (connectMQTT()) {
      lastReconnectAttempt = 0; // Reset on successful connection
    }
  }
}
