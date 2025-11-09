import type { Greenhouse } from '../types/types';

const API_URL = import.meta.env.VITE_API_URL || ''; 


export const greenhouseService = {
  /** Fetch a single greenhouse by ID */
  async getGreenhouse(id: string): Promise<Greenhouse> {
    const response = await fetch(`${API_URL}/greenhouses/${id}`);
    if (!response.ok) throw new Error('Failed to fetch greenhouse details');
    return response.json();
  },

  /** Update greenhouse parameters manually */
  async updateGreenhouse(id: string, updates: Partial<Greenhouse>): Promise<Greenhouse> {
    const response = await fetch(`${API_URL}/greenhouses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update greenhouse');
    return response.json();
  },

  /** Get parameter history (for charts) */
  async getParameterHistory(id: string, parameter: string): Promise<{ time: string; value: number }[]> {

    const response = await fetch(`${API_URL}/greenhouses/${id}/history?parameter=${parameter}`);
    if (!response.ok) throw new Error('Failed to load parameter history');
    return response.json();
  },
};
