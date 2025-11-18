# MQTT Setpoint Testing Guide

## Overview
This guide walks you through testing the MQTT publishing functionality when updating greenhouse setpoints via the API.

## Prerequisites
- Docker and Docker Compose installed
- MQTTX installed (or `mosquitto-clients` package for CLI)
- `jq` for JSON formatting (optional but recommended)
- `curl` for API testing

## Quick Start

### Option 1: Automated Test Script
Run the provided test script that does everything for you:

```bash
./test_mqtt_setpoint.sh
```

The script will:
1. Start all containers
2. Create test data in the database
3. Show you how to configure MQTTX
4. Execute a PATCH request
5. Verify the results

### Option 2: Manual Step-by-Step Testing

## Step 1: Start All Containers

```bash
cd /home/vasco-debian/Desktop/DEV/Versioned/College/IoT-greenhouse
docker compose up -d
```

Wait for all services to be healthy (~10-15 seconds):
```bash
docker compose ps
```

Expected output:
```
NAME                    STATUS
gardenaway-backend      Up (healthy)
gardenaway-consumer     Up
gardenaway-mosquitto    Up
gardenaway-postgres     Up (healthy)
gardenaway-frontend     Up
```

## Step 2: Create Test Data in Database

### 2.1 Create a test user

```bash
docker exec -it gardenaway-postgres psql -U postgres -d greenhouse_test
```

Inside the PostgreSQL prompt:

```sql
-- Create test user
INSERT INTO app_user (email, display_name, password_hash) 
VALUES ('test@example.com', 'Test User', '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890') 
RETURNING id;

-- Save this UUID! Example: 12345678-1234-1234-1234-123456789012
```

### 2.2 Create a test greenhouse

```sql
-- Replace USER_ID with the UUID from above
INSERT INTO greenhouse (owner_id, name) 
VALUES ('USER_ID_HERE', 'Test Greenhouse MQTT') 
RETURNING id;

-- Save this UUID! Example: 87654321-4321-4321-4321-210987654321
```

### 2.3 Create initial setpoint

```sql
-- Replace GREENHOUSE_ID with the UUID from above
INSERT INTO setpoint (
  greenhouse_id, 
  plant_name,
  target_temp_min, 
  target_temp_max, 
  target_hum_air_max,
  irrigation_interval_minutes,
  irrigation_duration_seconds,
  target_light_intensity
) VALUES (
  'GREENHOUSE_ID_HERE',
  'Tomato',
  18.0,
  28.0,
  80.0,
  120,
  45,
  600.0
);

-- Exit psql
\q
```

## Step 3: Configure MQTTX to Monitor Messages

### Using MQTTX GUI

1. **Open MQTTX**
2. **Click "+ New Connection"**
3. **Configure:**
   - **Name:** GardenAway Test
   - **Host:** localhost (or your host IP)
   - **Port:** 1883
   - **Protocol:** mqtt://
   - **Client ID:** mqttx_test_123 (any unique ID)
   - **Username:** (leave empty)
   - **Password:** (leave empty)

4. **Click "Connect"**
5. **Subscribe to Topic:**
   - Click "+ New Subscription"
   - **Topic:** `greenhouse/GREENHOUSE_ID_HERE/setpoints`
     (Replace GREENHOUSE_ID_HERE with your actual greenhouse UUID)
   - **QoS:** 1
   - **Color:** Choose any color you like

### Using Command Line (Alternative)

```bash
mosquitto_sub -h localhost -p 1883 -t 'greenhouse/GREENHOUSE_ID_HERE/setpoints' -v
```

Keep this terminal open to see incoming messages.

## Step 4: Update Setpoint via API

Open a new terminal and run:

```bash
# Replace GREENHOUSE_ID_HERE with your actual greenhouse UUID
curl -X PATCH http://localhost:4000/greenhouses/GREENHOUSE_ID_HERE/setpoint \
  -H 'Content-Type: application/json' \
  -d '{
    "target_temp_min": 30.0,
    "target_temp_max": 35.0,
    "target_hum_air_max": 10.0,
    "target_light_intensity": 1000.0,
    "irrigation_interval_minutes": 1,
    "irrigation_duration_seconds": 59
  }' | jq .
```

### Expected API Response:

```json
{
  "message": "Setpoint updated successfully",
  "greenhouse_id": "87654321-4321-4321-4321-210987654321",
  "updatedFields": [
    "target_temp_min",
    "target_temp_max",
    "target_hum_air_max",
    "target_light_intensity",
    "irrigation_interval_minutes",
    "irrigation_duration_seconds"
  ],
  "updatedValues": {
    "greenhouse_id": "87654321-4321-4321-4321-210987654321",
    "plant_name": "Tomato",
    "target_temp_min": 30,
    "target_temp_max": 35,
    "target_hum_air_max": 10,
    "target_light_intensity": 1000,
    "irrigation_interval_minutes": 1,
    "irrigation_duration_seconds": 59,
    "changed_at": "2025-11-15T12:34:56.789Z"
  }
}
```

## Step 5: Verify MQTT Message in MQTTX

You should see a new message appear in MQTTX with:

**Topic:** `greenhouse/87654321-4321-4321-4321-210987654321/setpoints`

**QoS:** 1

**Payload:**
```json
{
  "target_temp_min": 30.0,
  "target_temp_max": 35.0,
  "target_hum_air_max": 10.0,
  "target_light_intensity": 1000.0,
  "irrigation_interval_minutes": 1,
  "irrigation_duration_seconds": 59
}
```

