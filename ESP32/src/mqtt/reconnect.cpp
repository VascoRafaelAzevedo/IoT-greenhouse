/**
 * @file reconnect.cpp
 * @brief MQTT reconnection logic with exponential backoff and buffer flushing
 */

#include <Arduino.h>
#include "../constants.h"
#include "../buffer/buffer.h"
#include "mqtt.h"

// Reconnection state
unsigned long lastReconnectAttempt = 0;
bool wasConnectedBefore = false;
bool buffersFlushed = false;

/**
 * Handle MQTT reconnection with backoff
 * Automatically flushes buffered data after successful reconnection
 * Should be called regularly in main loop
 */
void handleMQTTReconnection() {
  bool currentlyConnected = isMQTTConnected();
  
  if (currentlyConnected) {
    // We are connected
    if (wasConnectedBefore) {
      // Was connected, still connected - do nothing
      return;
    } else {
      // Just reconnected! Flush buffers if we have data and haven't flushed yet
      Serial.println("\n🔄 STATE CHANGE: MQTT just connected!");
      wasConnectedBefore = true;
      
      if (hasBufferedData() && !buffersFlushed) {
        Serial.println("\n╔══════════════════════════════════════════╗");
        Serial.println("║  MQTT RECONNECTED - FLUSHING BUFFERS    ║");
        Serial.println("╚══════════════════════════════════════════╝");
        
        int totalBuffered = getTotalBufferedCount();
        Serial.printf("📦 Total buffered readings: %d\n", totalBuffered);
        
        int flushed = flushBufferedTelemetry();
        
        if (flushed > 0) {
          Serial.println("╔══════════════════════════════════════════╗");
          Serial.printf("║  ✅ FLUSHED %d READINGS SUCCESSFULLY    ║\n", flushed);
          Serial.println("╚══════════════════════════════════════════╝\n");
        }
        
        buffersFlushed = true;
      }
    }
    return;
  }
  
  // We are disconnected
  if (wasConnectedBefore) {
    // Just disconnected
    Serial.println("\n⚠️  MQTT connection lost - buffering telemetry");
    wasConnectedBefore = false;
    buffersFlushed = false; // Reset flush flag for next reconnection
  }
  
  // Try to reconnect
  unsigned long now = millis();
  
  if (now - lastReconnectAttempt > MQTT_RECONNECT_INTERVAL_MS) {
    lastReconnectAttempt = now;
    
    Serial.println("🔄 Attempting MQTT reconnection...");
    if (connectMQTT()) {
      lastReconnectAttempt = 0; // Reset on successful connection
      // Don't set wasConnectedBefore here - let the next loop iteration handle it
    }
  }
}
