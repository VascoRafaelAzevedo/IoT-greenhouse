import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { ArrowLeft, Bell, Thermometer, Shield, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { settingsService, type AppSettings } from '../api/settingsService';
import { dataService } from '../api/apiService';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState({
    notifications: {
      alerts: true,
      email: true,
      push: false,
      quietHours: true,
      quietStart: '22:00',
      quietEnd: '07:00',
    },
    units: {
      temperature: 'hi',
      language: 'english',
    },
    alerts: {
      temperatureVariance: 3,
      humidityVariance: 10,
      waterLevelThreshold: 20,
      offlineTimeout: 30,
    },
    display: {
      darkMode: false,
      refreshRate: 30,
      compactView: false,
    },
  });

  const [loading, setLoading] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await settingsService.getSettings();
        if (saved) {
          setSettings(saved);
          // Apply dark mode
          if (saved.display.darkMode) {
            document.documentElement.classList.add('dark');
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        toast.error('Could not load settings');
      }
    };
    loadSettings();
  }, []);

  // --- Handlers ---
  const handleNotificationToggle = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const handleAlertChange = (key: string, value: number) => {
    setSettings(prev => ({
      ...prev,
      alerts: { ...prev.alerts, [key]: value },
    }));
  };

  const handleDisplayToggle = (key: string, value: boolean) => {
    setSettings(prev => {
      const updated = {
        ...prev,
        display: { ...prev.display, [key]: value },
      };

      if (key === 'darkMode') {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return updated;
    });
  };

  const handleUnitChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      units: { ...prev.units, [key]: value },
    }));
  };

  // --- Save Settings ---
  const handleSave = async () => {
    setLoading(true);
    try {
      await settingsService.saveSettings(settings as AppSettings);
      toast.success('Settings saved successfully!');
      if (settings.display.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // --- Export Data ---
  const handleExport = async (days?: number) => {
    try {
      setLoading(true);
      toast.info(`Exporting data${days ? ` for last ${days} days` : ''}...`);

      const csv = await dataService.exportData(days);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = days ? `greenhouse-data-${days}d.csv` : 'greenhouse-data-all.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Data exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-green-700 hover:bg-green-100"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-green-800 dark:text-green-100">Settings</h2>
          <p className="text-green-600 dark:text-green-300">
            Customize your Garden Away experience
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <Card className="border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-100 flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* toggles */}
            <div className="space-y-4">
              {[
                { key: 'alerts', label: 'Alert Notifications', desc: 'Get notified when parameters are out of range' },
                { key: 'email', label: 'Email Notifications', desc: 'Receive alerts via email' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <Label className="text-green-700 dark:text-green-300">{label}</Label>
                    <p className="text-sm text-green-600 dark:text-green-400">{desc}</p>
                  </div>
                  <Switch
                    checked={(settings.notifications as any)[key]}
                    onCheckedChange={(val) => handleNotificationToggle(key, val)}
                  />
                </div>
              ))}
            </div>

            <Separator />

            {/* Quiet hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-green-700 dark:text-green-300">Quiet Hours</Label>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Pause notifications during set hours
                  </p>
                </div>
                <Switch
                  checked={settings.notifications.quietHours}
                  onCheckedChange={(value) => handleNotificationToggle('quietHours', value)}
                />
              </div>

              {settings.notifications.quietHours && (
                <div className="grid grid-cols-2 gap-4 pl-4">
                  <div>
                    <Label className="text-green-700 dark:text-green-300">Start Time</Label>
                    <Input
                      type="time"
                      value={settings.notifications.quietStart}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, quietStart: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-green-700 dark:text-green-300">End Time</Label>
                    <Input
                      type="time"
                      value={settings.notifications.quietEnd}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          notifications: { ...prev.notifications, quietEnd: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Display Preferences */}
        <Card className="border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-100 flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-green-700 dark:text-green-300">Dark Mode</Label>
                  <p className="text-sm text-green-600 dark:text-green-400">Use dark theme</p>
                </div>
                <Switch
                  checked={settings.display.darkMode}
                  onCheckedChange={(value) => handleDisplayToggle('darkMode', value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-green-700 dark:text-green-300">Compact View</Label>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Show more information in less space
                  </p>
                </div>
                <Switch
                  checked={settings.display.compactView}
                  onCheckedChange={(value) => handleDisplayToggle('compactView', value)}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              {/* Refresh Rate */}
              <div>
                <Label className="text-green-700 dark:text-green-300">Data Refresh Rate</Label>
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">
                  How often to update readings (seconds)
                </p>
                <Select
                  value={settings.display.refreshRate.toString()}
                  onValueChange={(value) =>
                    setSettings((prev) => ({
                      ...prev,
                      display: { ...prev.display, refreshRate: parseInt(value) },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Language */}
              <div>
                <Label className="text-green-700 dark:text-green-300">Language</Label>
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">Interface language</p>
                <Select
                  value={settings.units.language}
                  onValueChange={(value) => handleUnitChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                    <SelectItem value="french">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alert Thresholds */}
        <Card className="border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-100 flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Alert Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: 'temperatureVariance',
                label: 'Temperature Variance (°C)',
                desc: 'Alert when temperature exceeds optimal range by this amount',
              },
              {
                key: 'humidityVariance',
                label: 'Humidity Variance (%)',
                desc: 'Alert when humidity exceeds optimal range by this amount',
              },
              {
                key: 'waterLevelThreshold',
                label: 'Low Water Alert (%)',
                desc: 'Alert when water level drops below this percentage',
              },
              {
                key: 'offlineTimeout',
                label: 'Offline Timeout (minutes)',
                desc: 'Alert when greenhouse is offline for this long',
              },
            ].map(({ key, label, desc }) => (
              <div key={key}>
                <Label className="text-green-700 dark:text-green-300">{label}</Label>
                <p className="text-sm text-green-600 dark:text-green-400 mb-2">{desc}</p>
                <Input
                  type="number"
                  value={(settings.alerts as any)[key]}
                  onChange={(e) => handleAlertChange(key, parseInt(e.target.value))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Units & Preferences */}
        <Card className="border-green-200 dark:border-green-700">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-100 flex items-center">
              <Thermometer className="w-5 h-5 mr-2" />
              Units & Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-green-700 dark:text-green-300">Temperature Unit</Label>
              <p className="text-sm text-green-600 dark:text-green-400 mb-2">Display temperature in</p>
              <Select
                value={settings.units.temperature}
                onValueChange={(value) => handleUnitChange('temperature', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="celsius">Celsius (°C)</SelectItem>
                  <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Data Export */}
            <div className="space-y-3">
              <h4 className="font-medium text-green-800 dark:text-green-200">Data Export</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport(7)}
                  disabled={loading}
                >
                  Export Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport(30)}
                  disabled={loading}
                >
                  Export Last 30 Days
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleExport()}
                  disabled={loading}
                >
                  Export All Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="text-green-700 border-green-200 hover:bg-green-50"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
