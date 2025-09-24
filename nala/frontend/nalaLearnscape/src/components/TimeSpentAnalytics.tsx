import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Clock } from 'lucide-react';
import { useTimeSpentData } from '../hooks/useAnalyticsData.tsx';

const TimeSpentAnalytics = () => {
  const { data, loading, error } = useTimeSpentData();
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-4">
          <Clock className="mr-2 text-red-600" size={24} />
          <h3 className="text-xl font-bold">Study Time Distribution</h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error loading data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center mb-4">
        <Clock className="mr-2 text-blue-600" size={24} />
        <h3 className="text-xl font-bold">Study Time Distribution</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div>
          <h4 className="font-semibold mb-3">Time per Topic (Minutes)</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="topic" angle={-45} textAnchor="end" height={100} fontSize={10} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} min`, 'Time']} />
              <Bar dataKey="minutes" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Pie Chart */}
        <div>
          <h4 className="font-semibold mb-3">Study Focus Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="percentage"
                nameKey="topic"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Time %']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Dynamic Key Insights */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-800">📊 Key Insights:</h4>
        <p className="text-blue-700">
          {data.length > 0 && (() => {
            const maxTopic = data.reduce((prev, current) => 
              (prev.percentage > current.percentage) ? prev : current
            );
            const minTopic = data.reduce((prev, current) => 
              (prev.percentage < current.percentage) ? prev : current
            );
            return `Most time spent on "${maxTopic.topic}" (${(maxTopic.percentage * 100).toFixed(1)}%). Consider reviewing "${minTopic.topic}" which had minimal engagement.`;
          })()}
        </p>
      </div>
    </div>
  );
};

export default TimeSpentAnalytics;