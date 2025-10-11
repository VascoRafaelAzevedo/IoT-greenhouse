# 🌱 GardenAway IoT System

![CI](https://github.com/VascoRafaelAzevedo/IoT-greenhouse/actions/workflows/ci.yml/badge.svg?branch=main)

Welcome to the **Garden Away IoT System**! This repository contains the software for the IoT system designed for **real-time greenhouse monitoring and automation**. The focus is on embedded systems and IoT, but it also covers backend, API, database, and some microservices architecture.

---

## 📌 Overview

The project consists of several components, each running in its own container:

- **ESP32 Microcontroller**: Collects data from sensors (temperature, humidity, soil moisture, water level, light) and publishes it to MQTT topics.  
- **MQTT Broker (Mosquitto)**: Handles message distribution between devices and the server.  
- **PostgreSQL + TimescaleDB**: Stores all telemetry data, setpoints, and events.  
- **MQTT Consumer**: Reads messages from MQTT and writes them into the database.  
- **API (Flask)**: Exposes endpoints for frontend or external apps to read/write data.  
- **Frontend**: Minimal UI for testing and visualization (not included in this README, see `/frontend`).  

💡 **High-level flow of data**:  
`ESP32 → MQTT Broker → Consumer → TimescaleDB → API → Frontend / Email / WhatsApp`  
`Frontend → API → TimescaleDB & MQTT Broker → ESP32` 



---

## ⚙️ Stack & Languages

| Component       | Language/Tech             | Reasoning                                                       |
|-----------------|---------------------------|-----------------------------------------------------------------|
| Microcontroller | C++ & PlatformIO                         | Industry standard, native embedded support, efficient and low-level control        |
| API             | Python + Flask            | Lightweight, easy to start, suited for IoT integration          |
| Consumer | Rust                      | Robust and very safe, fast, and compatible with microservices   |
| Database        | PostgreSQL + TimescaleDB  | Time-series support for telemetry, reliable and scalable        |
| Broker          | Mosquitto                 | Open Source MQTT broker, lightweight, perfect to start with MQTT|
| Docker          | Docker & Compose          | Only true option to containerization and n                      |

---

## 📝 Features

- ✅ **Real-time telemetry** collection  
- ✅ **Setpoint management** and automated control  
- ✅ Communication via **MQTT**  
- ✅ **WhatsApp notifications** for critical/urgent information  
- ✅ **Microservice architecture**: API, Consumer, Worker, DB, MQTT Broker  
- ✅ **Dual database setup**: Testing DB with mock data + Production DB (clean)  

---

## 🗄️ Database Setup

The system uses **two PostgreSQL databases** in one container:

| Database | Purpose | Contains Data? |
|----------|---------|----------------|
| `greenhouse_test` | Testing/Development | ✅ Yes (2 users, 4 devices, telemetry) |
| `greenhouse` | Production/CI | ❌ No (empty tables) |

**Quick commands:**
```bash
make db-status      # Check both databases
make psql           # Connect to production DB
make psql-test      # Connect to test DB
```


## 📌 Next Steps / Sub-READMEs

To understand each component in depth, check these guides:

1. **[Setup & Installation](./docs/setup.md)** ⚡: Get the project running locally, initialize DB, MQTT, API, etc.  
2. **[Database](./docs/database.md)** 🗄️: Tables, some mock data, and UML diagrams.   
3. **[API & Flask](./docs/api.md)** 🔌: Endpoints, authentication, integration with consumer and frontend.  
4. **[WhatsApp Business Integration](./docs/whatsapp.md)** 💬: Notification logic and Set Up.  
5. **[Consumer](./docs/consumer_worker.md)** 🤖: How it operates and testing.  


---

## 🙏 Contributing

Feel free to fork the repo, submit issues, or propose improvements.  
For major changes, please **create a branch** and submit a **pull request**.

---

## 🎓 Academic Collaboration

This project is being developed in conjunction with **Oslo Metropolitan University (OsloMet)** as part of the **European Project Semester (EPS)** program.  

The collaboration provides guidance, research insights, and support for the IoT and embedded systems aspects of the project, allowing us to align the prototype with academic and industry standards.  

**Note:** This collaboration focuses on practical, hands-on experience with real-world IoT systems and their installation process, including MQTT-based telemetry, microcontroller programming, server-side data management, electronics selection, and research. For the final delivery, a real, full-scale, working prototype will be made.


## 📖 References

- [ESP32 Docs](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)  
- [Mosquitto MQTT](https://mosquitto.org/documentation/)  
- [TimescaleDB](https://docs.timescale.com/)  
- [Flask](https://flask.palletsprojects.com/)  

---


