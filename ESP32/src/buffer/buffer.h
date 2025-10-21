/**
 * @file buffer.h
 * @brief Circular buffer module for offline telemetry storage
 * 
 * Two-tier buffering system:
 * - Buffer #1: High-resolution 1-minute readings (10 entries)
 * - Buffer #2: Low-resolution 10-minute aggregates (10 entries)
 * 
 * When MQTT is offline, data is stored in Buffer #1.
 * When Buffer #1 fills, data is aggregated into Buffer #2.
 * When MQTT reconnects, buffers are flushed automatically.
 */

#ifndef BUFFER_H
#define BUFFER_H

// Telemetry data structure
struct TelemetryReading {
  char timestamp[30];       // ISO 8601 timestamp string
  float temperature;        // Celsius
  float humidity;           // Percentage
  float light;              // Lux
  bool tankLevel;           // Water tank status
  bool pumpOn;              // Pump state
  bool lightsOn;            // LED state
  bool irrigated;           // Irrigation occurred flag
  bool valid;               // Data validity flag
};

// ============================================
// BUFFER #1: 1-Minute High Resolution Buffer
// ============================================

/**
 * Initialize 1-minute buffer
 */
void initBuffer1Min();

/**
 * Add telemetry reading to 1-minute buffer
 * @param reading Telemetry data to store
 */
void addToBuffer1Min(const TelemetryReading& reading);

/**
 * Get oldest reading from 1-minute buffer
 * @param reading Output parameter for retrieved data
 * @return true if reading retrieved, false if buffer empty
 */
bool getOldestFrom1MinBuffer(TelemetryReading& reading);

/**
 * Remove oldest reading from 1-minute buffer (after successful transmission)
 */
void removeOldestFrom1MinBuffer();

/**
 * Get 1-minute buffer count
 * @return Number of readings currently stored
 */
int get1MinBufferCount();

/**
 * Check if 1-minute buffer is full
 * @return true if buffer is full
 */
bool is1MinBufferFull();

// ============================================
// BUFFER #2: 10-Minute Aggregated Buffer
// ============================================

/**
 * Initialize 10-minute buffer
 */
void initBuffer10Min();

/**
 * Aggregate readings from 1-minute buffer and store in 10-minute buffer
 * Called automatically when Buffer #1 is full
 * @param readings Array of TelemetryReading structs
 * @param count Number of readings to aggregate
 */
void aggregateAndStore(TelemetryReading readings[], int count);

/**
 * Get oldest reading from 10-minute buffer
 * @param reading Output parameter for retrieved data
 * @return true if reading retrieved, false if buffer empty
 */
bool getOldestFrom10MinBuffer(TelemetryReading& reading);

/**
 * Remove oldest reading from 10-minute buffer (after successful transmission)
 */
void removeOldestFrom10MinBuffer();

/**
 * Get 10-minute buffer count
 * @return Number of readings currently stored
 */
int get10MinBufferCount();

/**
 * Check if 10-minute buffer is full
 * @return true if buffer is full
 */
bool is10MinBufferFull();

// ============================================
// BUFFER MANAGEMENT
// ============================================

/**
 * Get total buffered readings count (across both buffers)
 * @return Total number of buffered readings
 */
int getTotalBufferedCount();

/**
 * Check if any buffer has data
 * @return true if there is buffered data to send
 */
bool hasBufferedData();

#endif // BUFFER_H
