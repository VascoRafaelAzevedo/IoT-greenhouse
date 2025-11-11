import { apiClient } from './apiClient';
import type { Greenhouse, Plant, CreateGreenhouseDTO, UpdateGreenhouseDTO } from '../types/types';

export const dataService = {
  async getGreenhouses(): Promise<Greenhouse[]> {
    const res = await apiClient.get<Greenhouse[]>('/greenhouses');
    console.log(res.data)
    return res.data;
  },
  async getGreenhouse(id: string): Promise<Greenhouse> {
    try {
      const res = await apiClient.get<Greenhouse>(`/greenhouses/${id}`);
      return res.data;
    } catch (err) {
      console.error('Failed to fetch greenhouse details', err);
      throw new Error('Failed to fetch greenhouse details');
    }
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
    /** Get parameter history (for charts) */
  async getParameterHistory(id: string, parameter: string): Promise<{ time: string; value: number }[]> {
    const { data } = await apiClient.get<{ time: string; value: number }[]>(`/greenhouses/${id}/history`, {
      params: { parameter },
    });
    return data;
  },
  async exportData(days?: number): Promise<string> {
    // Fetch CSV from API
    const response = await fetch(`api/export${days ? `?days=${days}` : ''}`);
    if (!response.ok) throw new Error('Failed to export data');
    return await response.text();
  },
};
