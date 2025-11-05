/**
 * @file led.cpp
 * @brief LED strips control module (WS2812B addressable LED strip)
 */

#include <Arduino.h>
#include "actuators.h"
#include "../config.h"

#ifdef TEST_MODE
  // ============================================
  // TEST MODE - Mock Implementation
  // ============================================
  
  bool mockLEDState = false;
  
  /**
   * Initialize LED strips relay (TEST MODE)
   */
  void initLED() {
    mockLEDState = false;
    Serial.println("✅ [TEST] LED strips initialized (MOCK)");
  }

  /**
   * Turn LED strips ON (TEST MODE)
   */
  void turnLEDOn() {
    mockLEDState = true;
    Serial.println("💡 [TEST] LED ON (MOCK)");
  }

  /**
   * Turn LED strips OFF (TEST MODE)
   */
  void turnLEDOff() {
    mockLEDState = false;
    Serial.println("💡 [TEST] LED OFF (MOCK)");
  }

  /**
   * Get LED status (TEST MODE)
   * @return true if LEDs are ON, false if OFF
   */
  bool isLEDOn() {
    return mockLEDState;
  }

#else
  // ============================================
  // PRODUCTION MODE - Real Hardware (WS2812B)
  // ============================================
  
  #include <FastLED.h>
  
  // LED strip configuration
  #define LED_PIN 14          // GPIO25 - Data pin for LED strip
  #define NUM_LEDS 60         // Number of LEDs in the strip
  #define LED_TYPE WS2812B    // Type of LED strip
  #define COLOR_ORDER GRB     // Color order for WS2812B
  #define BRIGHTNESS 150      // Reduced brightness to 60% (helps with power issues)
  
  // LED array
  CRGB leds[NUM_LEDS];
  bool ledState = false;

  /**
   * Initialize LED strip
   */
  void initLED() {
    // Add delay before initialization to stabilize power
    delay(100);
    
    // Configure FastLED with power management
    FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
    
    // Set maximum power draw to 500mA (adjust based on your power supply)
    // This prevents brownouts
    FastLED.setMaxPowerInVoltsAndMilliamps(5, 500);
    
    // Turn all LEDs OFF initially - do it twice to ensure clean state
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    delay(50);
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    
    ledState = false;
    
    Serial.println("✅ LED strip initialized (20 LEDs, WS2812B, 150 brightness)");
  }

  /**
   * Turn LED strips ON with full spectrum white light for plant growth
   */
  void turnLEDOn() {
    if (ledState) {
      return; // Already ON, avoid redundant updates
    }
    
    // Clear the strip first
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    delay(10);
    
    // Warm white light (good for plants, less power draw than pure white)
    // RGB(255, 200, 150) = warm white
    CRGB warmWhite = CRGB(255, 200, 150);
    
    // Fill all LEDs with the same color
    for(int i = 0; i < NUM_LEDS; i++) {
      leds[i] = warmWhite;
    }
    
    // Show the LEDs
    FastLED.show();
    
    ledState = true;
    Serial.println("💡 LED ON (Warm white, 20 LEDs)");
  }

  /**
   * Turn LED strips OFF
   */
  void turnLEDOff() {
    if (!ledState) {
      return; // Already OFF, avoid redundant updates
    }
    
    // Turn off all LEDs
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    
    ledState = false;
    Serial.println("💡 LED OFF");
  }

  /**
   * Get LED status
   * @return true if LEDs are ON, false if OFF
   */
  bool isLEDOn() {
    return ledState;
  }

#endif
