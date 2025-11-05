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
            max-width: 800px;
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
        .setpoint-form {
            display: grid;
            gap: 15px;
        }
        .form-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
        }
        .form-group label {
            flex: 1;
            font-size: 0.95em;
        }
        .form-group input {
            width: 100px;
            padding: 8px;
            border: none;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-size: 1em;
            text-align: center;
        }
        .btn {
            width: 100%;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.2);
            color: #fff;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        .btn:active {
            transform: translateY(0);
        }
        .timestamp {
            text-align: center;
            opacity: 0.7;
            font-size: 0.85em;
            margin-top: 15px;
        }
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            background: rgba(74, 222, 128, 0.9);
            color: #fff;
            font-weight: bold;
            display: none;
            animation: slideIn 0.3s;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        .tab-container {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .tab {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
        }
        .tab.active {
            background: rgba(255, 255, 255, 0.3);
            font-weight: bold;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌱 GardenAway Greenhouse</h1>
        
        <div class="tab-container">
            <button class="tab active" onclick="showTab('monitor')">📊 Monitor</button>
            <button class="tab" onclick="showTab('setpoints')">⚙️ Setpoints</button>
        </div>
        
        <div id="monitor-tab" class="tab-content active">
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
                        <span>💡 LED (Auto)</span>
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
        
        <div id="setpoints-tab" class="tab-content">
            <div class="card">
                <h2 style="margin-bottom: 15px;">⚙️ Control Setpoints</h2>
                <form id="setpoint-form" class="setpoint-form">
                    <div class="form-group">
                        <label>🌡️ Temperature Min (°C):</label>
                        <input type="number" step="0.1" id="temp_min" name="temp_min" required>
                    </div>
                    <div class="form-group">
                        <label>🌡️ Temperature Max (°C):</label>
                        <input type="number" step="0.1" id="temp_max" name="temp_max" required>
                    </div>
                    <div class="form-group">
                        <label>💧 Humidity Max (%):</label>
                        <input type="number" step="0.1" id="hum_air_max" name="hum_air_max" required>
                    </div>
                    <div class="form-group">
                        <label>💡 Light Target (lux):</label>
                        <input type="number" step="1" id="light_intensity" name="light_intensity" required>
                    </div>
                    <div style="padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; font-size: 0.85em; margin: 10px 0; opacity: 0.9;">
                        ℹ️ LED strip turns ON automatically when light is below this threshold
                    </div>
                    <div class="form-group">
                        <label>🚰 Irrigation Interval (min):</label>
                        <input type="number" step="1" id="irrigation_interval_minutes" name="irrigation_interval_minutes" required>
                    </div>
                    <div class="form-group">
                        <label>⏱️ Irrigation Duration (sec):</label>
                        <input type="number" step="1" id="irrigation_duration_seconds" name="irrigation_duration_seconds" required>
                    </div>
                    <button type="submit" class="btn">💾 Save Setpoints</button>
                </form>
            </div>
        </div>
    </div>
    
    <div id="notification" class="notification"></div>
    
    <script>
        function showTab(tabName) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
            
            if (tabName === 'setpoints') {
                loadSetpoints();
            }
        }
        
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
        
        function loadSetpoints() {
            fetch('/setpoints')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('temp_min').value = data.temp_min;
                    document.getElementById('temp_max').value = data.temp_max;
                    document.getElementById('hum_air_max').value = data.hum_air_max;
                    document.getElementById('light_intensity').value = data.light_intensity;
                    document.getElementById('irrigation_interval_minutes').value = data.irrigation_interval_minutes;
                    document.getElementById('irrigation_duration_seconds').value = data.irrigation_duration_seconds;
                })
                .catch(err => console.error('Error loading setpoints:', err));
        }
        
        function showNotification(message, isError = false) {
            const notif = document.getElementById('notification');
            notif.textContent = message;
            notif.style.background = isError ? 'rgba(248, 113, 113, 0.9)' : 'rgba(74, 222, 128, 0.9)';
            notif.style.display = 'block';
            setTimeout(() => notif.style.display = 'none', 3000);
        }
        
        document.getElementById('setpoint-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const params = new URLSearchParams(formData);
            
            fetch('/setpoints', {
                method: 'POST',
                body: params
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(data => {
                showNotification('✅ Setpoints updated successfully!');
            })
            .catch(err => {
                showNotification('❌ Error: ' + err.message, true);
            });
        });
        
        // Update sensor data every 5 seconds
        updateData();
        setInterval(updateData, 5000);
    </script>
</body>
</html>
)rawliteral";

#endif // HTML_CONTENT_H
