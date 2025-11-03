import paho.mqtt.client as mqtt
from paho.mqtt.client import CallbackAPIVersion
import json
import logging
from .database import Config

logger = logging.getLogger(__name__)


class MQTTClient:
    """MQTT Client for publishing messages to broker"""
    
    def __init__(self):
        self.client = None
        self.connected = False
        
    def connect(self):
        """Connect to MQTT broker"""
        try:
            self.client = mqtt.Client(CallbackAPIVersion.VERSION2)
            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            
            self.client.connect(Config.MQTT_BROKER, Config.MQTT_PORT, 60)
            self.client.loop_start()
            
            logger.info(f"Connecting to MQTT broker at {Config.MQTT_BROKER}:{Config.MQTT_PORT}")
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            self.connected = False
    
    def _on_connect(self, client, userdata, flags, reason_code, properties):
        """Callback for when connected to broker (VERSION2 signature)"""
        if reason_code == 0:
            self.connected = True
            logger.info("Connected to MQTT broker successfully")
        else:
            self.connected = False
            logger.error(f"Failed to connect to MQTT broker, reason code: {reason_code}")
    
    def _on_disconnect(self, client, userdata, flags, reason_code, properties):
        """Callback for when disconnected from broker (VERSION2 signature)"""
        self.connected = False
        if reason_code != 0:
            logger.warning(f"Unexpected disconnection from MQTT broker, reason code: {reason_code}")
    
    def publish_setpoint(self, greenhouse_id: str, setpoint_data: dict):
        """
        Publish setpoint to MQTT topic for ESP32 to receive.
        
        Topic: greenhouse/{greenhouse_id}/setpoints
        
        Args:
            greenhouse_id: UUID of greenhouse
            setpoint_data: Dict with setpoint values
        """
        if not self.connected:
            logger.warning("MQTT client not connected, attempting to connect...")
            self.connect()
            
        if not self.connected:
            logger.error("Cannot publish setpoint - MQTT client not connected")
            return False
        
        topic = f"greenhouse/{greenhouse_id}/setpoints"
        
        try:
            # Convert datetime to ISO string if present
            payload = setpoint_data.copy()
            if 'changed_at' in payload:
                payload['changed_at'] = payload['changed_at'].isoformat() if hasattr(payload['changed_at'], 'isoformat') else str(payload['changed_at'])
            
            # Publish message
            message = json.dumps(payload)
            result = self.client.publish(topic, message, qos=Config.MQTT_QOS)
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published setpoint to {topic}")
                return True
            else:
                logger.error(f"Failed to publish setpoint to {topic}, rc: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Error publishing setpoint: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MQTT broker"""
        if self.client:
            self.client.loop_stop()
            self.client.disconnect()
            self.connected = False
            logger.info("Disconnected from MQTT broker")


# Global MQTT client instance
mqtt_client = MQTTClient()


def init_mqtt():
    """Initialize MQTT client connection"""
    mqtt_client.connect()


def get_mqtt_client():
    """Get global MQTT client instance"""
    return mqtt_client
