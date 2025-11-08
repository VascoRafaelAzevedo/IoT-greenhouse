# 🌱 GardenAway IoT System

![CI](https://github.com/VascoRafaelAzevedo/IoT-greenhouse/actions/workflows/ci.yml/badge.svg?branch=main)

Welcome to the **GardenAway IoT System**. This repository contains the complete software stack for real-time greenhouse monitoring and automation, with focus on embedded systems, IoT protocols, and microservices architecture.

## Overview

The project includes a number of components, which are running within their own containers:

- **ESP32 Microcontroller** -It gathers data from sensors such as temperature, humidity, light, and water level, then publishes it on MQTT topics.
- **MQTT Broker (Mosquitto)** - Manages message delivery between devices and server (mainly database)
- **PostgreSQL + TimescaleDB** - Stores Telemetry Data, Setpoints, and Events w/Timeseries Optimization
- **Rust Consumer** - Reads MQTT messages and writes data to database after propper validation
- **Flask API** - Endpoints related to authentication, greenhouse management, as well as data access
- **Frontend** - React web interface for monitoring and control (see `/frontend`)

**Data flow:**  
`ESP32 → MQTT → Consumer → Database → API → Frontend`  
`Frontend → API → Database & MQTT → ESP32` 


## Stack & Technologies

| Component       | Technology                | Reason                                                              |
|-----------------|---------------------------|---------------------------------------------------------------------|
| Microcontroller | C++ (PlatformIO)          | Industry standard for embedded systems, existing libraries          |
| API             | Python + Flask            | Lightweight, excellent IoT integration libraries                    |
| Consumer        | Rust                      | Memory safety, performance, ideal for concurrent message processing |
| Database        | PostgreSQL + TimescaleDB  | Battle proven relational DB with time-series optimization           |
| Broker          | Mosquitto                 | Lightweight, open-source MQTT broker                                |
| Orchestration   | Docker Compose            | Simple multi-container management                                   |

## Features

- Real-time telemetry collection in 60-second intervals
- Automated greenhouse control based on modifiable setpoints
- MQTT-based communication with automatic reconnection and temporary buffering of data in the ESP32
- Dual-database setup for testing and production environments
- Extensive validation and error handling
- CI pipeline with automated testing, just to learn a bit more

## Documentation

- **[Setup & Installation](docs/SETUP.md)** - Get the system running locally with Docker
- **[API Reference](docs/API.md)** - REST endpoints, authentication, and request examples
- **[Database Schema](docs/DATABASE.md)** - DB structure, relationships, and some querie examples
- **[ESP32 Firmware](docs/ESP32.md)** - Sensor integration, control logic, and MQTT protocol explanation
- **[CI Pipeline](docs/CI_PIPELINE.md)** - Explanation of the automated testing and validation uppon each commit

## Quick Start

```bash
# Clone repository
git clone <repo-url>
cd IoT-greenhouse

# Configure environment
cp .env.example .env
nano .env

# Start services
docker compose up -d

# Verify health
curl http://localhost:5000/health
```

For detailed instructions, refer to [docs/SETUP.md](docs/SETUP.md).  

## Academic Collaboration

This project is being developed in conjunction with **Oslo Metropolitan University (OsloMet)** as part of the **European Project Semester (EPS)** program.

The collaboration provides guidance, research insights, and support for the IoT and embedded systems aspects of the project, allowing us to align the prototype with academic and industry standards.

Note: This collaboration focuses on practical, hands-on experience with real-world IoT systems and their installation process, including MQTT-based telemetry, microcontroller programming, server-side data management, electronics selection, and research. For the final delivery, a real, full-scale, working prototype will be made.


## Contributing

Contributions are welcome. Please create a branch and submit a pull request for any proposed changes.

Or better yet, just tell me what is wrong, that way I can learn more correcting current mistakes in my code.

## AI Disclaimer

AI was used throught the project in many repetitive task such as generation of tests for edge cases (that I only read and veryfied after generation), as well as CI concepts, since I didn't have any knowledge prior to starting of this project about that matter.

I kept as an objective minimizing the use of AI in areas that I am interested in, but as timelines arived, some implementations had to be made by it, and then only veryfied by me.

Documentation, apart from this document is parcially done with AI. The process started with me creating a script and list of matters I wanted mentioned, then I answered many questions (mainly from Claude 4.5 LLM) so that everything is according to my tast and understanding, and then at the end I reviewed the documents and better connected them together.

## References

### Core Tools
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PlatformIO](https://platformio.org/)

### Protocols & Hardware Specifications
- [MQTT Protocol Specification](https://mqtt.org/mqtt-specification/)
- [Mosquitto MQTT Broker](https://mosquitto.org/documentation/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [ESP32 Technical Reference](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)



