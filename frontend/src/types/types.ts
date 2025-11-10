export interface Greenhouse {
  id: string;
  name: string;
  plant: string;
  isOnline: boolean;
  temperature: number;
  humidity: number;
  waterLevel: number;
  soilHumidity: number;
  lighting: number;
}

export interface Plant {
  id: string;
  name: string;
  optimalTemperature: { min: number; max: number };
  optimalHumidity: { min: number; max: number };
  optimalWaterLevel: { min: number; max: number };
  optimalSoilHumidity: { min: number; max: number };
  optimalLighting: { min: number; max: number };
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