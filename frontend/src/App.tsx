import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { GreenhouseDetail } from './components/GreenhouseDetail';
import { Settings } from './components/Settings';
import { PlantLibrary } from './components/PlantLibrary';
import { Button } from './components/ui/button';
import { Toaster, toast } from 'sonner';
import { Home, Settings as SettingsIcon, Book, Menu, X } from 'lucide-react';
import { dataService } from './api/apiService';
import { settingsService } from './api/settingsService';
import type { Greenhouse, Plant, View, AppSettings } from './types/types';
import { Loading } from './components/ui/loading';
import { ErrorState } from './components/ui/error-state';
import { GlobalLoader } from './components/ui/global-loader';
import { loginService } from './api/loginService';
import { Auth } from './components/Auth';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedGreenhouseId, setSelectedGreenhouseId] = useState('');
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loading/error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Dark mode / settings
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);

  // Login state
  const [isLoggedIn, setIsLoggedIn] = useState(loginService.isAuthenticated());

  // Ref to prevent overlapping requests
  const isLoadingRef = useRef(false);

  // Ref to track previous greenhouses for alerts
  const prevGreenhousesRef = useRef<Greenhouse[]>([]);

  // Load data with in-flight guard
  const loadData = async (silent = false) => {
    if (isLoadingRef.current) return; // skip if already fetching
    isLoadingRef.current = true;

    try {
      if (!silent) setLoading(true);
      setError(null);

      const [ghData, plantData] = await Promise.all([
        dataService.getGreenhouses(),
        dataService.getPlants(),
      ]);

      setGreenhouses(ghData);
      setPlants(plantData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Data load error:', err);
      setError('Failed to load data. Please check your connection or try again.');
    } finally {
      if (!silent) setLoading(false);
      isLoadingRef.current = false;
    }
  };

  // Load settings
  const loadSettings = async () => {
    try {
      const s = await settingsService.getSettings();
      setAppSettings(s);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  // Login / Register handlers
  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    try {
      const { token } = await loginService.login(username, password);
      if (token) {
        loginService.attachAuthHeader();
        setIsLoggedIn(true); // triggers data/settings load
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    }
  };

  const handleRegister = async ({ username, password, name }: { username: string; password: string; name: string }) => {
    try {
      const { token } = await loginService.register(username, password, name);
      if (token) {
        loginService.attachAuthHeader();
        setIsLoggedIn(true); // triggers data/settings load
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    loginService.logout();
    setIsLoggedIn(false);
    setGreenhouses([]);
    setPlants([]);
  };

  // Auto-refresh every 15 minutes
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => loadData(true), 900000); // 900000ms = 15min
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Initial load on login
  useEffect(() => {
    if (!isLoggedIn) return;
    loginService.attachAuthHeader();
    loadData();
    loadSettings();
  }, [isLoggedIn]);

  // Dark mode
  useEffect(() => {
    if (appSettings?.display.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [appSettings?.display.darkMode]);

  // Alerts based on plant optimal values, only if greenhouse data changed
  useEffect(() => {
    if (!isLoggedIn) return;
    const prev = prevGreenhousesRef.current;
    if (JSON.stringify(prev) === JSON.stringify(greenhouses)) return;

    greenhouses.forEach((greenhouse) => {
      const plant = plants.find((p) => p.name === greenhouse.plant);
      if (!plant || !greenhouse.isOnline) return;

      const alerts: string[] = [];

      if (
        greenhouse.temperature < plant.optimalTemperature.min ||
        greenhouse.temperature > plant.optimalTemperature.max
      ) {
        alerts.push(
          `Temperature ${greenhouse.temperature}°C (optimal: ${plant.optimalTemperature.min}-${plant.optimalTemperature.max}°C)`
        );
      }

      if (
        greenhouse.humidity < plant.optimalHumidity - 5 ||
        greenhouse.humidity > plant.optimalHumidity + 5
      ) {
        alerts.push(
          `Humidity ${greenhouse.humidity}% (optimal: ${plant.optimalHumidity - 5}-${plant.optimalHumidity + 5}%)`
        );
      }

      if (
        greenhouse.lighting < plant.optimalLighting - 10 ||
        greenhouse.lighting > plant.optimalLighting + 10
      ) {
        alerts.push(
          `Lighting ${greenhouse.lighting} (optimal: ${plant.optimalLighting - 10}-${plant.optimalLighting + 10})`
        );
      }

      if (alerts.length > 0) {
        toast.error(`${greenhouse.name}: ${alerts[0]}`, {
          description:
            alerts.length > 1 ? `+${alerts.length - 1} more issues` : undefined,
          duration: 8000,
        });
      }
    });

    prevGreenhousesRef.current = greenhouses;
  }, [greenhouses, plants, isLoggedIn]);

  // CRUD Actions
  const updateGreenhouse = async (id: string, updates: Partial<Greenhouse>) => {
    setGlobalLoading('Updating greenhouse...');
    try {
      const updated = await dataService.updateGreenhouse(id, updates);
      setGreenhouses((prev) => prev.map((gh) => (gh.id === id ? updated : gh)));
      toast.success('Greenhouse updated');
    } catch {
      toast.error('Failed to update greenhouse');
    } finally {
      setGlobalLoading(null);
    }
  };

  const deleteGreenhouse = async (id: string) => {
    setGlobalLoading('Deleting greenhouse...');
    try {
      await dataService.deleteGreenhouse(id);
      setGreenhouses((prev) => prev.filter((gh) => gh.id !== id));
      toast.success('Greenhouse removed');
    } catch {
      toast.error('Failed to delete greenhouse');
    } finally {
      setGlobalLoading(null);
    }
  };

  const selectedGH = greenhouses.find((g) => g.id === selectedGreenhouseId);

  const renderContent = () => {
    if (error) return <ErrorState message={error} onRetry={loadData} />;

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            greenhouses={greenhouses}
            onSelectGreenhouse={(id) => {
              setSelectedGreenhouseId(id);
              setCurrentView('greenhouse-detail');
            }}
            onDeleteGreenhouse={deleteGreenhouse}
            lastUpdated={lastUpdated}
          />
        );
      case 'greenhouse-detail':
        return selectedGH ? (
          <GreenhouseDetail
            greenhouse={selectedGH}
            plant={plants.find((p) => p.name === selectedGH.plant)}
            onBack={() => setCurrentView('dashboard')}
            onUpdate={(updates) => updateGreenhouse(selectedGH.id, updates)}
          />
        ) : null;
      case 'settings':
        return <Settings onBack={() => setCurrentView('dashboard')} />;
      case 'plant-library':
        return (
          <PlantLibrary
            plants={plants}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      default:
        return null;
    }
  };

  const navigationItems = [
    { view: 'dashboard' as View, icon: Home, label: 'Dashboard' },
    { view: 'plant-library' as View, icon: Book, label: 'Plant Guide' },
    { view: 'settings' as View, icon: SettingsIcon, label: 'Settings' },
  ];

  // Show Login first if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white dark:from-gray-900 dark:to-gray-950 transition-colors">
        <Auth onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  // Main App after login
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-green-100 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 dark:bg-green-500 rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm" />
              </div>
              <h1 className="text-green-800 dark:text-green-400 font-semibold transition-colors duration-300">
                Garden Away
              </h1>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map(({ view, icon: Icon, label }) => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'ghost'}
                  onClick={() => setCurrentView(view)}
                  className={`${
                    currentView === view
                      ? 'bg-green-600 text-white dark:bg-green-500 dark:text-gray-100'
                      : 'text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}

              <Button
                variant="ghost"
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </nav>

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-green-700 dark:text-green-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-green-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
            <div className="px-4 py-3 space-y-1">
              {navigationItems.map(({ view, icon: Icon, label }) => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'ghost'}
                  onClick={() => {
                    setCurrentView(view);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full justify-start ${
                    currentView === view
                      ? 'bg-green-600 text-white dark:bg-green-500 dark:text-gray-100'
                      : 'text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </Button>
              ))}

              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderContent()}
      </main>
      <Toaster />
      {globalLoading && <GlobalLoader message={globalLoading} />}
    </div>
  );
}
