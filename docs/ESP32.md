# ESP32 Firmware Documentation

Firmware for **ESP32 DevKit CH340** that handles sensor data readings, actuator control, MQTT communication, and local a web interface.

## Overview

The ESP32 operates in multiple modes:

1. **Sensor Data Collector** - Reads telemetry every minute
2. **MQTT Publisher** - Sends telemetry to cloud broker
3. **MQTT Subscriber** - Receives setpoints from backend
4. **Local Access Point** - Hosts web server for on-site monitoring
5. **Autonomous Controller** - Executes control logic based on setpoints controlled by the user
6. **Resilient Buffer** - Stores telemetry when connection drops interrupt comunication

For database schema details, see [DATABASE.md](DATABASE.md). For API interaction, see [API.md](API.md).

## Hardware

| Component | Model |
|-----------|-------|
| **Microcontroller** | ESP32 DevKit CH340 |
| **Temperature/Humidity** | DHT11 |
| **Light Sensor** | VCNL4010 |
| **Water Level Sensor** | VS804-021 |1\
| **Relays** | 4-channel (pump, heating, LED, fan) |

### Actuators (via Relays)
- **Water Pump** - Irrigation control
- **Heating/Fan** - Temperature regulation (prototype uses fan)
- **LED Strips** - Supplemental lighting
- **Ventilation Fan** - Air circulation

## Circuit Diagram

The following diagram shows the complete wiring and connections between the ESP32, sensors, actuators, and power supply:

![Circuit Diagram](circuit.svg)

**Key connections:**
- **GPIO21/GPIO22** - I2C bus (SDA/SCL) for Light Sensor (VCNL4010) and LED control
- **GPIO23** - Relay 1 (Fan 1)
- **GPIO22** - Relay 2 (Fan 2) 
- **GPIO21** - Relay 3 (Pump)
- **GPIO19** - Temperature/Humidity sensor (DHT11)
- **5V Power Supply** - Powers relays and sensors
- **12V Power Supply** - Powers actuators (fans, pump)

## Connectivity

### Cloud (Wi-Fi Station Mode)
Connects to home Wi-Fi for cloud communication.

**MQTT Topics:**
- Publish: `greenhouse/{greenhouse_id}/telemetry`
- Subscribe: `greenhouse/{greenhouse_id}/setpoints`

### Local Access Point
Runs simultaneously for on-site access.

- **SSID:** `GardenAway_{greenhouse_id}`
- **IP:** `192.168.4.1`
- **Purpose:** Real-time monitoring without internet

## MQTT Messages

### Telemetry (Published every 60s)

```json
{
  "greenhouse_id": "uuid",
  "sequence": 123,
  "temp_air": 24.5,
  "hum_air": 65.0,
  "lux": 15000.0,
  "light_intensity": 80.0,
  "light_on": true,
  "water_level_ok": true,
  "pump_on": false
}
```

### Setpoints (Subscribed)

```json
{
  "target_temp_min": 18.0,
  "target_temp_max": 25.0,
  "target_hum_air_max": 70.0,
  "irrigation_interval_minutes": 60,
  "irrigation_duration_seconds": 30,
  "target_light_intensity": 500.0,
  "changed_at": "2025-11-03T10:30:00+00:00"
}
```

## Circular Buffer System

Handles network outages with two-tier buffering.

### Buffer 1: High-Resolution (1min)
- **Capacity:** 10 readings
- **Purpose:** Recent telemetry
- **Behavior:** Circular overwrite

### Buffer 2: Low-Resolution (10min)
- **Capacity:** 10 aggregated readings
- **Purpose:** Historical data during outages
- **Behavior:** Averages from Buffer 1

### Recovery
When connectivity restored:
1. Send Buffer 2 (oldest first)
2. Send Buffer 1
3. Resume real-time publishing

**Note:** Data loss acceptable after buffers fill.

## Local Web Interface

Access at `http://192.168.4.1` when connected to ESP32 AP.

**Features:**
- Current sensor readings
- Actuator status (ON/OFF)
- Last update timestamp
- Responsive design

**Philosophy:** Minimalist real-time view only. No historical data or controls.

## Project Structure

```
ESP32/
├── src/
│   ├── main.cpp              # Main loop
│   ├── config.h              # Configuration
│   ├── constants.h           # Pin definitions
│   ├── sensors/              # Sensor modules
│   │   ├── temperature.cpp   # DHT11 temp
│   │   ├── humidity.cpp      # DHT11 humidity
│   │   ├── light.cpp         # VCNL4010
│   │   └── tank_level.cpp    # VS804-021
│   ├── actuators/            # Relay control
│   │   ├── pump.cpp
│   │   ├── heating.cpp
│   │   ├── led.cpp
│   │   └── fan.cpp
│   ├── mqtt/                 # MQTT client
│   │   ├── client.cpp
│   │   └── reconnect.cpp
│   ├── buffer/               # Circular buffers
│   │   ├── buffer_1min.cpp
│   │   └── buffer_10min.cpp
│   ├── webserver/            # Local AP server
│   │   ├── server.cpp
│   │   └── html_content.h
│   └── control/              # Autonomous logic
│       └── rules.cpp
├── platformio.ini
└── README.md
```

## Configuration

Edit `src/config.h`:

```cpp
#define WIFI_SSID "your-wifi"
#define WIFI_PASSWORD "your-password"
#define MQTT_BROKER "broker-ip"
#define MQTT_PORT 1883
#define MQTT_USER "username"
#define MQTT_PASSWORD "password"
#define GREENHOUSE_ID "uuid"
#define TELEMETRY_INTERVAL 60000  // 60 seconds
```

## Pin Assignments

Defined in `src/constants.h`:

```cpp
#define DHT_PIN 4           // DHT11
#define VCNL_SDA 21         // I2C
#define VCNL_SCL 22         // I2C
#define TANK_LEVEL_PIN 34   // Digital input

#define RELAY_PUMP 25
#define RELAY_HEATING 26
#define RELAY_LED 27
#define RELAY_FAN 32
```

## Control Logic

Located in `src/control/rules.cpp`:

- **Temperature:** Turn heating ON if < min, fan ON if > max
- **Humidity:** Turn fan ON if > max
- **Light:** Turn LED ON if < target (during daylight hours)
- **Irrigation:** Based on interval/duration from setpoints
- **Water Level:** Disable pump if tank empty

## Important Notes

1. **Setpoints must be received before control activates**
2. **Timestamps are UTC** - frontend handles timezone conversion
3. **Buffers prioritize old data** during recovery
4. **Local AP does not require authentication**
5. **Serial output** available at 115200 baud for debugging

## Related Documentation

- [API Documentation](API.md) - Setpoint management and telemetry queries
- [Database Schema](DATABASE.md) - Data storage structure
- [Setup Guide](SETUP.md) - MQTT broker configuration

## References

- [ESP32 Technical Reference](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [PlatformIO Documentation](https://docs.platformio.org/)
- [DHT Sensor Library](https://github.com/adafruit/DHT-sensor-library)
- [VCNL4010 Library](https://github.com/adafruit/Adafruit_VCNL4010)
- [PubSubClient MQTT](https://github.com/knolleary/pubsubclient)
