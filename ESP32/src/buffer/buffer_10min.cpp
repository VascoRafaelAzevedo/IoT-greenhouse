/**
 * @file buffer_10min.cpp
 * @brief Low-resolution circular buffer (10-minute aggregates)
 * 
 * Stores aggregated telemetry from Buffer 1 (10 readings)
 * Preserves data during extended outages
 */

#include <Arduino.h>

// Buffer configuration
const int BUFFER_10MIN_SIZE = 10;

// Telemetry structure (same as buffer_1min)
struct TelemetryReading {
  unsigned long timestamp;
  float temperature;
  float humidity;
  float light;
  bool tankLevel;
  bool valid;
};

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
 * Aggregate 10 readings from 1-minute buffer and store
 * @param readings Array of 10 TelemetryReading structs
 */
void aggregateAndStore(TelemetryReading readings[], int count) {
  if (count == 0) {
    return;
  }
  
  // Calculate averages
  TelemetryReading aggregate = {0};
  aggregate.timestamp = readings[count - 1].timestamp; // Use latest timestamp
  
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
