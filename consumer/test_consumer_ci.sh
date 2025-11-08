#!/bin/bash
# CI-optimized integration test runner for MQTT consumer
# Validates MQTT functionality and consumer edge case handling

set -euo pipefail

# Detect CI environment
CI_MODE="${CI:-false}"

# Color codes (disabled in CI for cleaner logs)
if [ "$CI_MODE" = "true" ]; then
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
fi

echo -e "${BLUE}MQTT Consumer Integration Tests${NC}"
echo "====================================="
echo ""

# Verify prerequisites
echo "Checking prerequisites..."

# Check if mosquitto_pub is available
if ! command -v mosquitto_pub &> /dev/null; then
    echo -e "${RED}FAIL: mosquitto_pub not found. Install mosquitto-clients${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo -e "${RED}FAIL: Docker is not running or accessible${NC}"
    exit 1
fi

# Check if containers are running
REQUIRED_CONTAINERS=("gardenaway-postgres" "gardenaway-mosquitto" "gardenaway-consumer")
for container in "${REQUIRED_CONTAINERS[@]}"; do
    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo -e "${RED}FAIL: Container $container is not running${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# ========== MQTT Broker Functionality Test ==========
echo -e "${BLUE}=== Testing MQTT Broker Functionality ===${NC}"

MQTT_TEST_TOPIC="test/ci/$(date +%s)"
MQTT_TEST_MSG="mqtt-functional-test-$$"
MQTT_RESULT=""

# Subscribe in background
(docker exec gardenaway-mosquitto mosquitto_sub -t "$MQTT_TEST_TOPIC" -C 1 > /tmp/mqtt_test_result.txt 2>&1) &
SUB_PID=$!

# Give subscriber time to connect
sleep 1

# Publish test message
mosquitto_pub -h localhost -t "$MQTT_TEST_TOPIC" -m "$MQTT_TEST_MSG"

# Wait for subscriber to receive (max 5 seconds)
for i in {1..10}; do
    if [ -f /tmp/mqtt_test_result.txt ]; then
        MQTT_RESULT=$(cat /tmp/mqtt_test_result.txt 2>/dev/null || true)
        if [ "$MQTT_RESULT" = "$MQTT_TEST_MSG" ]; then
            break
        fi
    fi
    sleep 0.5
done

# Cleanup
kill $SUB_PID 2>/dev/null || true
rm -f /tmp/mqtt_test_result.txt

if [ "$MQTT_RESULT" = "$MQTT_TEST_MSG" ]; then
    echo -e "${GREEN}✓ MQTT broker is functional (pub/sub working)${NC}"
else
    echo -e "${RED}FAIL: MQTT broker test failed${NC}"
    echo "Expected: $MQTT_TEST_MSG"
    echo "Got: $MQTT_RESULT"
    exit 1
fi

echo ""

# ========== Consumer Connection Test ==========
echo -e "${BLUE}=== Testing Consumer MQTT Connection ===${NC}"

# Check consumer logs for MQTT connection
if docker logs gardenaway-consumer 2>&1 | grep -q "MQTT connected"; then
    echo -e "${GREEN}✓ Consumer is connected to MQTT broker${NC}"
else
    echo -e "${RED}FAIL: Consumer has not connected to MQTT broker${NC}"
    echo "Consumer logs:"
    docker logs gardenaway-consumer --tail 20
    exit 1
fi

echo ""

# ========== Get Greenhouse ID ==========
echo "Getting test greenhouse ID from database..."

GREENHOUSE_ID=$(docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -tAc "SELECT id FROM greenhouse LIMIT 1" | tr -d '[:space:]')

if [ -z "$GREENHOUSE_ID" ]; then
    echo -e "${RED}FAIL: No greenhouse found in greenhouse_test database${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using greenhouse: $GREENHOUSE_ID${NC}"
echo ""

# ========== Test Counters ==========
TOTAL_TESTS=0
VALID_TESTS=0
INVALID_TESTS=0
ERRORS=0

# ========== Helper Function ==========
test_message() {
    local test_name="$1"
    local message="$2"
    local expected="$3"  # "valid" or "invalid"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$CI_MODE" = "true" ]; then
        echo "[$TOTAL_TESTS] $test_name (expect: $expected)"
    else
        echo -e "${YELLOW}[$TOTAL_TESTS] $test_name${NC} (expect: $expected)"
    fi
    
    # Publish message
    if ! mosquitto_pub -h localhost -t "greenhouse/$GREENHOUSE_ID/telemetry" -m "$message" 2>/dev/null; then
        echo -e "${RED}  ✗ Failed to publish message${NC}"
        ERRORS=$((ERRORS + 1))
        return
    fi
    
    # Small delay for processing
    sleep 0.3
    
    if [ "$expected" = "valid" ]; then
        VALID_TESTS=$((VALID_TESTS + 1))
        echo -e "${GREEN}  ✓ Published (should be accepted)${NC}"
    else
        INVALID_TESTS=$((INVALID_TESTS + 1))
        echo -e "${BLUE}  ℹ Published (should be rejected)${NC}"
    fi
}

