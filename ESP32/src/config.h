/**
 * @file config.h
 * @brief Global configuration for the ESP32 GardenAway system
 * 
 * This file controls compilation settings for the entire project.
 * Modify settings here to switch between TEST and PRODUCTION modes.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// COMPILATION MODE
// ============================================
// Comment out the line below to switch to PRODUCTION mode (real hardware)
// Uncomment it to enable TEST mode (mock sensors/actuators, no hardware needed)
#define TEST_MODE

// ============================================
// MODE INDICATOR
// ============================================
#ifdef TEST_MODE
  #define MODE_NAME "TEST MODE - Mock Hardware"
  #define MODE_EMOJI "🧪"
#else
  #define MODE_NAME "PRODUCTION MODE - Real Hardware"
  #define MODE_EMOJI "🌱"
#endif

// ============================================
// DEVICE IDENTIFICATION
// ============================================
// TODO: Replace these with your actual values
#define DEVICE_ID "esp32-greenhouse-001"
#define GREENHOUSE_ID "00000000-0000-0000-0000-000000000000"

// ============================================
// WiFi CONFIGURATION
// ============================================
// TODO: Replace with your WiFi credentials
#define WIFI_SSID "QUARTO"
#define WIFI_PASSWORD "71866628"

// ============================================
// MQTT BROKER CONFIGURATION
// ============================================
// TODO: Replace with your MQTT broker details
#define MQTT_BROKER "158.178.203.109"
#define MQTT_PORT 1883
#define MQTT_USER ""  // Leave empty if no authentication
#define MQTT_PASSWORD ""  // Leave empty if no authentication

// ============================================
// NTP TIME CONFIGURATION
// ============================================
#define NTP_SERVER "pool.ntp.org"
#define GMT_OFFSET_SEC 0      // UTC offset in seconds (0 for UTC)
#define DAYLIGHT_OFFSET_SEC 0 // Daylight saving offset in seconds

// ============================================
// DEFAULT SETPOINTS
// ============================================
// These are the initial values used until setpoints are received via MQTT
// Values match the database schema (setpoint table)

// Temperature control (in Celsius)
#define DEFAULT_TEMP_MIN 22.0f
#define DEFAULT_TEMP_MAX 24.0f

// Humidity control (in percentage)
#define DEFAULT_HUM_AIR_MAX 70.0f

// Light control (in arbitrary units)
#define DEFAULT_LIGHT_INTENSITY 500.0f

// Irrigation control
#define DEFAULT_IRRIGATION_INTERVAL_MINUTES 1  // 
#define DEFAULT_IRRIGATION_DURATION_SECONDS 20 //

// ============================================
// TIMING CONFIGURATION
// ============================================
#define TELEMETRY_INTERVAL_MS 60000  // 60 seconds = 1 minute
#define DISPLAY_INTERVAL_MS 2000     // 2 seconds

#endif // CONFIG_H
