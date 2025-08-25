import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Zap, Flame, Sun, BarChart3, AlertCircle } from 'lucide-react';
import { HeatingDataService } from '../services/heatingDataService';
import { EnergyCalculationsService } from '../services/energyCalculationsService';
import { useLanguage } from '../contexts/LanguageContext';

interface EnergyCalculation {
  id: string;
  date: string;
  solar_energy_kwh: number;
  gas_energy_kwh: number;
  total_energy_kwh: number;
  solar_active_minutes: number;
  gas_active_minutes: number;
  avg_collector_temp: number;
  avg_dhw_temp: number;
  avg_outside_temp: number;
  max_collector_temp: number;
  max_dhw_temp: number;
  min_outside_temp: number;
  max_outside_temp: number;
  avg_water_pressure: number;
  data_points_count: number;
  created_at: string;
  updated_at: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [energyData, setEnergyData] = useState<EnergyCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof EnergyCalculation>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadEnergyData();
  }, []);

  const loadEnergyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await EnergyCalculationsService.getAllCalculations();
      setEnergyData(data);
    } catch (error) {
      console.error('Error loading energy calculations:', error);
      setError('Failed to load energy calculations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: keyof EnergyCalculation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...energyData].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Calculate summary statistics
  const totalSolarEnergy = energyData.reduce((sum, day) => sum + day.solar_energy_kwh, 0);
  const totalGasEnergy = energyData.reduce((sum, day) => sum + day.gas_energy_kwh, 0);
  const totalCombinedEnergy = totalSolarEnergy + totalGasEnergy;
  const avgDailyEnergy = energyData.length > 0 ? totalCombinedEnergy / energyData.length : 0;
  
  const solarPercentage = totalCombinedEnergy > 0 ? (totalSolarEnergy / totalCombinedEnergy) * 100 : 0;
  const gasPercentage = totalCombinedEnergy > 0 ? (totalGasEnergy / totalCombinedEnergy) * 100 : 0;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getSortIcon = (field: keyof EnergyCalculation) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-600">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Data</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadEnergyData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">Energy Analytics Dashboard</h2>
          </div>
          <p className="text-gray-600">Daily energy calculations and system performance metrics</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Total Solar Energy</p>
                <p className="text-2xl font-bold">{totalSolarEnergy.toFixed(1)} kWh</p>
                <p className="text-amber-100 text-sm">{solarPercentage.toFixed(1)}% of total</p>
              </div>
              <Sun className="w-8 h-8 text-amber-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Total Gas Energy</p>
                <p className="text-2xl font-bold">{totalGasEnergy.toFixed(1)} kWh</p>
                <p className="text-red-100 text-sm">{gasPercentage.toFixed(1)}% of total</p>
              </div>
              <Flame className="w-8 h-8 text-red-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Combined Energy</p>
                <p className="text-2xl font-bold">{totalCombinedEnergy.toFixed(1)} kWh</p>
                <p className="text-blue-100 text-sm">{energyData.length} days analyzed</p>
              </div>
              <Zap className="w-8 h-8 text-blue-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Avg Daily Energy</p>
                <p className="text-2xl font-bold">{avgDailyEnergy.toFixed(1)} kWh</p>
                <p className="text-green-100 text-sm">per day</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-100" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Daily Energy Calculations</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{energyData.length} days of data</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Date {getSortIcon('date')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('solar_energy_kwh')}
                  >
                    Solar Energy (kWh) {getSortIcon('solar_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gas_energy_kwh')}
                  >
                    Gas Energy (kWh) {getSortIcon('gas_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_energy_kwh')}
                  >
                    Total Energy (kWh) {getSortIcon('total_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('solar_active_minutes')}
                  >
                    Solar Active (min) {getSortIcon('solar_active_minutes')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gas_active_minutes')}
                  >
                    Gas Active (min) {getSortIcon('gas_active_minutes')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_collector_temp')}
                  >
                    Avg Collector (°C) {getSortIcon('avg_collector_temp')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_outside_temp')}
                  >
                    Avg Outside (°C) {getSortIcon('avg_outside_temp')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('data_points_count')}
                  >
                    Data Points {getSortIcon('data_points_count')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((day) => (
                  <tr key={day.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatDate(day.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                        {day.solar_energy_kwh.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        {day.gas_energy_kwh.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {day.total_energy_kwh.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.solar_active_minutes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.gas_active_minutes}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.avg_collector_temp.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.avg_outside_temp.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.data_points_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {energyData.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Energy Data Available</h3>
              <p className="text-gray-500">Energy calculations will appear here once data is processed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};