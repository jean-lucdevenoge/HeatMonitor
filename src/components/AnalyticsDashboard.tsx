import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Zap, Flame, Sun, BarChart3, AlertCircle, PieChart, LineChart } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { HeatingDataService } from '../services/heatingDataService';
import { EnergyCalculationsService } from '../services/energyCalculationsService';
import { useLanguage } from '../contexts/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

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
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  // Prepare chart data
  const chartLabels = energyData.map(day => {
    try {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    } catch {
      return day.date;
    }
  });

  // Energy trend chart data
  const energyTrendData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('analytics.solarEnergy'),
        data: energyData.map(day => day.solar_energy_kwh),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
      },
      {
        label: t('analytics.gasEnergy'),
        data: energyData.map(day => day.gas_energy_kwh),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Daily total energy bar chart
  const dailyEnergyData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('analytics.solarEnergy'),
        data: energyData.map(day => day.solar_energy_kwh),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
      {
        label: t('analytics.gasEnergy'),
        data: energyData.map(day => day.gas_energy_kwh),
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        borderWidth: 1,
      },
    ],
  };

  // Energy distribution pie chart
  const energyDistributionData = {
    labels: [t('analytics.solarEnergy'), t('analytics.gasEnergy')],
    datasets: [
      {
        data: [totalSolarEnergy, totalGasEnergy],
        backgroundColor: ['#F59E0B', '#DC2626'],
        borderColor: ['#D97706', '#B91C1C'],
        borderWidth: 1,
      },
    ],
  };

  // Temperature trends
  const temperatureTrendData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('analytics.avgCollectorTemp'),
        data: energyData.map(day => day.avg_collector_temp),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: t('analytics.avgOutsideTemp'),
        data: energyData.map(day => day.avg_outside_temp),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: t('analytics.avgDhwTemp'),
        data: energyData.map(day => day.avg_dhw_temp),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        yAxisID: 'y',
      },
    ],
  };

  // Activity time chart
  const activityTimeData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('analytics.solarActiveMinutes'),
        data: energyData.map(day => day.solar_active_minutes),
        backgroundColor: '#F59E0B',
        borderColor: '#D97706',
        borderWidth: 1,
      },
      {
        label: t('analytics.gasActiveMinutes'),
        data: energyData.map(day => day.gas_active_minutes),
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
      },
    },
  };

  const activityTimeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Time (minutes)',
        },
      },
    },
  };
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(2)} kWh (${percentage}%)`;
          }
        }
      }
    },
  };

  const temperatureChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Temperature (°C)',
        },
      },
    },
  };

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
          <span className="text-gray-600">{t('analytics.loadingData')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.errorLoadingData')}</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadEnergyData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {t('analytics.retry')}
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
            <h2 className="text-3xl font-bold text-gray-900">{t('analytics.title')}</h2>
          </div>
          <p className="text-gray-600">{t('analytics.subtitle')}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">{t('analytics.totalSolarEnergy')}</p>
                <p className="text-2xl font-bold">{totalSolarEnergy.toFixed(1)} kWh</p>
                <p className="text-amber-100 text-sm">{solarPercentage.toFixed(1)}% {t('analytics.ofTotal')}</p>
              </div>
              <Sun className="w-8 h-8 text-amber-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">{t('analytics.totalGasEnergy')}</p>
                <p className="text-2xl font-bold">{totalGasEnergy.toFixed(1)} kWh</p>
                <p className="text-red-100 text-sm">{gasPercentage.toFixed(1)}% {t('analytics.ofTotal')}</p>
              </div>
              <Flame className="w-8 h-8 text-red-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t('analytics.totalCombinedEnergy')}</p>
                <p className="text-2xl font-bold">{totalCombinedEnergy.toFixed(1)} kWh</p>
                <p className="text-blue-100 text-sm">{energyData.length} {t('analytics.daysAnalyzed')}</p>
              </div>
              <Zap className="w-8 h-8 text-blue-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('analytics.avgDailyEnergy')}</p>
                <p className="text-2xl font-bold">{avgDailyEnergy.toFixed(1)} kWh</p>
                <p className="text-green-100 text-sm">{t('analytics.perDay')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-100" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {energyData.length > 0 && (
          <div className="space-y-8">
            {/* Energy Trends Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <LineChart className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">{t('analytics.energyTrendsOverTime')}</h3>
              </div>
              <div style={{ height: '400px' }}>
                <Line data={energyTrendData} options={lineChartOptions} />
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Daily Energy Stacked Bar Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('analytics.dailyEnergyBreakdown')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={dailyEnergyData} options={barChartOptions} />
                </div>
              </div>

              {/* Energy Distribution Pie Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <PieChart className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('analytics.totalEnergyDistribution')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Doughnut data={energyDistributionData} options={pieChartOptions} />
                </div>
              </div>

              {/* Temperature Trends */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('analytics.temperatureTrends')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Line data={temperatureTrendData} options={temperatureChartOptions} />
                </div>
              </div>

              {/* Activity Time Chart */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('analytics.systemActivityTime')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={activityTimeData} options={activityTimeChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-12">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('analytics.dailyEnergyCalculations')}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{energyData.length} {t('analytics.daysOfData')}</span>
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
                    {t('analytics.date')} {getSortIcon('date')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('solar_energy_kwh')}
                  >
                    {t('analytics.solarEnergyKwh')} {getSortIcon('solar_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gas_energy_kwh')}
                  >
                    {t('analytics.gasEnergyKwh')} {getSortIcon('gas_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('total_energy_kwh')}
                  >
                    {t('analytics.totalEnergyKwh')} {getSortIcon('total_energy_kwh')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('solar_active_minutes')}
                  >
                    {t('analytics.solarActiveMin')} {getSortIcon('solar_active_minutes')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('gas_active_minutes')}
                  >
                    {t('analytics.gasActiveMin')} {getSortIcon('gas_active_minutes')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_collector_temp')}
                  >
                    {t('analytics.avgCollectorC')} {getSortIcon('avg_collector_temp')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_outside_temp')}
                  >
                    {t('analytics.avgOutsideC')} {getSortIcon('avg_outside_temp')}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {energyData.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('analytics.noEnergyData')}</h3>
              <p className="text-gray-500">{t('analytics.energyCalculationsWillAppear')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};