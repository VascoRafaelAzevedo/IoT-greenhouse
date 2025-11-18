#!/bin/bash
# Simple MQTT Test - Just run this!

echo "🚀 MQTT Setpoint Test Starting..."
echo ""

# Clean up first
echo "🧹 Cleaning old test data..."
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "DELETE FROM greenhouse WHERE name = 'Test GH'; DELETE FROM app_user WHERE email = 'test@example.com';" > /dev/null 2>&1

# Create test user via API (this will hash the password properly)
echo "📝 Creating test user via API..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"testpass123","displayName":"Test User"}')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to register user. Trying to login instead..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"test@example.com","password":"testpass123"}')
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
  USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
fi

echo "✅ User: $USER_ID"
echo "🔑 Token: ${TOKEN:0:20}..."

# Create greenhouse  
echo "🏠 Creating greenhouse..."
GH_ID=$(docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -qtAX -c "INSERT INTO greenhouse (owner_id, name) VALUES ('$USER_ID', 'Test GH') RETURNING id;")
echo "✅ Greenhouse: $GH_ID"

# Create setpoint
echo "⚙️  Creating setpoint..."
docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c "INSERT INTO setpoint (greenhouse_id, plant_name, target_temp_min, target_temp_max, target_hum_air_max, irrigation_interval_minutes, irrigation_duration_seconds, target_light_intensity) VALUES ('$GH_ID', 'Tomato', 18, 28, 80, 120, 45, 600);" > /dev/null
echo "✅ Setpoint created"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 SUBSCRIBE TO THIS IN MQTTX:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Topic: greenhouse/$GH_ID/setpoints"
echo "Host: localhost:1883"
echo "QoS: 1"
echo ""
echo "Or in terminal:"
echo "mosquitto_sub -h localhost -p 1883 -t 'greenhouse/$GH_ID/setpoints' -v"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press ENTER when ready to send the update..."
read

echo ""
echo "🚀 Sending PATCH request..."
curl -s -X PATCH http://localhost:4000/greenhouses/$GH_ID/setpoint \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"target_temp_min":30,"target_temp_max":35,"target_hum_air_max":10,"target_light_intensity":1000,"irrigation_interval_minutes":1,"irrigation_duration_seconds":59}' | jq .

echo ""
echo "✅ Done! Check MQTTX for the message!"
echo ""
echo "Cleanup: docker exec gardenaway-postgres psql -U postgres -d greenhouse_test -c \"DELETE FROM greenhouse WHERE id = '$GH_ID';\""
