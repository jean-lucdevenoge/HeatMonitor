import React, { useState, useEffect } from 'react';
import { MetricsCards } from './MetricsCards';
import { SolarActivityChart } from './SolarActivityChart';
import { EnergyChart } from './EnergyChart';
import { GasPowerChart } from './GasPowerChart';
import { CombinedPowerChart } from './CombinedPowerChart';
import { Calendar, AlertCircle, BarChart3 } from 'lucide-react';
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

  // Load data only if not already loaded
  useEffect(() => {
    if (!heatingDataLoaded) {
      loadHeatingData();
    }
  }, [heatingDataLoaded]);

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
        </div>

        {/* No Data State */}
        {heatingData.length === 0 && !isLoading && !error && (
          <div className="mb-8">
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('dashboard.noData')}</h3>
              <p className="text-gray-500">Data is automatically imported from email attachments every night at 4 AM European time.</p>
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
        {heatingData.length > 0 && !isLoading && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.historicalData')}</h3>
                    <p className="opacity-90">{t('dashboard.analyzingPoints')} {heatingData.length} {t('dashboard.dataPoints')} (DB: {dataCount})</p>
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