import type { Greenhouse, Plant } from '../types/types';

export const MOCK_PLANTS: Plant[] = [
  { id: '1', name: 'Tomatoes', optimalTemperature: { min: 18, max: 24 }, optimalHumidity: { min: 60, max: 70 }, optimalWaterLevel: { min: 70, max: 90 }, optimalSoilHumidity: { min: 70, max: 80 }, optimalLighting: { min: 80, max: 100 } },
  { id: '2', name: 'Lettuce', optimalTemperature: { min: 15, max: 20 }, optimalHumidity: { min: 50, max: 65 }, optimalWaterLevel: { min: 60, max: 80 }, optimalSoilHumidity: { min: 65, max: 75 }, optimalLighting: { min: 60, max: 80 } },
  { id: '3', name: 'Basil', optimalTemperature: { min: 20, max: 25 }, optimalHumidity: { min: 55, max: 70 }, optimalWaterLevel: { min: 65, max: 85 }, optimalSoilHumidity: { min: 60, max: 75 }, optimalLighting: { min: 75, max: 95 } },
  { id: '4', name: 'Peppers', optimalTemperature: { min: 21, max: 27 }, optimalHumidity: { min: 50, max: 70 }, optimalWaterLevel: { min: 70, max: 90 }, optimalSoilHumidity: { min: 65, max: 80 }, optimalLighting: { min: 85, max: 100 } }
];

export const MOCK_GREENHOUSES: Greenhouse[] = [
  { id: '1', name: 'Greenhouse Alpha', plant: 'Tomatoes', isOnline: true, temperature: 22, humidity: 65, waterLevel: 85, soilHumidity: 75, lighting: 90 },
  { id: '2', name: 'Greenhouse Beta', plant: 'Lettuce', isOnline: true, temperature: 18, humidity: 58, waterLevel: 70, soilHumidity: 70, lighting: 70 },
  { id: '3', name: 'Greenhouse Gamma', plant: 'Basil', isOnline: false, temperature: 16, humidity: 45, waterLevel: 40, soilHumidity: 50, lighting: 30 }
];
