import React from 'react';

export const Loading: React.FC<{ message?: string }> = ({ message = 'Loading data...' }) => (
  <div className="flex items-center justify-center h-64 text-green-700">
    <div className="flex flex-col items-center space-y-3">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm">{message}</p>
    </div>
  </div>
);