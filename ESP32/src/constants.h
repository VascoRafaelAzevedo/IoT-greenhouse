/**
 * @file constants.h
 * @brief System constants and magic number definitions
 * 
 * This file contains all system-level constants that are not user-configurable.
 * For user-configurable settings (WiFi, MQTT, setpoints), see config.h
 * 
 * Organization:
 * - Error codes and sentinel values
 * - Buffer sizes and memory allocation
 * - Timing and delays
 * - System limits
 */

#ifndef CONSTANTS_H
#define CONSTANTS_H

// ============================================
// ERROR CODES & SENTINEL VALUES
// ============================================

/**
 * Sensor error sentinel values
 * These values indicate sensor read failures
 */
#define SENSOR_ERROR_TEMP -999.0f      // Temperature sensor error value
#define SENSOR_ERROR_HUM -999.0f       // Humidity sensor error value
#define SENSOR_ERROR_LIGHT -1.0f       // Light sensor error value

// ============================================
// BUFFER SIZES (Memory Allocation)
// ============================================

/**
 * MQTT and network buffer sizes
 */
#define MQTT_JSON_BUFFER_SIZE 512      // JSON payload buffer size (bytes)
#define MQTT_TOPIC_BUFFER_SIZE 100     // MQTT topic string buffer size (bytes)
#define MQTT_MESSAGE_BUFFER_SIZE 512   // MQTT message buffer size (bytes)

/**
 * String buffer sizes
 */
#define TIMESTAMP_BUFFER_SIZE 30       // ISO 8601 timestamp string buffer (bytes)

/**
 * Circular buffer sizes
 */
#define BUFFER_1MIN_SIZE 10            // 1-minute high-resolution buffer (readings)
#define BUFFER_10MIN_SIZE 10           // 10-minute aggregated buffer (readings)

// ============================================
// TIMING & DELAYS (Communication)
// ============================================

/**
 * MQTT timing
 */
#define MQTT_PUBLISH_DELAY_MS 100      // Delay between MQTT publishes during flush (ms)
#define MQTT_RECONNECT_INTERVAL_MS 5000 // Delay between MQTT reconnection attempts (ms)

/**
 * Network initialization delays
 */
#define WIFI_CONNECTION_RETRY_DELAY_MS 500  // Delay between WiFi connection attempts (ms)
#define NTP_SYNC_RETRY_DELAY_MS 500         // Delay between NTP sync attempts (ms)

/**
 * System timing
 */
#define LOOP_DELAY_MS 100              // Main loop delay to prevent CPU hogging (ms)

// ============================================
// RETRY LIMITS
// ============================================

/**
 * Maximum retry attempts for network operations
 */
#define WIFI_MAX_CONNECTION_ATTEMPTS 20  // Maximum WiFi connection attempts before giving up
#define NTP_MAX_SYNC_ATTEMPTS 10         // Maximum NTP synchronization attempts before giving up

// ============================================
// DHT SENSOR SPECIFIC
// ============================================

/**
 * DHT sensor stabilization delay (production mode only)
 */
#define DHT_STABILIZATION_DELAY_MS 2000  // DHT sensor warm-up time after init (ms)

#endif // CONSTANTS_H
