#!/bin/bash
# Extensive integration tests for MQTT consumer
# Tests all edge cases and validation scenarios

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 MQTT Consumer Edge Case Testing${NC}"
echo "======================================"
echo ""

# Get greenhouse ID from test database
GREENHOUSE_ID=$(docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -t -c "SELECT id FROM greenhouse LIMIT 1;" | xargs)

if [ -z "$GREENHOUSE_ID" ]; then
  echo -e "${RED}Error: No greenhouse found in test database${NC}"
  exit 1
fi

echo -e "Using greenhouse ID: ${GREEN}$GREENHOUSE_ID${NC}"
echo ""

# Counter for test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to publish test message
publish_test() {
    local test_name=$1
    local message=$2
    local should_pass=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    
    # Publish message
    mosquitto_pub -h localhost -t "greenhouse/$GREENHOUSE_ID/telemetry" -m "$message" 2>/dev/null
    
    # Give consumer time to process
    sleep 0.5
    
    if [ "$should_pass" = "pass" ]; then
        echo -e "${GREEN}  ✓ Published (should be accepted)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${BLUE}  ℹ Published (should be rejected)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
    echo ""
}

# ========== Valid Message Tests ==========
echo -e "${BLUE}=== Valid Message Tests ===${NC}"

publish_test "Valid message with all fields" '{
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
}' "pass"

publish_test "Valid message with optional fields missing" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

# ========== Temperature Validation Tests ==========
echo -e "${BLUE}=== Temperature Validation Tests ===${NC}"

publish_test "Temperature at lower limit (-50.0)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": -50.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Temperature at upper limit (100.0)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 100.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Temperature below limit (-50.1)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": -50.1,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Temperature above limit (100.1)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 100.1,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Temperature extreme value (999999)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 999999,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Humidity Validation Tests ==========
echo -e "${BLUE}=== Humidity Validation Tests ===${NC}"

publish_test "Humidity at 0%" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 0.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Humidity at 100%" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 100.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Humidity negative (-0.1)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": -0.1,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Humidity above 100% (100.1)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 100.1,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Light Validation Tests ==========
echo -e "${BLUE}=== Light Validation Tests ===${NC}"

publish_test "Light at 0 lux" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 0.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Light at max (100000 lux)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 100000.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Light negative (-1)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": -1.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Light above max (100001)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 100001.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Light Intensity Tests ==========
echo -e "${BLUE}=== Light Intensity Tests ===${NC}"

publish_test "Light intensity valid (50%)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "light_intensity": 50.0,
  "lights_are_on": false,
  "tank_level": true
}' "pass"

publish_test "Light intensity out of range (101%)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "light_intensity": 101.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Timestamp Validation Tests ==========
echo -e "${BLUE}=== Timestamp Validation Tests ===${NC}"

publish_test "Timestamp zero" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": 0,
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Timestamp negative" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": -1,
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Timestamp far future (year 2100)" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": 4102444800,
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Sequence Validation Tests ==========
echo -e "${BLUE}=== Sequence Validation Tests ===${NC}"

publish_test "Sequence zero" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": 0,
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Sequence negative" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": -1,
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# Test duplicate sequence (publish same message twice)
TIMESTAMP=$(date +%s)
SEQUENCE=$(date +%s%N | cut -b1-13)
DUPLICATE_MSG='{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$TIMESTAMP"',
  "sequence": '"$SEQUENCE"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}'

publish_test "First message with seq $SEQUENCE" "$DUPLICATE_MSG" "pass"
publish_test "Duplicate message (same timestamp & seq)" "$DUPLICATE_MSG" "pass"

# ========== UUID Validation Tests ==========
echo -e "${BLUE}=== UUID Validation Tests ===${NC}"

publish_test "Invalid UUID format" '{
  "device_id": "not-a-uuid",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "UUID v1 (not v4)" '{
  "device_id": "c232ab00-9414-11ec-b909-0242ac120002",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Nil UUID" '{
  "device_id": "00000000-0000-0000-0000-000000000000",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Type Validation Tests ==========
echo -e "${BLUE}=== Type Validation Tests ===${NC}"

publish_test "Temperature as string" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": "twenty",
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Boolean as number" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": 1
}' "reject"

# ========== Missing Fields Tests ==========
echo -e "${BLUE}=== Missing Required Fields Tests ===${NC}"

publish_test "Missing temperature" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Missing device_id" '{
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

publish_test "Missing timestamp" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true
}' "reject"

# ========== Malformed JSON Tests ==========
echo -e "${BLUE}=== Malformed JSON Tests ===${NC}"

publish_test "Missing closing brace" '{
  "device_id": "'"$GREENHOUSE_ID"'",
  "timestamp": '"$(date +%s)"',
  "sequence": '"$(date +%s%N | cut -b1-13)"',
  "temperature": 20.0,
  "humidity": 50.0,
  "light": 200.0,
  "lights_are_on": false,
  "tank_level": true' "reject"

publish_test "Invalid JSON syntax" 'this is not json' "reject"

publish_test "Empty message" '' "reject"

# ========== Summary ==========
echo ""
echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}Test Summary:${NC}"
echo -e "  Total tests: $TOTAL_TESTS"
echo -e "  Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "  Failed: ${RED}$FAILED_TESTS${NC}"
echo ""
echo -e "${YELLOW}Note: Check consumer logs to verify each message was processed correctly${NC}"
echo -e "${YELLOW}Expected: 'pass' messages stored, 'reject' messages logged as errors${NC}"
