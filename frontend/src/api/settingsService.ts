import type { AppSettings } from '../types/types';

const API_URL = import.meta.env.VITE_API_URL || ''; 

export const settingsService = {
  async getSettings(): Promise<AppSettings> {
    // Fetch from API
    const response = await fetch(`${API_URL}/settings`);
    if (!response.ok) throw new Error('Failed to load settings');
    return response.json();
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    // Save to API
    const response = await fetch(`${API_URL}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (!response.ok) throw new Error('Failed to save settings');
  },
};
