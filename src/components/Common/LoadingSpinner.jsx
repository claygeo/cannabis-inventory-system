import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'md', 
  message = 'Loading...', 
  fullScreen = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <RefreshCw 
          className={`${sizeClasses[size]} text-blue-500 animate-spin mx-auto mb-2`}
        />
        {message && (
          <p className="text-sm text-gray-600 font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;