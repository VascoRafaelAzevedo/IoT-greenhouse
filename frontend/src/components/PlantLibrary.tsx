import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { Plant } from '../types/types';
import { ArrowLeft, Search, Thermometer, Droplets, Sun, Beaker } from 'lucide-react';

interface PlantLibraryProps {
  plants: Plant[];
  onBack: () => void;
}

export function PlantLibrary({ plants, onBack }: PlantLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPlants = plants.filter((plant) =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-900/30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-green-800 dark:text-green-200">Plant Library</h2>
          <p className="text-green-600 dark:text-green-400">
            Quick reference for your greenhouse plants
          </p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-green-200 dark:border-green-700">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 dark:border-green-700 focus:border-green-500 dark:focus:border-green-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => (
          <Card
            key={plant.id}
            className="border-green-200 dark:border-green-700 hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-green-800 dark:text-green-200 text-lg">
                    {plant.name}
                  </CardTitle>
                  <p className="text-green-600 dark:text-green-400 mt-1 text-sm">
                    {plant.description}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-600"
                >
                  #{plant.id.slice(0, 4)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {plant.optimalTemperature.min}–{plant.optimalTemperature.max}°C
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {plant.optimalHumidity}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Beaker className="w-4 h-4 text-green-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Every {plant.irrigationInterval} min ({plant.irrigationDurationSec}s)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {plant.optimalLighting} lux
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlants.length === 0 && (
        <Card className="border-green-200 dark:border-green-700">
          <CardContent className="text-center py-12">
            <Search className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-green-800 dark:text-green-200 mb-2">No plants found</h3>
            <p className="text-green-600 dark:text-green-400">
              Try searching for a different plant name.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}