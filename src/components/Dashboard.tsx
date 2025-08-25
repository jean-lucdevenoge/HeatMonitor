import React, { useState } from 'react';
import { useEffect } from 'react';
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
import { Calendar, AlertCircle, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [heatingData, setHeatingData] = useState<HeatingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataCount, setDataCount] = useState(0);

  // Load data from database on component mount
  useEffect(() => {
    loadDataFromDatabase();
  }, []);

  const loadDataFromDatabase = async () => {
    setIsLoading(true);
    try {
      const data = await HeatingDataService.getAllData();
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