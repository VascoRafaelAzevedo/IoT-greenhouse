# 🌿 ESP32 Firmware & Local Control

This folder contains the firmware for the **ESP32 DevKit CH340** microcontroller, which serves as the core embedded system for the GardenAway IoT greenhouse. The ESP32 handles sensor data acquisition, local control logic, MQTT communication, and provides a minimal web interface for real-time monitoring.

---

## 📌 Overview

The ESP32 acts as the **brain of the greenhouse**, coordinating between sensors, actuators, cloud services, and local users. It operates in multiple modes simultaneously:

1. **Sensor Data Collector**: Reads telemetry from multiple sensors every minute.
2. **MQTT Publisher**: Sends telemetry to the cloud-based MQTT broker.
3. **MQTT Subscriber**: Receives setpoints and commands from the backend.
4. **Local Access Point**: Hosts a minimal web server for on-site monitoring.
5. **Autonomous Controller**: Executes control logic based on received setpoints.
6. **Resilient Buffer System**: Stores telemetry locally during network outages.

---

## 🛠️ Hardware Specifications

| Component | Details |
|-----------|---------|
| **Microcontroller** | ESP32 DevKit CH340 |
| **Connectivity** | Wi-Fi (2.4GHz only), Bluetooth |
| **Relays** | 4 channels (pump, heating, heating, fan) |

### Sensor Inputs
- **Temperature Sensor** DHT11
- **Humidity Sensor** DHT11
- **Light Sensor** VCNL 4010
- **Tank Water Level** VS804-021

### Actuator Outputs (via Relays)
- **Water Pump**: Controls irrigation cycles
- **Heating Element**: Maintains target temperature (for prototyping purposes will be another fan)
- **LED Strips**: Supplemental lighting control
- **Ventilation Fan**: Air circulation and cooling

---

## 🌐 Dual Connectivity Architecture

### 1. Cloud Connectivity (Wi-Fi Station Mode)
The ESP32 connects to the user's home Wi-Fi network to communicate with the cloud infrastructure:

- **MQTT Broker Address**: Configured via environment variables or hardcoded
- **Topics**:
  - **Publish**: `greenhouse/{greenhouse_id}/telemetry` (sensor data)
  - **Subscribe**: `greenhouse/{greenhouse_id}/setpoints` (control commands)
- **Security**: TLS/SSL support for encrypted MQTT communication (future enhancement)

### 2. Local Access Point (AP Mode)
Simultaneously runs a local Wi-Fi access point:

- **SSID**: `Greenhouse_{device_id}`
- **Password**: User-configurable or default
- **Purpose**: Allow on-site users to view real-time data without internet access
- **Web Server**: Lightweight HTTP server serving a single-page interface

---

## 📡 MQTT Communication

### Published Messages (Telemetry)
Every **1 minute**, the ESP32 publishes a JSON payload:

```json
{
  "device_id": "uuid",
  "timestamp": "2025-10-11T14:30:00Z",
  "temperature": 24.5,
  "humidity": 65.0,
  "light": 620,
  "tank_level": true,
  "irrigated_since_last_transmission": true,
  "lights_are_on: false"
}
```

### Subscribed Messages (Setpoints & Commands)
Receives control parameters from the backend:

```json
{
  "plant_cultivating": "Tomatoes",
  "temperature_target": 22.0,
  "humidity_target": 70.0,
  "light_target": 500,
  "irrigation_interval": 3600,
  "irrigation_duration": 120
}
```

---

## 🔄 Resilience: Circular Buffer System

To handle network outages, the ESP32 implements a **two-tier circular buffer**:

### Buffer 1: High-Resolution (1-minute readings)
- **Capacity**: 10 readings
- **Purpose**: Store the most recent telemetry
- **Behavior**: Overwrites oldest data when full

### Buffer 2: Low-Resolution (10-minute aggregates)
- **Capacity**: 10 readings (stores 1 reading per 10 minutes)
- **Purpose**: Preserve historical data during extended outages
- **Behavior**: Aggregates from Buffer 1 (average/median)

### Recovery Behavior
When connectivity is restored:

1. **Prioritize oldest data**: Send Buffer 2 readings first (oldest to newest)
2. **Then send recent data**: Transmit Buffer 1 readings
3. **Resume normal operation**: Switch back to real-time publishing

**Note**: Data loss is acceptable after buffers fill. This design balances storage constraints with resilience.

---

## 🤖 Local Control Logic

The ESP32 executes autonomous control rules based on received setpoints:

### Temperature Control
```
IF current_temperature < target_temperature:
    TURN ON heating_relay
ELSE:
    TURN OFF heating_relay
```

### Humidity Control
```
IF current_humidity < target_humidity:
    ACTIVATE irrigation (if soil permits)
ELSE IF current_humidity > target_humidity + threshold:
    TURN ON ventilation_fan
```

