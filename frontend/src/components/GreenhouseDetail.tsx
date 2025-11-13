// src/components/GreenhouseDetail.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Slider } from './ui/slider';
import { ParameterDialog } from './ParameterDialog';
import type { Greenhouse, Plant } from '../types/types';
import { dataService } from '../api/apiService';
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

type ParameterType = 'temperature' | 'humidity' | 'lighting';

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

export function GreenhouseDetail({
  greenhouse: initialGreenhouse,
  onBack,
  onUpdate,
}: GreenhouseDetailProps) {
  const [greenhouse, setGreenhouse] = useState(initialGreenhouse);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(initialGreenhouse.name || initialGreenhouse.id);
  const [selectedParameter, setSelectedParameter] = useState<ParameterType | null>(null);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);
  const [setpoints, setSetpoints] = useState(initialGreenhouse.setpoint);
  const [historyData, setHistoryData] = useState<{ time: string; value: number }[] | null>(null);

  // Load live data from backend
  useEffect(() => {
    (async () => {
      try {
        const data = await dataService.getGreenhouse(initialGreenhouse.id);
        setGreenhouse(data);
        setSetpoints(data.setpoint);
        setNewName(data.name || data.id);
      } catch (err) {
        console.error('Failed to load greenhouse:', err);
      }
    })();
  }, [initialGreenhouse.id]);

  const parameters: ParameterCardData[] = [
    {
      type: 'temperature',
      title: 'Temperature',
      value: greenhouse.temperature,
      unit: '°C',
      icon: Thermometer,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      optimal: setpoints?.target_temp_min && setpoints?.target_temp_max
        ? { min: setpoints.target_temp_min, max: setpoints.target_temp_max }
        : undefined,
    },
    {
      type: 'humidity',
      title: 'Air Humidity',
      value: greenhouse.humidity,
      unit: '%',
      icon: Droplets,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      optimal: setpoints?.target_hum_air_max
        ? { min: setpoints.target_hum_air_max - 5, max: setpoints.target_hum_air_max }
        : undefined,
    },
    {
      type: 'lighting',
      title: 'Lighting',
      value: greenhouse.lighting,
      unit: 'lux',
      icon: Sun,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      optimal: setpoints?.target_light_intensity
        ? { min: setpoints.target_light_intensity - 10, max: setpoints.target_light_intensity }
        : undefined,
    },
  ];

  const isParameterInRange = (param: ParameterCardData) =>
    !param.optimal || (param.value >= param.optimal.min && param.value <= param.optimal.max);

  const handleParameterClick = async (paramType: ParameterType) => {
    setSelectedParameter(paramType);
    try {
      const data = await dataService.getParameterHistory(greenhouse.id, paramType);
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSetpointChange = (field: keyof typeof setpoints, value: number) => {
    setSetpoints(prev => ({ ...prev, [field]: value }));
  };

  const applyChanges = async () => {
    try {
      if(newName&&newName!==greenhouse.name){
        const updates = {
          name: newName,
        };
        const updated = await dataService.updateGreenhouse(greenhouse.id, updates);
        setGreenhouse(updated);
        onUpdate(updates);
        setControlPanelOpen(false);
        setEditingName(false);
      }else if (setpoints){
        const updates = setpoints
        const updated = await dataService.updateGreenhouseSetpoint(greenhouse.id, updates);
        setGreenhouse(updated);
        onUpdate({
          setpoint: updates,
        });
        setControlPanelOpen(false);
      }
      console.log(setpoints)
      
    } catch (err) {
      console.error('Failed to apply changes:', err);
    }
  };

  const resetControls = () => {
    setSetpoints(greenhouse.setpoint);
    setNewName(greenhouse.name || greenhouse.id);
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
              {editingName ? (
                <Input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-56 border-green-300 focus:border-green-500"
                />
              ) : (
                <h2 className="text-green-800">{greenhouse.name || greenhouse.id}</h2>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-green-700 border-green-200 hover:bg-green-50"
                onClick={() => setEditingName(!editingName)}
              >
                {editingName ? 'Done' : 'Edit'}
              </Button>
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
          Control Parameters
        </Button>
      </div>

      {/* Manual Control Panel for Setpoints */}
      {controlPanelOpen && (
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Manual Setpoint Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Temperature Min (°C)</Label>
                <Slider
                  value={[setpoints.target_temp_min]}
                  onValueChange={([v]) => handleSetpointChange('target_temp_min', v)}
                  min={10}
                  max={40}
                  step={1}
                />
                <p className="text-sm text-gray-600 mt-1">{setpoints.target_temp_min}°C</p>
              </div>
              <div>
                <Label>Temperature Max (°C)</Label>
                <Slider
                  value={[setpoints.target_temp_max]}
                  onValueChange={([v]) => handleSetpointChange('target_temp_max', v)}
                  min={10}
                  max={40}
                  step={1}
                />
                <p className="text-sm text-gray-600 mt-1">{setpoints.target_temp_max}°C</p>
              </div>
            </div>

            {/* Humidity */}
            <div>
              <Label>Max Air Humidity (%)</Label>
              <Slider
                value={[setpoints.target_hum_air_max]}
                onValueChange={([v]) => handleSetpointChange('target_hum_air_max', v)}
                min={30}
                max={100}
                step={1}
              />
              <p className="text-sm text-gray-600 mt-1">{setpoints.target_hum_air_max}%</p>
            </div>

            {/* Irrigation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Irrigation Interval (min)</Label>
                <Slider
                  value={[setpoints.irrigation_interval_minutes]}
                  onValueChange={([v]) => handleSetpointChange('irrigation_interval_minutes', v)}
                  min={30}
                  max={300}
                  step={10}
                />
                <p className="text-sm text-gray-600 mt-1">{setpoints.irrigation_interval_minutes} min</p>
              </div>
              <div>
                <Label>Irrigation Duration (s)</Label>
                <Slider
                  value={[setpoints.irrigation_duration_seconds]}
                  onValueChange={([v]) => handleSetpointChange('irrigation_duration_seconds', v)}
                  min={5}
                  max={120}
                  step={5}
                />
                <p className="text-sm text-gray-600 mt-1">{setpoints.irrigation_duration_seconds} sec</p>
              </div>
            </div>

            {/* Lighting */}
            <div>
              <Label>Target Light Intensity (lux)</Label>
              <Slider
                value={[setpoints.target_light_intensity]}
                onValueChange={([v]) => handleSetpointChange('target_light_intensity', v)}
                min={100}
                max={1000}
                step={10}
              />
              <p className="text-sm text-gray-600 mt-1">{setpoints.target_light_intensity} lux</p>
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

      {/* Existing parameter cards remain unchanged */}
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
                        value={Math.min(
                          100,
                          Math.max(
                            0,
                            ((param.value - param.optimal.min) /
                              (param.optimal.max - param.optimal.min)) *
                              100
                          )
                        )}
                        className="h-2"
                      />
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Badge
                        variant={isInRange ? 'default' : 'destructive'}
                        className={`text-xs ${
                          isInRange ? 'bg-green-100 text-green-800' : ''
                        }`}
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

      {/* History Dialog */}
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