## Step 6: Verify Database Update

```bash
docker exec -it gardenaway-postgres psql -U postgres -d greenhouse_test
```

```sql
-- Replace GREENHOUSE_ID_HERE with your actual UUID
SELECT 
  target_temp_min,
  target_temp_max,
  target_hum_air_max,
  target_light_intensity,
  irrigation_interval_minutes,
  irrigation_duration_seconds,
  changed_at
FROM setpoint 
WHERE greenhouse_id = 'GREENHOUSE_ID_HERE';
```

Expected output:
```
 target_temp_min | target_temp_max | target_hum_air_max | target_light_intensity | irrigation_interval_minutes | irrigation_duration_seconds |          changed_at           
-----------------+-----------------+--------------------+------------------------+-----------------------------+-----------------------------+-------------------------------
              30 |              35 |                 10 |                   1000 |                           1 |                          59 | 2025-11-15 12:34:56.789+00
```

## Step 7: Check Backend Logs

```bash
docker logs gardenaway-backend --tail 50
```

Look for messages like:
```
✅ Connected to MQTT broker
📤 Published setpoint to greenhouse/87654321-4321-4321-4321-210987654321/setpoints: {
  target_temp_min: 30,
  target_temp_max: 35,
  target_hum_air_max: 10,
  target_light_intensity: 1000,
  irrigation_interval_minutes: 1,
  irrigation_duration_seconds: 59
}
```

## Troubleshooting

### MQTT Message Not Received

1. **Check MQTT broker is running:**
   ```bash
   docker logs gardenaway-mosquitto
   ```

2. **Check backend MQTT connection:**
   ```bash
   docker logs gardenaway-backend | grep -i mqtt
   ```
   
   You should see:
   ```
   🔌 Connecting to MQTT broker at mqtt://mosquitto:1883...
   ✅ Connected to MQTT broker
   ```

3. **Test MQTT broker connectivity:**
   ```bash
   # From host machine
   mosquitto_pub -h localhost -p 1883 -t 'test/topic' -m 'hello'
   ```

4. **Verify backend can reach MQTT:**
   ```bash
   docker exec gardenaway-backend nc -zv mosquitto 1883
   ```
   
   Expected: `mosquitto (172.x.x.x:1883) open`

### API Returns Error

1. **Check if greenhouse exists:**
   ```bash
   docker exec -it gardenaway-postgres psql -U postgres -d greenhouse_test -c \
     "SELECT id, name FROM greenhouse WHERE id = 'YOUR_GREENHOUSE_ID';"
   ```

2. **Check if setpoint exists:**
   ```bash
   docker exec -it gardenaway-postgres psql -U postgres -d greenhouse_test -c \
     "SELECT * FROM setpoint WHERE greenhouse_id = 'YOUR_GREENHOUSE_ID';"
   ```

3. **Check backend logs for errors:**
   ```bash
   docker logs gardenaway-backend --tail 100
   ```

### Database Connection Issues

```bash
# Check if postgres is healthy
docker compose ps postgres

# Check postgres logs
docker logs gardenaway-postgres --tail 50

# Test database connection
docker exec -it gardenaway-postgres psql -U postgres -l
```

## Testing Different Scenarios

### Test 1: Update Single Field
```bash
curl -X PATCH http://localhost:4000/greenhouses/YOUR_GREENHOUSE_ID/setpoint \
  -H 'Content-Type: application/json' \
  -d '{"target_temp_min": 25.0}' | jq .
```

### Test 2: Update Multiple Fields
```bash
curl -X PATCH http://localhost:4000/greenhouses/YOUR_GREENHOUSE_ID/setpoint \
  -H 'Content-Type: application/json' \
  -d '{
    "target_temp_min": 22.0,
    "target_temp_max": 28.0,
    "irrigation_interval_minutes": 90
  }' | jq .
```

### Test 3: Change Plant Type
```bash
curl -X PATCH http://localhost:4000/greenhouses/YOUR_GREENHOUSE_ID/setpoint \
  -H 'Content-Type: application/json' \
  -d '{"plant": "Cucumber"}' | jq .
```

## Cleanup Test Data

```bash
docker exec -it gardenaway-postgres psql -U postgres -d greenhouse_test
```

```sql
-- Delete test greenhouse (will cascade delete setpoint)
DELETE FROM greenhouse WHERE name = 'Test Greenhouse MQTT';

-- Delete test user
DELETE FROM app_user WHERE email = 'test@example.com';

-- Verify cleanup
SELECT COUNT(*) FROM greenhouse;
SELECT COUNT(*) FROM setpoint;
```

## Quick Reference

### Important UUIDs
- **User ID:** `________________________`
- **Greenhouse ID:** `________________________`

### MQTT Topic Format
```
greenhouse/{greenhouse_id}/setpoints
```

### API Endpoint
```
PATCH http://localhost:4000/greenhouses/{greenhouse_id}/setpoint
```

### Payload Format
```json
{
  "target_temp_min": float,
  "target_temp_max": float,
  "target_hum_air_max": float,
  "target_light_intensity": float,
  "irrigation_interval_minutes": integer,
  "irrigation_duration_seconds": integer
}
```

## Notes

- **QoS Level:** Messages are published with QoS 1 (at least once delivery)
- **Database:** Tests use `greenhouse_test` database
- **MQTT Broker:** Mosquitto on port 1883
- **API:** Node.js backend on port 4000
- **Persistence:** MQTT messages are not persisted (use retained flag if needed)
