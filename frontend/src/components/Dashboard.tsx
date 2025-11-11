import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { Greenhouse } from '../types/types';
import { Plus, Thermometer, Droplets, Trash2, Wifi, WifiOff } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DashboardProps {
  greenhouses: Greenhouse[];
  onSelectGreenhouse: (id: string) => void;
  onDeleteGreenhouse: (id: string) => void;
  lastUpdated?: Date | null;
}


export function Dashboard({ greenhouses, onSelectGreenhouse, onDeleteGreenhouse ,lastUpdated}: DashboardProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-green-800 mb-1">Your Greenhouses</h2>
          <p className="text-green-600">Monitor and manage your growing spaces</p>
          {lastUpdated && (
          <p className="text-xs text-gray-500 mt-1">
            Last updated {formatTimeAgo(lastUpdated)}
          </p>
        )}  
        </div>
        
      </div>

      {/* Greenhouses Grid */}
      {greenhouses.length === 0 ? (
        <Card className="border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-green-800 mb-2">No greenhouses yet</h3>
            <p className="text-green-600 mb-6 max-w-md">
              Get started by adding your first greenhouse to begin monitoring your plants.
            </p>
            
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {greenhouses.map((greenhouse) => (
            <Card 
              key={greenhouse.id} 
              className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle 
                      className="text-green-800 text-lg cursor-pointer hover:text-green-700"
                      onClick={() => onSelectGreenhouse(greenhouse.id)}
                    >
                      {greenhouse.name}
                    </CardTitle>
                    <p className="text-green-600 mt-1">Growing {greenhouse.plant}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={greenhouse.isOnline ? "default" : "destructive"}
                      className={`${
                        greenhouse.isOnline 
                          ? "bg-green-100 text-green-800 hover:bg-green-200" 
                          : ""
                      }`}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Greenhouse</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove "{greenhouse.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteGreenhouse(greenhouse.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent 
                className="cursor-pointer"
                onClick={() => onSelectGreenhouse(greenhouse.id)}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="font-medium text-gray-900">{greenhouse.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Humidity</p>
                      <p className="font-medium text-gray-900">{greenhouse.humidity}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-green-100">
                  <Button 
                    variant="outline" 
                    className="w-full text-green-700 border-green-200 hover:bg-green-50"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}