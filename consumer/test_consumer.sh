#!/bin/bash
# Test script for the MQTT consumer

set -e

echo "🧪 Testing MQTT Consumer"
echo "======================="
echo ""

# Get greenhouse ID from test database (which has seed data)
GREENHOUSE_ID=$(docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -t -c "SELECT id FROM greenhouse LIMIT 1;" | xargs)

if [ -z "$GREENHOUSE_ID" ]; then
  echo "❌ Error: No greenhouse found in test database"
  echo "   Please ensure seed data is loaded in greenhouse_test database"
  exit 1
fi

echo "Using greenhouse ID: $GREENHOUSE_ID"
echo ""

# Create test message with sequence number
TEST_MESSAGE=$(cat <<EOF
{
  "device_id": "$GREENHOUSE_ID",
  "timestamp": $(date +%s),
  "sequence": $(date +%s%N | cut -b1-13),
  "temperature": 22.5,
  "humidity": 65.0,
  "light": 350.0,
  "light_intensity": 75.0,
  "lights_are_on": true,
  "tank_level": true,
  "irrigated_since_last_transmission": false,
  "pump_on": false
}
EOF
)

echo "Test message:"
echo "$TEST_MESSAGE" | jq .
echo ""

# Publish message
echo "📤 Publishing to MQTT..."
mosquitto_pub -h localhost -t "greenhouse/$GREENHOUSE_ID/telemetry" -m "$TEST_MESSAGE"

echo "✅ Message published successfully"
echo ""
echo "Check consumer logs to verify message was received and stored in database"
echo ""
echo "To verify in database:"
echo "  docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c \"SELECT * FROM telemetry ORDER BY time DESC LIMIT 1;\""