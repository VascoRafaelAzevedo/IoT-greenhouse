/**
 * @file buffer_1min.cpp
 * @brief High-resolution circular buffer (1-minute readings)
 * 
 * Stores the most recent 10 telemetry readings (1 per minute)
 * When full, data is aggregated and moved to Buffer #2
 */

#include <Arduino.h>
#include "buffer.h"

// Buffer configuration
const int BUFFER_1MIN_SIZE = 10;

// Circular buffer
TelemetryReading buffer1min[BUFFER_1MIN_SIZE];
int buffer1minHead = 0;
int buffer1minCount = 0;

/**
 * Initialize 1-minute buffer
 */
void initBuffer1Min() {
  for (int i = 0; i < BUFFER_1MIN_SIZE; i++) {
    buffer1min[i].valid = false;
  }
  Serial.println("1-minute buffer initialized");
}

/**
 * Add telemetry reading to buffer
 * @param reading Telemetry data to store
 */
void addToBuffer1Min(const TelemetryReading& reading) {
  buffer1min[buffer1minHead] = reading;
  buffer1min[buffer1minHead].valid = true;
  
  buffer1minHead = (buffer1minHead + 1) % BUFFER_1MIN_SIZE;
  
  if (buffer1minCount < BUFFER_1MIN_SIZE) {
    buffer1minCount++;
  }
  
  Serial.printf("Added to 1-min buffer (count: %d)\n", buffer1minCount);
}

/**
 * Get oldest reading from buffer
 * @param reading Output parameter for retrieved data
 * @return true if reading retrieved, false if buffer empty
 */
bool getOldestFrom1MinBuffer(TelemetryReading& reading) {
  if (buffer1minCount == 0) {
    return false;
  }
  
  int oldestIndex = (buffer1minHead - buffer1minCount + BUFFER_1MIN_SIZE) % BUFFER_1MIN_SIZE;
  reading = buffer1min[oldestIndex];
  
  return reading.valid;
}

/**
 * Remove oldest reading from buffer (after successful transmission)
 */
void removeOldestFrom1MinBuffer() {
  if (buffer1minCount > 0) {
    buffer1minCount--;
  }
}

/**
 * Get buffer status
 * @return Number of readings currently stored
 */
int get1MinBufferCount() {
  return buffer1minCount;
}

/**
 * Check if buffer is full
 * @return true if buffer is at capacity
 */
bool is1MinBufferFull() {
  return buffer1minCount >= BUFFER_1MIN_SIZE;
}
