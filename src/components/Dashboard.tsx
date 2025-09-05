import React, { useState } from 'react';
import { useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { HeatingDataPoint, SystemMetrics } from '../types/HeatingData';
import { MetricsCards } from './MetricsCards';
import { TemperatureChart } from './TemperatureChart';
import { SystemStatus } from './SystemStatus';
import { EfficiencyChart } from './EfficiencyChart';
import { PressureChart } from './PressureChart';
import { SolarActivityChart } from './SolarActivityChart';
import { EnergyChart } from './EnergyChart';
import { GasPowerChart } from './GasPowerChart';
import { CombinedPowerChart } from './CombinedPowerChart';
import { parseHeatingCSV, calculateMetrics } from '../utils/csvParser';
import { HeatingDataService } from '../services/heatingDataService';
import { Calendar, AlertCircle, BarChart3, Filter, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [heatingData, setHeatingData] = useState<HeatingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataCount, setDataCount] = useState(0);
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to 5 days ago
    return format(subDays(new Date(), 5), 'yyyy-MM-dd');
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Default to today
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [isFiltering, setIsFiltering] = useState(false);

  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, [startDate, endDate]);

  const loadDataFromDatabase = async () => {
    setIsLoading(true);
    try {
      // Convert YYYY-MM-DD to DD.MM.YYYY format for database query
      const formatDateForDb = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${day}.${month}.${year}`;
      };

      const dbStartDate = formatDateForDb(startDate);
      const dbEndDate = formatDateForDb(endDate);
      
      console.log(`Loading data from ${dbStartDate} to ${dbEndDate}`);
      
      const data = await HeatingDataService.getDataByDateRange(dbStartDate, dbEndDate);
      const count = await HeatingDataService.getDataCount();
      
      if (data.length > 0) {
        const calculatedMetrics = calculateMetrics(data);
        setHeatingData(data);
        setMetrics(calculatedMetrics);
        setDataCount(count);
        setLastUpdated(new Date().toLocaleString());
        
        // Log data range for debugging
        console.log('=== DASHBOARD DATA LOADED ===');
        console.log('Total points:', data.length);
        console.log('First record:', data[0]);
        console.log('Last record:', data[data.length - 1]);
        console.log('Date range display will show:', {
          start: `${data[0]?.date} ${data[0]?.time}`,
          end: `${data[data.length - 1]?.date} ${data[data.length - 1]?.time}`
        });
        console.log('Raw data sample (first 3):', data.slice(0, 3));
        console.log('Raw data sample (last 3):', data.slice(-3));
        console.log('================================');
        
        console.log('Data loaded (summary):', {
          totalPoints: data.length,
          dateRange: `${dbStartDate} - ${dbEndDate}`,
          firstDate: data[0]?.date,
          firstTime: data[0]?.time,
          lastDate: data[data.length - 1]?.date,
          lastTime: data[data.length - 1]?.time,
          dateRange: `${data[0]?.date} ${data[0]?.time} - ${data[data.length - 1]?.date} ${data[data.length - 1]?.time}`
        });
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateFilterChange = () => {
    setIsFiltering(true);
    // The useEffect will trigger loadDataFromDatabase when dates change
    setTimeout(() => setIsFiltering(false), 500);
  };

  const resetToLast5Days = () => {
    setStartDate(format(subDays(new Date(), 5), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
  };
  const latestData = heatingData.length > 0 ? heatingData[heatingData.length - 1] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h2>
              <p className="text-gray-600">{t('dashboard.subtitle')}</p>
            </div>
            
            {lastUpdated && (
              <div className="mt-4 sm:mt-0 flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{t('dashboard.lastUpdated')}: {lastUpdated}</span>
              </div>
            )}
          </div>
          
          {/* Date Filter Section */}
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Date Filter</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <label htmlFor="start-date" className="text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex flex-col">
                    <label htmlFor="end-date" className="text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDateFilterChange}
                    disabled={isFiltering}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isFiltering ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Filter className="w-4 h-4" />
                    )}
                    <span>{isFiltering ? 'Filtering...' : 'Apply Filter'}</span>
                  </button>
                  
                  <button
                    onClick={resetToLast5Days}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Last 5 Days
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium">Current Range:</span> {startDate} to {endDate}
              {heatingData.length > 0 && (
                <span className="ml-4">
                  <span className="font-medium">Data Points:</span> {heatingData.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* File Upload */}
        {heatingData.length === 0 && !isLoading && (
          <div className="mb-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noData')}</h3>
              <p className="text-gray-500">Data is automatically imported from email attachments every night at 4 AM European time.</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mr-3"></div>
            <span className="text-gray-600">Loading heating data...</span>
          </div>
        )}

        {/* Status Banner */}
        {heatingData.length > 0 && !isLoading && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.historicalData')}</h3>
                    <p className="opacity-90">
                      {t('dashboard.analyzingPoints')} {heatingData.length} {t('dashboard.dataPoints')} 
                      <span className="ml-2 text-sm">({startDate} to {endDate})</span>
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm opacity-90">{t('dashboard.dataRange')}</p>
                  <p className="font-semibold">
                    {heatingData.length > 0 ? `${heatingData[0]?.date} ${heatingData[0]?.time} - ${heatingData[heatingData.length - 1]?.date} ${heatingData[heatingData.length - 1]?.time}` : 'No data'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {heatingData.length > 0 && metrics && !isLoading ? (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            <div className="grid grid-cols-1 gap-8">
              <SolarActivityChart data={heatingData} />
              <EnergyChart data={heatingData} />
              <GasPowerChart data={heatingData} />
              <CombinedPowerChart data={heatingData} />
            </div>
          </div>
        ) : !isLoading && (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noData')}</h3>
            <p className="text-gray-500">{t('dashboard.uploadCsv')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