### Irrigation Control
```
IF time_since_last_irrigation >= irrigation_interval:
    IF soil_moisture < target_soil_moisture:
        TURN ON water_pump FOR irrigation_duration seconds
```

### Light Control
```
IF current_light < target_light:
    TURN ON LED_strips
ELSE:
    TURN OFF LED_strips
```

### Ventilation Control
```
IF temperature > target_temperature + 2°C:
    TURN ON ventilation_fan
ELSE IF co2 > target_co2 + 100ppm:
    TURN ON ventilation_fan
ELSE:
    TURN OFF ventilation_fan
```

---

## 🖥️ Local Web Interface

### Purpose
Provide a **simple, elegant, and minimalist** real-time view of greenhouse conditions for on-site users.

### Features
- **Current Sensor Readings**: Temperature, humidity, CO₂, light, soil moisture
- **Actuator Status**: Current state of relays (ON/OFF)
- **Last Update Timestamp**: Shows data freshness
- **Responsive Design**: Viewable on mobile devices
- **No Historical Data**: Focuses only on real-time values

### Access
1. Connect to the ESP32 access point (`Greenhouse_{device_id}`)
2. Navigate to `http://192.168.4.1` in a web browser
3. View live telemetry without authentication

**Design Philosophy**: Complement the main web application, not replace it. This interface is intentionally limited to avoid feature creep.

---

## 📁 Project Structure (Future)

```
esp32/
├── src/
│   ├── main.cpp              # Entry point
│   ├── sensors/              # Sensor reading modules
│   │   ├── temperature.cpp
│   │   ├── humidity.cpp
│   │   ├── co2.cpp
│   │   ├── light.cpp
│   │   └── soil_moisture.cpp
│   ├── actuators/            # Relay control modules
│   │   ├── pump.cpp
│   │   ├── heating.cpp
│   │   ├── led.cpp
│   │   └── fan.cpp
│   ├── mqtt/                 # MQTT client logic
│   │   ├── client.cpp
│   │   └── reconnect.cpp
│   ├── buffer/               # Circular buffer implementation
│   │   ├── buffer_1min.cpp
│   │   └── buffer_10min.cpp
│   ├── webserver/            # Local web server
│   │   ├── server.cpp
│   │   └── html_content.h
│   └── control/              # Autonomous control logic
│       └── rules.cpp
├── platformio.ini            # PlatformIO configuration
├── README.md                 # This file
└── simulator/                # Python/Rust mock for CI
    └── mock_publisher.py
```

---

## ⚙️ Configuration Parameters

These will be configurable via a config file or hardcoded:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `WIFI_SSID` | - | Home Wi-Fi network name |
| `WIFI_PASSWORD` | - | Home Wi-Fi password |
| `MQTT_BROKER` | `mosquitto` | MQTT broker hostname/IP |
| `MQTT_PORT` | `1883` | MQTT broker port |
| `MQTT_USER` | - | MQTT authentication username |
| `MQTT_PASSWORD` | - | MQTT authentication password |
| `DEVICE_ID` | Auto-generated UUID | Unique device identifier |
| `GREENHOUSE_ID` | - | Associated greenhouse UUID |
| `AP_SSID` | `Greenhouse_{ID}` | Local access point name |
| `AP_PASSWORD` | `greenhouse123` | Local AP password |
| `TELEMETRY_INTERVAL` | `60` | Sensor reading interval (seconds) |

---

## 🚀 Future Enhancements

- **OTA (Over-The-Air) Updates**: Remote firmware updates via Wi-Fi
- **TLS/SSL**: Encrypted MQTT communication
- **NTP Time Sync**: Accurate timestamps even without internet
- **EEPROM Persistence**: Save setpoints across power cycles
- **Deep Sleep Mode**: Power optimization during inactivity
- **Watchdog Timer**: Auto-recovery from crashes

---

## 🧪 Testing & Simulation

For CI/CD purposes, a **simulator** will be developed to mock ESP32 behavior:

- **Language**: Python or Rust
- **Purpose**: Publish fake telemetry to MQTT for testing consumer/API
- **Location**: `esp32/simulator/`

---

## 📖 References

- [ESP32 Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
- [PlatformIO](https://platformio.org/)
- [PubSubClient (MQTT Library)](https://github.com/knolleary/pubsubclient)
- [ESPAsyncWebServer](https://github.com/me-no-dev/ESPAsyncWebServer)

---

## 🔗 Integration with Main System

The ESP32 is a critical component of the GardenAway architecture:

```
ESP32 → MQTT Broker → Consumer → TimescaleDB → API → Frontend
  ↑                                                       ↓
  └──────────────── Setpoints & Commands ────────────────┘
```

For more details on the overall system, see the [main README](../README.md).

---