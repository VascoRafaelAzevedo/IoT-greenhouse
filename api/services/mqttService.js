import mqtt from "mqtt";
import dotenv from "dotenv";

dotenv.config();

class MqttService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    const MQTT_HOST = process.env.MQTT_HOST || "localhost";
    const MQTT_PORT = process.env.MQTT_PORT || 1883;
    const mqttUrl = `mqtt://${MQTT_HOST}:${MQTT_PORT}`;

    console.log(`🔌 Connecting to MQTT broker at ${mqttUrl}...`);

    this.client = mqtt.connect(mqttUrl, {
      clientId: `api_${Math.random().toString(16).slice(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
    });

    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("✅ Connected to MQTT broker");
    });

    this.client.on("error", (error) => {
      console.error("❌ MQTT connection error:", error);
      this.isConnected = false;
    });

    this.client.on("close", () => {
      this.isConnected = false;
      console.log("⚠️  MQTT connection closed");
    });

    this.client.on("reconnect", () => {
      console.log("🔄 Reconnecting to MQTT broker...");
    });
  }

  /**
   * Publish setpoint changes to MQTT
   * @param {string} greenhouseId - The greenhouse UUID
   * @param {object} setpoint - The setpoint values
   */
  publishSetpoint(greenhouseId, setpoint) {
    if (!this.client || !this.isConnected) {
      console.error("❌ MQTT client not connected. Cannot publish setpoint.");
      return false;
    }

    const topic = `greenhouse/${greenhouseId}/setpoints`;
    
    // Extract only the relevant fields for MQTT message
    const payload = {
      target_temp_min: setpoint.target_temp_min,
      target_temp_max: setpoint.target_temp_max,
      target_hum_air_max: setpoint.target_hum_air_max,
      target_light_intensity: setpoint.target_light_intensity,
      irrigation_interval_minutes: setpoint.irrigation_interval_minutes,
      irrigation_duration_seconds: setpoint.irrigation_duration_seconds,
    };

    const message = JSON.stringify(payload);

    this.client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        console.error(`❌ Error publishing to ${topic}:`, error);
      } else {
        console.log(`📤 Published setpoint to ${topic}:`, payload);
      }
    });

    return true;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log("🔌 Disconnected from MQTT broker");
    }
  }
}

// Export singleton instance
export const mqttService = new MqttService();
