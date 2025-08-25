import React from 'react';
import { HeatingDataPoint } from '../types/HeatingData';

interface DebugTableProps {
  data: HeatingDataPoint[];
}

export const DebugTable: React.FC<DebugTableProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Debug: All Data ({data.length} records)
      </h3>
      
      <div className="overflow-x-auto max-h-96">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium text-gray-900">#</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">Date</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">Time</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">Collector Temp</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">Outside Temp</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">DHW Temp</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">Solar Status</th>
              <th className="px-2 py-1 text-left font-medium text-gray-900">DHW Pump</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((point, index) => (
              <tr key={index} className={index < 5 || index >= data.length - 5 ? 'bg-yellow-50' : ''}>
                <td className="px-2 py-1 text-gray-900">{index}</td>
                <td className="px-2 py-1 text-gray-900 font-mono">{point.date}</td>
                <td className="px-2 py-1 text-gray-900 font-mono">{point.time}</td>
                <td className="px-2 py-1 text-gray-900">{point.collectorTemp.toFixed(1)}°C</td>
                <td className="px-2 py-1 text-gray-900">{point.outsideTemp.toFixed(1)}°C</td>
                <td className="px-2 py-1 text-gray-900">{point.dhwTempTop.toFixed(1)}°C</td>
                <td className="px-2 py-1 text-gray-900 text-xs">{point.solarStatus}</td>
                <td className="px-2 py-1 text-gray-900">{point.dhwPump}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>First record:</strong> {data[0]?.date} {data[0]?.time}</p>
        <p><strong>Last record:</strong> {data[data.length - 1]?.date} {data[data.length - 1]?.time}</p>
        <p className="text-yellow-600 mt-2">Yellow rows show first 5 and last 5 records</p>
      </div>
    </div>
  );
};