#!/bin/bash
# Local test script to verify the CI health check will pass
# This runs the exact same logic as the GitHub Actions workflow

set -e

echo "🧪 Testing CI Health Check Logic Locally"
echo "========================================"
echo ""

# Ensure services are running
echo "📋 Checking services..."
if ! docker ps | grep -q gardenaway-consumer; then
    echo "Starting services..."
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres mosquitto api consumer
    echo "Waiting for services to be ready..."
    sleep 15
else
    echo "✅ Services already running"
fi

# Wait for consumer to connect to MQTT
echo ""
echo "⏳ Waiting for consumer MQTT connection..."
for i in {1..10}; do
    docker logs gardenaway-consumer 2>&1 | grep -q "MQTT connected" && {
        echo "✅ Consumer connected to MQTT"
        break
    } || sleep 2
    if [ $i -eq 10 ]; then
        echo "❌ Consumer not connected to MQTT"
        exit 1
    fi
done

# Get greenhouse ID from database
echo ""
echo "🔍 Getting test greenhouse ID..."
GREENHOUSE_ID=$(docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -tAc "SELECT id FROM greenhouse LIMIT 1" | tr -d '[:space:]')

if [ -z "$GREENHOUSE_ID" ]; then
    echo "❌ No greenhouse found in database"
    exit 1
fi

echo "✅ Using greenhouse: $GREENHOUSE_ID"

# Create test message (same format as CI)
TEST_MSG='{"device_id":"'"$GREENHOUSE_ID"'","timestamp":'"$(date +%s)"',"sequence":'"$(date +%s%N | cut -b1-13)"',"temperature":23.0,"humidity":60.0,"light":400.0,"lights_are_on":true,"tank_level":true}'

# Publish message
echo ""
echo "📨 Publishing test message..."
mosquitto_pub -h localhost -t "greenhouse/$GREENHOUSE_ID/telemetry" -m "$TEST_MSG"

# Wait and check logs (EXACT same logic as CI)
echo ""
echo "⏳ Waiting 3 seconds for processing..."
sleep 3

echo "🔍 Checking consumer logs..."
if docker logs gardenaway-consumer --since 10s 2>&1 | grep -q "Telemetry stored"; then
    echo ""
    echo "✅✅✅ SUCCESS! Consumer processed final test message successfully"
    echo ""
    echo "This means your CI health check will PASS! 🎉"
    echo ""
    
    # Show the actual log line
    echo "📋 Matching log line:"
    docker logs gardenaway-consumer --since 10s 2>&1 | grep "Telemetry stored" | tail -1
    
    exit 0
else
    echo ""
    echo "❌❌❌ FAILED! Consumer failed to process test message"
    echo ""
    echo "This means your CI will FAIL. Check the logs below:"
    echo ""
    echo "Recent consumer logs:"
    docker logs gardenaway-consumer --tail 50
    exit 1
fi
