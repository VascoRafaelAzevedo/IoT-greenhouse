export interface Greenhouse {
  id: string;
  name: string;
  plant: string;
  isOnline: boolean;
  temperature: number;
  humidity: number;
  waterLevel: number;
  lighting: number;
  setpoint: {
    target_temp_min: number;
    target_temp_max: number;
    target_hum_air_max: number;
    irrigation_interval_minutes: number;
    irrigation_duration_seconds: number;
    target_light_intensity: number; 
  }
}

export interface Plant {
  id: string;
  name: string;
  description:string
  optimalTemperature: {min:number,max:number};
  optimalHumidity: number;
  irrigationInterval: number;
  irrigationDurationSec: number;
  optimalLighting: number;
}

export interface AppSettings {
  notifications: {
    alerts: boolean;
    email: boolean;
    push: boolean;
    quietHours: boolean;
    quietStart: string;
    quietEnd: string;
  };
  units: {
    temperature: 'celsius' | 'fahrenheit' ;
    language: 'english' | 'spanish' | 'french';
  };
  alerts: {
    temperatureVariance: number;
    humidityVariance: number;
    waterLevelThreshold: number;
    offlineTimeout: number;
  };
  display: {
    darkMode: boolean;
    refreshRate: number;
    compactView: boolean;
  };
}
export type View = 'dashboard' | 'add-greenhouse' | 'greenhouse-detail' | 'settings' | 'plant-library';

/** For POST requests */
export type CreateGreenhouseDTO = Omit<Greenhouse, 'id'>;

/** For PATCH/PUT requests */
export type UpdateGreenhouseDTO = Partial<Greenhouse>;