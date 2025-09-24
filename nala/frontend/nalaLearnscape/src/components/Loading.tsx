import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, MessageSquare, Brain, TrendingUp, AlertCircle } from 'lucide-react';

  // Loading Component
  interface LoadingSpinnerProps {
    message?: string;
  }

  const LoadingSpinner = ({ message = "Loading data..." }: LoadingSpinnerProps) => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
  
  // Error Component
  interface ErrorDisplayProps {
    error: string | Error;
    onRetry: () => void;
    title?: string;
  }

  const ErrorDisplay = ({ error, onRetry, title = "Error loading data" }: ErrorDisplayProps) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <AlertCircle className="text-red-600 mr-2" size={20} />
        <h4 className="font-semibold text-red-800">{title}</h4>
      </div>
      <p className="text-red-700 mb-3">Error: {error}</p>
      <button 
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        Retry
      </button>
    </div>
  );