import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Flame, Thermometer, BarChart3, AlertCircle, LineChart } from 'lucide-react';
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
  TimeScale,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { HouseHeatingCalculationsService, HouseHeatingCalculation } from '../services/houseHeatingCalculationsService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  Filler
);

export const HouseHeatingAnalyticsDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [heatingData, setHeatingData] = useState<HouseHeatingCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof HouseHeatingCalculation>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadHeatingData();
  }, []);

  const loadHeatingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Loading house heating calculations from database...');
      const data = await HouseHeatingCalculationsService.getAllCalculations();

      if (data.length === 0) {
        console.log('No house heating calculations found. Triggering calculation...');
        await triggerCalculation();
        const newData = await HouseHeatingCalculationsService.getAllCalculations();
        setHeatingData(newData);
        console.log('House heating calculations loaded successfully:', newData.length, 'records');
      } else {
        setHeatingData(data);
        console.log('House heating calculations loaded successfully:', data.length, 'records');
      }
    } catch (err) {
      console.error('Error loading house heating calculations:', err);
      setError('Failed to load house heating calculations');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCalculation = async () => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-house-heating`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      console.log('Calling calculate-house-heating edge function...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to trigger calculation: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Calculation completed:', result);
    } catch (error) {
      console.error('Error triggering calculation:', error);
      throw error;
    }
  };

  const handleRetry = () => {
    loadHeatingData();
  };

  const handleSort = (field: keyof HouseHeatingCalculation) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...heatingData].sort((a, b) => {
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

  const totalHeatingEnergy = heatingData.reduce((sum, day) => sum + (day.house_heating_energy_kwh ?? 0), 0);
  const avgDailyEnergy = heatingData.length > 0 ? totalHeatingEnergy / heatingData.length : 0;
  const totalActiveHours = heatingData.reduce((sum, day) => sum + ((day.house_heating_active_minutes ?? 0) / 60), 0);
  const avgActiveHoursPerDay = heatingData.length > 0 ? totalActiveHours / heatingData.length : 0;

  const chartLabels = heatingData.map(day => {
    try {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
    } catch {
      return day.date;
    }
  });

  const energyTrendData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('houseHeating.heatingEnergy'),
        data: heatingData.map(day => day.house_heating_energy_kwh ?? 0),
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        fill: true,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#DC2626',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
    ],
  };

  const dailyEnergyData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('houseHeating.heatingEnergy'),
        data: heatingData.map(day => day.house_heating_energy_kwh ?? 0),
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        borderWidth: 1,
      },
    ],
  };

  const temperatureTrendData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('houseHeating.avgFlowTemp'),
        data: heatingData.map(day => day.avg_flow_temp ?? 0),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#F59E0B',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
      {
        label: t('houseHeating.avgOutsideTemp'),
        data: heatingData.map(day => day.avg_outside_temp ?? 0),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointBorderWidth: 1,
      },
    ],
  };

  const activityTimeData = {
    labels: chartLabels,
    datasets: [
      {
        label: t('houseHeating.activeHours'),
        data: heatingData.map(day => (day.house_heating_active_minutes ?? 0) / 60),
        backgroundColor: '#DC2626',
        borderColor: '#B91C1C',
        borderWidth: 1,
      },
    ],
  };

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
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Energy (kWh)',
        },
      },
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

  const activityChartOptions = {
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
          text: 'Hours',
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

  const getSortIcon = (field: keyof HouseHeatingCalculation) => {
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
            onClick={handleRetry}
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
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Flame className="w-8 h-8 text-red-600" />
            <h2 className="text-3xl font-bold text-gray-900">{t('houseHeating.title')}</h2>
          </div>
          <p className="text-gray-600">{t('houseHeating.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">{t('houseHeating.totalEnergy')}</p>
                <p className="text-2xl font-bold">{totalHeatingEnergy.toFixed(1)} kWh</p>
                <p className="text-red-100 text-sm">{heatingData.length} {t('analytics.daysAnalyzed')}</p>
              </div>
              <Flame className="w-8 h-8 text-red-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t('houseHeating.avgDailyEnergy')}</p>
                <p className="text-2xl font-bold">{avgDailyEnergy.toFixed(1)} kWh</p>
                <p className="text-blue-100 text-sm">{t('analytics.perDay')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('houseHeating.avgActiveHours')}</p>
                <p className="text-2xl font-bold">{avgActiveHoursPerDay.toFixed(1)} hrs</p>
                <p className="text-green-100 text-sm">{t('analytics.perDay')}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-100" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">{t('houseHeating.totalActiveHours')}</p>
                <p className="text-2xl font-bold">{totalActiveHours.toFixed(1)} hrs</p>
                <p className="text-orange-100 text-sm">{t('houseHeating.total')}</p>
              </div>
              <Thermometer className="w-8 h-8 text-orange-100" />
            </div>
          </div>
        </div>

        {heatingData.length > 0 && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <LineChart className="w-6 h-6 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">{t('houseHeating.energyTrends')}</h3>
              </div>
              <div style={{ height: '400px' }}>
                <Line data={energyTrendData} options={lineChartOptions} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('houseHeating.dailyEnergyBreakdown')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={dailyEnergyData} options={barChartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <Thermometer className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('houseHeating.temperatureTrends')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Line data={temperatureTrendData} options={temperatureChartOptions} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">{t('houseHeating.dailyActivity')}</h3>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={activityTimeData} options={activityChartOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-12">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('houseHeating.dailyCalculations')}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{heatingData.length} {t('analytics.daysOfData')}</span>
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
                    onClick={() => handleSort('house_heating_energy_kwh')}
                  >
                    {t('houseHeating.energyKwh')} {getSortIcon('house_heating_energy_kwh')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('house_heating_active_minutes')}
                  >
                    {t('houseHeating.activeMinutes')} {getSortIcon('house_heating_active_minutes')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_flow_temp')}
                  >
                    {t('houseHeating.avgFlowTempC')} {getSortIcon('avg_flow_temp')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_outside_temp')}
                  >
                    {t('houseHeating.avgOutsideTempC')} {getSortIcon('avg_outside_temp')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('avg_boiler_modulation')}
                  >
                    {t('houseHeating.avgModulation')} {getSortIcon('avg_boiler_modulation')}
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
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        {(day.house_heating_energy_kwh ?? 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.house_heating_active_minutes ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.avg_flow_temp ?? 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.avg_outside_temp ?? 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(day.avg_boiler_modulation ?? 0).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {heatingData.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('houseHeating.noData')}</h3>
              <p className="text-gray-500">{t('houseHeating.noDataDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
