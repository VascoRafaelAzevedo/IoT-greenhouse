import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import type { Greenhouse, Plant } from '../types/types';
import { ArrowLeft, Thermometer, Droplets, Sun, Beaker } from 'lucide-react';

interface AddGreenhouseProps {
  plants: Plant[];
  onAdd: (greenhouse: Omit<Greenhouse, 'id'>) => void;
  onCancel: () => void;
}

export function AddGreenhouse({ plants, onAdd, onCancel }: AddGreenhouseProps) {
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [formData, setFormData] = useState({
    name: '',
    plant: ''
  });
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const handlePlantSelect = (plantName: string) => {
    const plant = plants.find(p => p.name === plantName);
    setFormData(prev => ({ ...prev, plant: plantName }));
    setSelectedPlant(plant || null);
  };

  const handleContinue = () => {
    if (formData.name && formData.plant) {
      setStep('confirm');
    }
  };

  const handleConfirm = () => {
    if (!selectedPlant) return;
    
    const newGreenhouse: Omit<Greenhouse, 'id'> = {
      name: formData.name,
      plant: formData.plant,
      isOnline: true,
      temperature: Math.round((selectedPlant.optimalTemperature.min + selectedPlant.optimalTemperature.max) / 2),
      humidity: Math.round((selectedPlant.optimalHumidity.min + selectedPlant.optimalHumidity.max) / 2),
      waterLevel: Math.round((selectedPlant.optimalWaterLevel.min + selectedPlant.optimalWaterLevel.max) / 2),
      soilHumidity: Math.round((selectedPlant.optimalSoilHumidity.min + selectedPlant.optimalSoilHumidity.max) / 2),
      lighting: Math.round((selectedPlant.optimalLighting.min + selectedPlant.optimalLighting.max) / 2)
    };
    
    onAdd(newGreenhouse);
  };

  if (step === 'confirm') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setStep('form')}
            className="text-green-700 hover:bg-green-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-green-800">Confirm New Greenhouse</h2>
            <p className="text-green-600">Review the settings for your new greenhouse</p>
          </div>
        </div>

        {/* Confirmation Details */}
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800">Greenhouse Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-green-700">Greenhouse Name</Label>
                <p className="mt-1 p-3 bg-green-50 rounded border border-green-200">{formData.name}</p>
              </div>
              <div>
                <Label className="text-green-700">Selected Plant</Label>
                <p className="mt-1 p-3 bg-green-50 rounded border border-green-200">{formData.plant}</p>
              </div>
            </div>

            {selectedPlant && (
              <div>
                <Label className="text-green-700 mb-3 block">Optimal Growing Conditions</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded border border-orange-200">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Temperature</p>
                      <p className="text-sm text-gray-600">
                        {selectedPlant.optimalTemperature.min}-{selectedPlant.optimalTemperature.max}°C
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded border border-blue-200">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Air Humidity</p>
                      <p className="text-sm text-gray-600">
                        {selectedPlant.optimalHumidity.min}-{selectedPlant.optimalHumidity.max}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded border border-green-200">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Beaker className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Soil Moisture</p>
                      <p className="text-sm text-gray-600">
                        {selectedPlant.optimalSoilHumidity.min}-{selectedPlant.optimalSoilHumidity.max}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Sun className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Lighting</p>
                      <p className="text-sm text-gray-600">
                        {selectedPlant.optimalLighting.min}-{selectedPlant.optimalLighting.max}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={handleConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Create Greenhouse
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setStep('form')}
                className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
              >
                Edit Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={onCancel}
          className="text-green-700 hover:bg-green-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-green-800">Add New Greenhouse</h2>
          <p className="text-green-600">Set up monitoring for a new growing space</p>
        </div>
      </div>

      {/* Form */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">Greenhouse Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-green-700">Greenhouse Name</Label>
            <Input
              id="name"
              placeholder="Enter a name for your greenhouse"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="border-green-200 focus:border-green-500"
            />
            <p className="text-sm text-green-600">Choose a name that helps you identify this greenhouse</p>
          </div>

          <div className="space-y-2">
            <Label className="text-green-700">What are you growing?</Label>
            <Select onValueChange={handlePlantSelect} value={formData.plant}>
              <SelectTrigger className="border-green-200 focus:border-green-500">
                <SelectValue placeholder="Select a plant to grow" />
              </SelectTrigger>
              <SelectContent>
                {plants.map((plant) => (
                  <SelectItem key={plant.id} value={plant.name}>
                    {plant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-green-600">We'll set up optimal growing conditions for your chosen plant</p>
          </div>

          {selectedPlant && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-3">Growing Conditions for {selectedPlant.name}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Temperature:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {selectedPlant.optimalTemperature.min}-{selectedPlant.optimalTemperature.max}°C
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Humidity:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {selectedPlant.optimalHumidity.min}-{selectedPlant.optimalHumidity.max}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Soil Moisture:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {selectedPlant.optimalSoilHumidity.min}-{selectedPlant.optimalSoilHumidity.max}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Lighting:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {selectedPlant.optimalLighting.min}-{selectedPlant.optimalLighting.max}%
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleContinue}
              disabled={!formData.name || !formData.plant}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
            >
              Continue to Review
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}