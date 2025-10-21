/**
 * @file buffer_10min.cpp
 * @brief Low-resolution circular buffer (10-minute aggregates)
 * 
 * Stores aggregated telemetry from Buffer #1 (10 aggregates)
 * Preserves data during extended outages
 */

#include <Arduino.h>
#include <string.h>
#include "buffer.h"

// Buffer configuration
const int BUFFER_10MIN_SIZE = 10;

// Circular buffer
TelemetryReading buffer10min[BUFFER_10MIN_SIZE];
int buffer10minHead = 0;
int buffer10minCount = 0;

/**
 * Initialize 10-minute buffer
 */
void initBuffer10Min() {
  for (int i = 0; i < BUFFER_10MIN_SIZE; i++) {
    buffer10min[i].valid = false;
  }
  Serial.println("10-minute buffer initialized");
}

/**
 * Aggregate readings from 1-minute buffer and store
 * @param readings Array of TelemetryReading structs
 * @param count Number of readings to aggregate
 */
void aggregateAndStore(TelemetryReading readings[], int count) {
  if (count == 0) {
    return;
  }
  
  // Calculate averages
  TelemetryReading aggregate;
  memset(&aggregate, 0, sizeof(TelemetryReading));
  
  // Use latest timestamp
  strncpy(aggregate.timestamp, readings[count - 1].timestamp, sizeof(aggregate.timestamp) - 1);
  
  float tempSum = 0, humSum = 0, lightSum = 0;
  
  for (int i = 0; i < count; i++) {
    tempSum += readings[i].temperature;
    humSum += readings[i].humidity;
    lightSum += readings[i].light;
  }
  
  aggregate.temperature = tempSum / count;
  aggregate.humidity = humSum / count;
  aggregate.light = lightSum / count;
  aggregate.tankLevel = readings[count - 1].tankLevel; // Use latest
  aggregate.pumpOn = readings[count - 1].pumpOn;
  aggregate.lightsOn = readings[count - 1].lightsOn;
  aggregate.irrigated = readings[count - 1].irrigated;
  aggregate.valid = true;
  
  // Store in buffer
  buffer10min[buffer10minHead] = aggregate;
  buffer10minHead = (buffer10minHead + 1) % BUFFER_10MIN_SIZE;
  
  if (buffer10minCount < BUFFER_10MIN_SIZE) {
    buffer10minCount++;
  }
  
  Serial.printf("Added to 10-min buffer (count: %d)\n", buffer10minCount);
}

/**
 * Get oldest reading from buffer
 * @param reading Output parameter for retrieved data
 * @return true if reading retrieved, false if buffer empty
 */
bool getOldestFrom10MinBuffer(TelemetryReading& reading) {
  if (buffer10minCount == 0) {
    return false;
  }
  
  int oldestIndex = (buffer10minHead - buffer10minCount + BUFFER_10MIN_SIZE) % BUFFER_10MIN_SIZE;
  reading = buffer10min[oldestIndex];
  
  return reading.valid;
}

/**
 * Remove oldest reading from buffer (after successful transmission)
 */
void removeOldestFrom10MinBuffer() {
  if (buffer10minCount > 0) {
    buffer10minCount--;
  }
}

/**
 * Get buffer status
 * @return Number of readings currently stored
 */
int get10MinBufferCount() {
  return buffer10minCount;
}

/**
 * Check if buffer is full
 * @return true if buffer is at capacity
 */
bool is10MinBufferFull() {
  return buffer10minCount >= BUFFER_10MIN_SIZE;
}

// ============================================
// BUFFER MANAGEMENT FUNCTIONS
// ============================================

/**
 * Get total buffered readings count
 * @return Total number of readings across both buffers
 */
int getTotalBufferedCount() {
  return get1MinBufferCount() + get10MinBufferCount();
}

/**
 * Check if any buffer has data
 * @return true if there is buffered data to send
 */
bool hasBufferedData() {
  return (get1MinBufferCount() > 0) || (get10MinBufferCount() > 0);
}
