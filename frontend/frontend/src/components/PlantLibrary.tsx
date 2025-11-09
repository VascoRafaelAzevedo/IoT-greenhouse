import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import type { Plant } from '../types/types';
import { ArrowLeft, Search, Thermometer, Droplets, Sun, Beaker, BookOpen } from 'lucide-react';

interface PlantLibraryProps {
  plants: Plant[];
  onBack: () => void;
}

export function PlantLibrary({ plants, onBack }: PlantLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);

  const filteredPlants = plants.filter(plant =>
    plant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const plantDetails = {
    'Tomatoes': {
      description: 'Popular warm-season vegetables that require consistent watering and plenty of sunlight.',
      tips: [
        'Provide support with stakes or cages as they grow',
        'Water consistently to prevent blossom end rot',
        'Maintain warm temperatures for best fruit development',
        'Pinch suckers to encourage fruit production'
      ],
      commonIssues: [
        'Blossom end rot from inconsistent watering',
        'Fungal diseases in high humidity',
        'Cracking from irregular watering'
      ]
    },
    'Lettuce': {
      description: 'Cool-season leafy greens that prefer moderate temperatures and consistent moisture.',
      tips: [
        'Harvest outer leaves regularly for continuous growth',
        'Keep soil consistently moist but not waterlogged',
        'Provide some shade in warmer weather',
        'Succession plant every 2 weeks for continuous harvest'
      ],
      commonIssues: [
        'Bolting in hot weather',
        'Tip burn from inconsistent watering',
        'Aphid infestations'
      ]
    },
    'Basil': {
      description: 'Aromatic herb that loves warm weather and well-draining soil.',
      tips: [
        'Pinch flowers to keep leaves tender',
        'Harvest regularly to encourage bushy growth',
        'Provide warm temperatures and bright light',
        'Avoid overwatering to prevent root rot'
      ],
      commonIssues: [
        'Fungal diseases from overwatering',
        'Poor growth in cool temperatures',
        'Aphid and spider mite problems'
      ]
    },
    'Peppers': {
      description: 'Heat-loving vegetables that need warm temperatures and consistent care.',
      tips: [
        'Maintain warm soil temperatures for best growth',
        'Provide support for heavy fruiting varieties',
        'Consistent watering prevents blossom end rot',
        'Harvest regularly to encourage more production'
      ],
      commonIssues: [
        'Blossom end rot from calcium deficiency',
        'Poor fruit set in extreme temperatures',
        'Sunscald on exposed fruits'
      ]
    }
  };

  if (selectedPlant) {
    const details = plantDetails[selectedPlant.name as keyof typeof plantDetails];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPlant(null)}
            className="text-green-700 hover:bg-green-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
          <div>
            <h2 className="text-green-800">Plant Guide: {selectedPlant.name}</h2>
            <p className="text-green-600">Complete growing information and optimal conditions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plant Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{details?.description}</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              </CardContent>
            </Card>

            {/* Growing Tips */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Growing Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {details?.tips.map((tip, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-700">{tip}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Quick Reference
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Difficulty:</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {selectedPlant.name === 'Lettuce' ? 'Easy' : 
                       selectedPlant.name === 'Basil' ? 'Easy' :
                       selectedPlant.name === 'Tomatoes' ? 'Medium' : 'Medium'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Season:</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {selectedPlant.name === 'Lettuce' ? 'Cool' : 'Warm'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Growth Speed:</span>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      {selectedPlant.name === 'Lettuce' ? 'Fast' : 
                       selectedPlant.name === 'Basil' ? 'Fast' : 'Moderate'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Common Issues */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {details?.commonIssues.map((issue, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">{issue}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="text-green-700 hover:bg-green-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h2 className="text-green-800">Plant Library</h2>
          <p className="text-green-600">Growing guides and optimal conditions for your plants</p>
        </div>
      </div>

      {/* Search */}
      <Card className="border-green-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search plants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Plants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlants.map((plant) => (
          <Card 
            key={plant.id} 
            className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedPlant(plant)}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-green-800 text-lg">{plant.name}</CardTitle>
                  <p className="text-green-600 mt-1">
                    {plant.name === 'Lettuce' ? 'Cool season crop' : 
                     plant.name === 'Basil' ? 'Aromatic herb' :
                     plant.name === 'Tomatoes' ? 'Warm season fruit' : 'Warm season vegetable'}
                  </p>
                </div>
                <Badge 
                  variant="outline" 
                  className="text-green-700 border-green-300"
                >
                  {plant.name === 'Lettuce' || plant.name === 'Basil' ? 'Easy' : 'Medium'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-gray-600">
                    {plant.optimalTemperature.min}-{plant.optimalTemperature.max}°C
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-gray-600">
                    {plant.optimalHumidity.min}-{plant.optimalHumidity.max}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Beaker className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">
                    {plant.optimalSoilHumidity.min}-{plant.optimalSoilHumidity.max}%
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">
                    {plant.optimalLighting.min}-{plant.optimalLighting.max}%
                  </span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full text-green-700 border-green-200 hover:bg-green-50"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                View Growing Guide
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlants.length === 0 && (
        <Card className="border-green-200">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-green-800 mb-2">No plants found</h3>
            <p className="text-green-600">Try searching for a different plant name.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}