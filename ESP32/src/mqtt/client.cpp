/**
 * @file client.cpp
 * @brief MQTT client implementation
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

// MQTT configuration
extern const char* MQTT_BROKER;
extern const int MQTT_PORT;
extern const char* DEVICE_ID;
extern const char* GREENHOUSE_ID;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Topic buffers
char telemetryTopic[100];
char setpointTopic[100];

/**
 * Callback for incoming MQTT messages
 */
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("📥 Message received on topic: ");
  Serial.println(topic);
  
  // TODO: Parse JSON payload and update setpoints
  // TODO: Trigger control logic updates
}

/**
 * Initialize MQTT client
 */
void initMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  
  // Build topic strings
  snprintf(telemetryTopic, sizeof(telemetryTopic), "greenhouse/%s/telemetry", GREENHOUSE_ID);
  snprintf(setpointTopic, sizeof(setpointTopic), "greenhouse/%s/setpoints", GREENHOUSE_ID);
  
  Serial.println("MQTT client initialized");
}

/**
 * Connect to MQTT broker
 * @return true if connected, false otherwise
 */
bool connectMQTT() {
  Serial.print("Connecting to MQTT broker...");
  
  if (mqttClient.connect(DEVICE_ID)) {
    Serial.println(" ✅ Connected");
    
    // Subscribe to setpoints topic
    mqttClient.subscribe(setpointTopic);
    Serial.printf("Subscribed to: %s\n", setpointTopic);
    
    return true;
  } else {
    Serial.print(" ❌ Failed, rc=");
    Serial.println(mqttClient.state());
    return false;
  }
}

/**
 * Publish telemetry data to MQTT
 * @param jsonPayload JSON string containing telemetry data
 * @return true if published successfully, false otherwise
 */
bool publishTelemetry(const char* jsonPayload) {
  if (!mqttClient.connected()) {
    return false;
  }
  
  bool success = mqttClient.publish(telemetryTopic, jsonPayload);
  if (success) {
    Serial.println("📤 Telemetry published");
  } else {
    Serial.println("❌ Failed to publish telemetry");
  }
  
  return success;
}

/**
 * Process MQTT client (must be called regularly in loop)
 */
void processMQTT() {
  if (!mqttClient.connected()) {
    // Reconnection handled by reconnect.cpp
    return;
  }
  
  mqttClient.loop();
}
