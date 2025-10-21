/**
 * @file html_content.h
 * @brief HTML content for local web interface
 * 
 * Simple, elegant, minimalist design for real-time monitoring
 */

#ifndef HTML_CONTENT_H
#define HTML_CONTENT_H

const char* HTML_CONTENT = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌱 GardenAway Greenhouse</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2em;
        }
        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .sensor-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .sensor-item {
            text-align: center;
        }
        .sensor-value {
            font-size: 2em;
            font-weight: bold;
            margin: 5px 0;
        }
        .sensor-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .actuator-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        .actuator-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .status-on {
            color: #4ade80;
            font-weight: bold;
        }
        .status-off {
            color: #f87171;
            font-weight: bold;
        }
        .timestamp {
            text-align: center;
            opacity: 0.7;
            font-size: 0.85em;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 GardenAway Greenhouse</h1>
        
        <div class="card">
            <h2 style="margin-bottom: 15px;">📊 Sensor Readings</h2>
            <div class="sensor-grid">
                <div class="sensor-item">
                    <div class="sensor-label">Temperature</div>
                    <div class="sensor-value" id="temp">--</div>
                    <div class="sensor-label">°C</div>
                </div>
                <div class="sensor-item">
                    <div class="sensor-label">Humidity</div>
                    <div class="sensor-value" id="humidity">--</div>
                    <div class="sensor-label">%</div>
                </div>
                <div class="sensor-item">
                    <div class="sensor-label">Light</div>
                    <div class="sensor-value" id="light">--</div>
                    <div class="sensor-label">lux</div>
                </div>
                <div class="sensor-item">
                    <div class="sensor-label">Tank Level</div>
                    <div class="sensor-value" id="tank">--</div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2 style="margin-bottom: 15px;">⚙️ Actuator Status</h2>
            <div class="actuator-grid">
                <div class="actuator-item">
                    <span>💧 Pump</span>
                    <span id="pump-status">--</span>
                </div>
                <div class="actuator-item">
                    <span>🔥 Heating</span>
                    <span id="heating-status">--</span>
                </div>
                <div class="actuator-item">
                    <span>💡 LED</span>
                    <span id="led-status">--</span>
                </div>
                <div class="actuator-item">
                    <span>🌬️ Fan</span>
                    <span id="fan-status">--</span>
                </div>
            </div>
        </div>
        
        <div class="timestamp" id="timestamp">Last update: --</div>
    </div>
    
    <script>
        function updateData() {
            fetch('/data')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('temp').textContent = data.temperature.toFixed(1);
                    document.getElementById('humidity').textContent = data.humidity.toFixed(1);
                    document.getElementById('light').textContent = data.light.toFixed(0);
                    document.getElementById('tank').textContent = data.tank_level ? 'OK ✓' : 'LOW ✗';
                    
                    updateActuatorStatus('pump-status', data.pump);
                    updateActuatorStatus('heating-status', data.heating);
                    updateActuatorStatus('led-status', data.led);
                    updateActuatorStatus('fan-status', data.fan);
                    
                    const date = new Date(data.last_update);
                    document.getElementById('timestamp').textContent = 
                        'Last update: ' + date.toLocaleTimeString();
                })
                .catch(err => console.error('Error fetching data:', err));
        }
        
        function updateActuatorStatus(elementId, isOn) {
            const element = document.getElementById(elementId);
            element.textContent = isOn ? 'ON' : 'OFF';
            element.className = isOn ? 'status-on' : 'status-off';
        }
        
        // Update every 5 seconds
        updateData();
        setInterval(updateData, 5000);
    </script>
</body>
</html>
)rawliteral";

#endif // HTML_CONTENT_H
