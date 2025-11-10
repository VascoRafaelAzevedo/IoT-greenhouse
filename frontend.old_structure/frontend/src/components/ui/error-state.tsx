import React from 'react';
import { Button } from './button';
import { AlertTriangle } from 'lucide-react';

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong while loading data.',
  onRetry
}) => (
  <div className="flex flex-col items-center justify-center h-64 text-red-700 space-y-3">
    <AlertTriangle className="w-8 h-8 text-red-600" />
    <p>{message}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry} className="text-red-700 border-red-300 hover:bg-red-50">
        Retry
      </Button>
    )}
  </div>
);
