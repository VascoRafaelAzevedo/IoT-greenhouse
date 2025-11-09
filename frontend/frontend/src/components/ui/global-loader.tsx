import React from 'react';

export const GlobalLoader: React.FC<{ message?: string }> = ({ message = 'Please wait...' }) => (
  <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
    <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-3">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm text-green-800 font-medium">{message}</p>
    </div>
  </div>
);