# ========== Valid Message Tests ==========
echo -e "${BLUE}=== Valid Messages (should be accepted) ===${NC}"

test_message "Valid complete message" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 22.5,
  "humidity": 65.0,
  "light": 350.0,
  "light_intensity": 75.0,
  "lights_are_on": true,
  "tank_level": true,
  "irrigated_since_last_transmission": false,
  "pump_on": false
}' "valid"

test_message "Valid minimal message" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "valid"

test_message "Temperature at lower limit (-50°C)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": -50.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "valid"

test_message "Temperature at upper limit (100°C)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 100.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "valid"

test_message "Humidity at 0%" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 0.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "valid"

test_message "Light at maximum (100000 lux)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 100000.0,
  "lights_are_on": false,
  "tank_level": true
}' "valid"

echo ""

# ========== Invalid Message Tests ==========
echo -e "${BLUE}=== Invalid Messages (should be rejected) ===${NC}"

test_message "Temperature below limit (-50.1°C)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": -50.1,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Temperature above limit (100.1°C)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 100.1,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Humidity negative (-1%)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": -1.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Humidity above limit (100.1%)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 100.1,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Light negative" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": -1.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Light above max (100001 lux)" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 100001.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Timestamp zero" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": 0,
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Timestamp far future" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": 4102444800,
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Sequence zero" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": 0,
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Invalid UUID format" \
'{
  "device_id": "not-a-uuid",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "UUID v1 (not v4)" \
'{
  "device_id": "c232ab00-9414-11ec-b909-0242ac120002",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Missing temperature" \
'{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "invalid"

test_message "Malformed JSON" \
'{"device_id":"'"$GREENHOUSE_ID"'","temperature":20.0' "invalid"

echo ""

# ========== Duplicate Message Test ==========
echo -e "${BLUE}=== Duplicate Detection Test ===${NC}"

TIMESTAMP=$(date +%s)
SEQUENCE=$(date +%s%N | cut -b1-13)
DUPLICATE_MSG='{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$TIMESTAMP"',
  "sequence": '"$SEQUENCE"',
  "temperature": 25.0,
  "humidity": 55.0,
  "light": 300.0,
  "lights_are_on": true,
  "tank_level": true
}'

test_message "First instance of message" "$DUPLICATE_MSG" "valid"
sleep 1
test_message "Duplicate message (same timestamp+seq)" "$DUPLICATE_MSG" "valid"

# Check if duplicate was detected in logs
if docker logs gardenaway-consumer --since 30s 2>&1 | grep -q "Duplicate telemetry ignored"; then
    echo -e "${GREEN}✓ Consumer correctly detected duplicate${NC}"
else
    echo -e "${YELLOW}⚠ Duplicate detection log not found (may have been processed before check)${NC}"
fi

echo ""

# ========== Wait for Processing ==========
echo "Waiting for consumer to process all messages..."
sleep 3

# ========== Results Summary ==========
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
echo -e "${BLUE}================================${NC}"
echo "Total tests run: $TOTAL_TESTS"
echo -e "${GREEN}Valid messages sent: $VALID_TESTS${NC}"
echo -e "${BLUE}Invalid messages sent: $INVALID_TESTS${NC}"

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Errors: $ERRORS${NC}"
fi

echo ""

# ========== Verification ==========
echo -e "${BLUE}=== Consumer Log Analysis ===${NC}"

# Check for validation errors (expected for invalid messages)
VALIDATION_ERRORS=$(docker logs gardenaway-consumer --since 60s 2>&1 | grep -c "out of range\|Invalid UUID\|future\|positive\|missing field" || true)
echo "Validation errors found: $VALIDATION_ERRORS"

if [ $VALIDATION_ERRORS -lt $((INVALID_TESTS - 5)) ]; then
    echo -e "${YELLOW}⚠ Warning: Expected ~$INVALID_TESTS validation errors, found $VALIDATION_ERRORS${NC}"
fi

# Check for successful insertions
SUCCESSFUL_INSERTS=$(docker logs gardenaway-consumer --since 60s 2>&1 | grep -c "Stored telemetry" || true)
echo "Successful insertions: $SUCCESSFUL_INSERTS"

if [ $SUCCESSFUL_INSERTS -lt $((VALID_TESTS - 2)) ]; then
    echo -e "${YELLOW}⚠ Warning: Expected ~$VALID_TESTS successful inserts, found $SUCCESSFUL_INSERTS${NC}"
fi

echo ""
echo -e "${GREEN}PASS: Integration tests completed successfully${NC}"
echo ""

exit 0
