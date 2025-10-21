/**
 * @file mqtt.h
 * @brief MQTT client module function declarations
 */

#ifndef MQTT_H
#define MQTT_H

// Initialize WiFi connection
void initWiFi();

// Initialize MQTT client
void initMQTT();

// Connect to MQTT broker
bool connectMQTT();

// Check if MQTT is connected
bool isMQTTConnected();

// Process MQTT client (call regularly in loop)
void processMQTT();

// Handle MQTT reconnection
void handleMQTTReconnection();

// Publish telemetry data to MQTT
bool publishTelemetry(float temperature, float humidity, float light, bool tankLevel, bool pumpOn, bool lightsOn);

#endif // MQTT_H
