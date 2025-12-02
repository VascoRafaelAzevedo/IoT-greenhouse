import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { LabelPosition } from 'recharts/types/component/Label';

interface ParameterDialogProps {
  parameter: {
    type: string;
    title: string;
    value: number;
    unit: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    optimal?: { min: number; max: number };
  };
  data: Array<{ time: string; value: number }>;
  onClose: () => void;
}

export function ParameterDialog({ parameter, data, onClose }: ParameterDialogProps) {
  const Icon = parameter.icon;
  const localData = data.map((d) => ({
  ...d,
  time: new Date(d.time).toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short'
  })
}));
  const getColorForValue = (value: number) => {
    if (!parameter.optimal) return '#10b981'; // green
    
    if (value < parameter.optimal.min || value > parameter.optimal.max) {
      return '#ef4444'; // red
    }
    return '#10b981'; // green
  };

  // Calculate statistics
  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  const outOfRangeCount = parameter.optimal 
    ? values.filter(v => v < parameter.optimal!.min || v > parameter.optimal!.max).length
    : 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3 text-green-800">
            <div className={`w-8 h-8 rounded-full ${parameter.bgColor} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${parameter.color}`} />
            </div>
            <span>{parameter.title} - 24 Hour History</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-800">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {parameter.value}{parameter.unit}
                  </p>
                  <p className="text-sm text-gray-600">Current</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {avg.toFixed(1)}{parameter.unit}
                  </p>
                  <p className="text-sm text-gray-600">24h Average</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {min.toFixed(1)}{parameter.unit}
                  </p>
                  <p className="text-sm text-gray-600">24h Minimum</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-gray-900">
                    {max.toFixed(1)}{parameter.unit}
                  </p>
                  <p className="text-sm text-gray-600">24h Maximum</p>
                </div>
              </div>

              {parameter.optimal && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Optimal Range</p>
                      <p className="text-sm text-gray-600">
                        {parameter.optimal.min} - {parameter.optimal.max}{parameter.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={outOfRangeCount === 0 ? "default" : "destructive"}
                        className={outOfRangeCount === 0 ? "bg-green-100 text-green-800" : ""}
                      >
                        {outOfRangeCount === 0 
                          ? 'All readings in range' 
                          : `${outOfRangeCount} readings out of range`
                        }
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-800">24-Hour Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={localData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="time" 
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      labelFormatter={(label) => `Time: ${label}`}
                      formatter={(value) => [`${value}${parameter.unit}`, parameter.title]}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #d1d5db',
                        borderRadius: '6px'
                      }}
                    />
                    
                    {/* Optimal range reference lines */}
                    {parameter.optimal && (
                      <>
                        <ReferenceLine 
                          y={parameter.optimal.min} 
                          stroke="#10b981" 
                          strokeDasharray="5 5"
                          label={{ value: "Min Optimal", position: "topRight" as LabelPosition}}
                        />
                        <ReferenceLine 
                          y={parameter.optimal.max} 
                          stroke="#10b981" 
                          strokeDasharray="5 5"
                          label={{ value: "Max Optimal", position: "topRight" as LabelPosition}}
                        />
                      </>
                    )}
                    
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#059669"
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#059669' }}
                      activeDot={{ r: 5, fill: '#047857' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-base text-green-800">Recent Readings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  {localData.slice(-12).reverse().map((reading, index) => {
                    const isInRange = parameter.optimal 
                      ? reading.value >= parameter.optimal.min && reading.value <= parameter.optimal.max
                      : true;
                    
                    return (
                      <div 
                        key={index}
                        className={`p-2 rounded border ${
                          isInRange 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <p className="font-medium text-gray-900">
                          {reading.value}{parameter.unit}
                        </p>
                        <p className="text-xs text-gray-600">{reading.time}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}