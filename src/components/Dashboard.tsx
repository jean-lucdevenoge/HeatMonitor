import React, { useState, useEffect } from 'react';
import { MetricsCards } from './MetricsCards';
import { SolarActivityChart } from './SolarActivityChart';
import { EnergyChart } from './EnergyChart';
import { GasPowerChart } from './GasPowerChart';
import { CombinedPowerChart } from './CombinedPowerChart';
import { Calendar, AlertCircle, BarChart3, Filter, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { HeatingDataService } from '../services/heatingDataService';
import { calculateMetrics } from '../utils/csvParser';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const {
    heatingData,
    metrics,
    dataCount,
    lastUpdated,
    heatingDataLoaded,
    setHeatingDataCache
  } = useData();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredData, setFilteredData] = useState(heatingData);

  // Initialize date filter to last 5 days
  useEffect(() => {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(fiveDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Filter data when dates change or heatingData changes
  useEffect(() => {
    if (!startDate || !endDate || heatingData.length === 0) {
      setFilteredData(heatingData);
      return;
    }

    const startDateTime = new Date(startDate + 'T00:00:00');
    const endDateTime = new Date(endDate + 'T23:59:59');

    const filtered = heatingData.filter(point => {
      // Convert DD.MM.YYYY HH:MM to Date object for comparison
      const [day, month, year] = point.date.split('.');
      const [hours, minutes] = point.time.split(':');
      const pointDate = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
      
      return pointDate >= startDateTime && pointDate <= endDateTime;
    });

    setFilteredData(filtered);
  }, [startDate, endDate, heatingData]);

  // Load data only when user explicitly requests it
  useEffect(() => {
    // Only auto-load if we have no data and haven't loaded before
    if (!heatingDataLoaded && heatingData.length === 0 && !isLoading) {
      loadHeatingData();
    }
  }, []); // Empty dependency - runs only once on mount

  const loadHeatingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Loading heating data from database...');
      const data = await HeatingDataService.getAllData();
      const count = await HeatingDataService.getDataCount();
      
      if (data.length > 0) {
        const calculatedMetrics = calculateMetrics(data);
        setHeatingDataCache(data, calculatedMetrics, count);
        
        console.log('Heating data loaded successfully:', {
          totalPoints: data.length,
          firstDate: data[0]?.date,
          lastDate: data[data.length - 1]?.date,
        });
      } else {
        setHeatingDataCache([], null, 0);
      }
    } catch (err) {
      console.error('Error loading heating data:', err);
      setError('Failed to load heating data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    loadHeatingData();
  };

  const clearDateFilter = () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(today.getDate() - 5);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(fiveDaysAgo.toISOString().split('T')[0]);
    setShowDateFilter(false);
  };

  // Calculate metrics for filtered data
  const filteredMetrics = filteredData.length > 0 ? calculateMetrics(filteredData) : metrics;
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
            
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              {/* Date Filter Button */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
              
              {lastUpdated && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>{t('dashboard.lastUpdated')}: {lastUpdated}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date Filter Panel */}
          {showDateFilter && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredData.length} of {heatingData.length} data points
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <button
                    onClick={clearDateFilter}
                    className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                  <button
                    onClick={() => setShowDateFilter(false)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Status */}
        {filteredData.length !== heatingData.length && heatingData.length > 0 && (
          <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Filtered view: Showing {filteredData.length} of {heatingData.length} data points 
                ({startDate} to {endDate})
              </span>
            </div>
          </div>
        )}

        {/* No Data State */}
        {filteredData.length === 0 && heatingData.length === 0 && !isLoading && !error && (
          <div className="mb-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noData')}</h3>
              <p className="text-gray-500">Data is automatically imported from email attachments every night at 4 AM European time.</p>
            </div>
          </div>
        )}

        {/* No Filtered Data State */}
        {filteredData.length === 0 && heatingData.length > 0 && !isLoading && !error && (
          <div className="mb-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data in Selected Range</h3>
              <p className="text-gray-500">No data found between {startDate} and {endDate}. Try adjusting the date range.</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Data</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
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
        {filteredData.length > 0 && !isLoading && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.historicalData')}</h3>
                    <p className="opacity-90">{t('dashboard.analyzingPoints')} {filteredData.length} {t('dashboard.dataPoints')} (Total: {heatingData.length})</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm opacity-90">{t('dashboard.dataRange')}</p>
                  <p className="font-semibold">
                    {filteredData.length > 0 ? `${filteredData[0]?.date} ${filteredData[0]?.time} - ${filteredData[filteredData.length - 1]?.date} ${filteredData[filteredData.length - 1]?.time}` : 'No data'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {filteredData.length > 0 && filteredMetrics && !isLoading ? (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <MetricsCards metrics={filteredMetrics} />

            <div className="grid grid-cols-1 gap-8">
              <SolarActivityChart data={filteredData} />
              <EnergyChart data={filteredData} />
              <GasPowerChart data={filteredData} />
              <CombinedPowerChart data={filteredData} />
            </div>
          </div>
        ) : !isLoading && !error && (
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