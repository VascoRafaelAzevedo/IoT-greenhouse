import { apiClient } from './apiClient';
import type { Greenhouse, Plant, CreateGreenhouseDTO, UpdateGreenhouseDTO } from '../types/types';

export const dataService = {
  async getGreenhouses(): Promise<Greenhouse[]> {
    const res = await apiClient.get<Greenhouse[]>('/greenhouses');
    return res.data;
  },

  async getPlants(): Promise<Plant[]> {
    const res = await apiClient.get<Plant[]>('/plants');
    console.log(res.data)
    return res.data;
  },

  async addGreenhouse(payload: CreateGreenhouseDTO): Promise<Greenhouse> {
    const res = await apiClient.post<Greenhouse>('/greenhouses', payload);
    return res.data;
  },

  async updateGreenhouse(id: string, updates: UpdateGreenhouseDTO): Promise<Greenhouse> {
    const res = await apiClient.put<Greenhouse>(`/greenhouses/${id}`, updates);
    return res.data;
  },

  async deleteGreenhouse(id: string): Promise<void> {
    await apiClient.delete(`/greenhouses/${id}`);
  },
  async exportData(days?: number): Promise<string> {
    // Fetch CSV from API
    const response = await fetch(`api/export${days ? `?days=${days}` : ''}`);
    if (!response.ok) throw new Error('Failed to export data');
    return await response.text();
  },
};
