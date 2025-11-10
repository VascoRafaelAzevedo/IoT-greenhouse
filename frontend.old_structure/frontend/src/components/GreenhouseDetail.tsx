// src/components/GreenhouseDetail.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import { ParameterDialog } from './ParameterDialog';
import type { Greenhouse, Plant } from '../types/types';
import { greenhouseService } from '../api/greenhouseService';
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Sun,
  Beaker,
  Wifi,
  WifiOff,
  Settings,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface GreenhouseDetailProps {
  greenhouse: Greenhouse;
  plant?: Plant;
  onBack: () => void;
  onUpdate: (updates: Partial<Greenhouse>) => void;
}

type ParameterType = 'temperature' | 'humidity' | 'waterLevel' | 'soilHumidity' | 'lighting';

interface ParameterCardData {
  type: ParameterType;
  title: string;
  value: number;
  unit: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  optimal?: { min: number; max: number };
}

export function GreenhouseDetail({ greenhouse: initialGreenhouse, plant, onBack, onUpdate }: GreenhouseDetailProps) {
  const [greenhouse, setGreenhouse] = useState(initialGreenhouse);
  const [selectedParameter, setSelectedParameter] = useState<ParameterType | null>(null);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [manualControls, setManualControls] = useState({
    temperature: greenhouse.temperature,
    humidity: greenhouse.humidity,
    waterLevel: greenhouse.waterLevel,
    soilHumidity: greenhouse.soilHumidity,
    lighting: greenhouse.lighting,
  });
  const [historyData, setHistoryData] = useState<{ time: string; value: number }[] | null>(null);

  // Load live data from backend (or mock)
  useEffect(() => {
    (async () => {
      try {
        const data = await greenhouseService.getGreenhouse(greenhouse.id);
        setGreenhouse(data);
        setManualControls({
          temperature: data.temperature,
          humidity: data.humidity,
          waterLevel: data.waterLevel,
          soilHumidity: data.soilHumidity,
          lighting: data.lighting,
        });
      } catch (err) {
        console.error('Failed to load greenhouse:', err);
      }
    })();
  }, [greenhouse.id]);

  const parameters: ParameterCardData[] = [
    {
      type: 'temperature',
      title: 'Temperature',
      value: greenhouse.temperature,
      unit: '°C',
      icon: Thermometer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      optimal: plant?.optimalTemperature,
    },
    {
      type: 'humidity',
      title: 'Air Humidity',
      value: greenhouse.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      optimal: plant?.optimalHumidity,
    },
    {
      type: 'waterLevel',
      title: 'Water Level',
      value: greenhouse.waterLevel,
      unit: '%',
      icon: Droplets,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      optimal: plant?.optimalWaterLevel,
    },
    {
      type: 'soilHumidity',
      title: 'Soil Moisture',
      value: greenhouse.soilHumidity,
      unit: '%',
      icon: Beaker,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      optimal: plant?.optimalSoilHumidity,
    },
    {
      type: 'lighting',
      title: 'Lighting',
      value: greenhouse.lighting,
      unit: '%',
      icon: Sun,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      optimal: plant?.optimalLighting,
    },
  ];

  const isParameterInRange = (param: ParameterCardData) =>
    !param.optimal || (param.value >= param.optimal.min && param.value <= param.optimal.max);

  const handleParameterClick = async (paramType: ParameterType) => {
    setSelectedParameter(paramType);
    try {
      const data = await greenhouseService.getParameterHistory(greenhouse.id, paramType);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleControlUpdate = (param: ParameterType, value: number[]) => {
    setManualControls(prev => ({ ...prev, [param]: value[0] }));
  };

  const applyChanges = async () => {
    try {
      const updated = await greenhouseService.updateGreenhouse(greenhouse.id, manualControls);
      setGreenhouse(updated);
      onUpdate(manualControls);
      setControlPanelOpen(false);
    } catch (err) {
      console.error('Failed to apply changes:', err);
    }
  };

  const resetControls = () => {
    setManualControls({
      temperature: greenhouse.temperature,
      humidity: greenhouse.humidity,
      waterLevel: greenhouse.waterLevel,
      soilHumidity: greenhouse.soilHumidity,
      lighting: greenhouse.lighting,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack} className="text-green-700 hover:bg-green-100">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-green-800">{greenhouse.name}</h2>
              <Badge
                variant={greenhouse.isOnline ? 'default' : 'destructive'}
                className={greenhouse.isOnline ? 'bg-green-100 text-green-800' : ''}
              >
                {greenhouse.isOnline ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
            </div>
            <p className="text-green-600">Growing {greenhouse.plant}</p>
          </div>
        </div>
        <Button
          onClick={() => setControlPanelOpen(!controlPanelOpen)}
          variant="outline"
          className="text-green-700 border-green-200 hover:bg-green-50"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manual Controls
        </Button>
      </div>

      {/* Manual Controls */}
      {controlPanelOpen && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Manual Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {parameters.map(param => (
                <div key={param.type} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-green-700">{param.title}</Label>
                    <span className="text-sm font-medium">
                      {manualControls[param.type]}{param.unit}
                    </span>
                  </div>
                  <Slider
                    value={[manualControls[param.type]]}
                    onValueChange={v => handleControlUpdate(param.type, v)}
                    max={param.type === 'temperature' ? 35 : 100}
                    min={param.type === 'temperature' ? 10 : 0}
                    step={1}
                    className="w-full"
                  />
                  {param.optimal && (
                    <p className="text-xs text-green-600">
                      Optimal: {param.optimal.min}-{param.optimal.max}{param.unit}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button onClick={applyChanges} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Apply Changes
              </Button>
              <Button variant="outline" onClick={resetControls} className="flex-1 text-green-700 border-green-200 hover:bg-green-50">
                Reset
              </Button>
              <Button variant="ghost" onClick={() => setControlPanelOpen(false)} className="flex-1 text-gray-600 hover:bg-gray-50">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parameter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {parameters.map(param => {
          const isInRange = isParameterInRange(param);
          const Icon = param.icon;
          return (
            <Card
              key={param.type}
              className={`border-green-200 hover:shadow-lg transition-shadow cursor-pointer ${
                !isInRange ? 'ring-2 ring-red-200 border-red-300' : ''
              }`}
              onClick={() => handleParameterClick(param.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full ${param.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${param.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base text-gray-900">{param.title}</CardTitle>
                      <p className="text-2xl font-semibold text-gray-900 mt-1">
                        {param.value}{param.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    {!isInRange && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {param.optimal && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Optimal Range</span>
                        <span className="text-gray-900">
                          {param.optimal.min}-{param.optimal.max}{param.unit}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(100, Math.max(0, ((param.value - param.optimal.min) / (param.optimal.max - param.optimal.min)) * 100))}
                        className="h-2"
                      />
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Badge
                        variant={isInRange ? 'default' : 'destructive'}
                        className={`text-xs ${isInRange ? 'bg-green-100 text-green-800' : ''}`}
                      >
                        {isInRange ? 'In Range' : 'Out of Range'}
                      </Badge>
                    </div>
                  </>
                )}

                <Button variant="ghost" className="w-full mt-3 text-green-700 hover:bg-green-50">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View History
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Parameter History Dialog */}
      {selectedParameter && historyData && (
        <ParameterDialog
          parameter={parameters.find(p => p.type === selectedParameter)!}
          data={historyData}
          onClose={() => {
            setSelectedParameter(null);
            setHistoryData(null);
          }}
        />
      )}
    </div>
  );
}
