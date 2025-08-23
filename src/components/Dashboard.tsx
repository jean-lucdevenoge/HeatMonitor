import React, { useState } from 'react';
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
import { FileUpload } from './FileUpload';
import { parseHeatingCSV, calculateMetrics } from '../utils/csvParser';
import { Calendar, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const [heatingData, setHeatingData] = useState<HeatingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const parsedData = parseHeatingCSV(text);
      
      // Filter out duplicate data points based on date and time
      const newDataPoints = parsedData.filter(newPoint => {
        return !heatingData.some(existingPoint => 
          existingPoint.date === newPoint.date && 
          existingPoint.time === newPoint.time
        );
      });
      
      // Only add if there are new data points
      if (newDataPoints.length === 0) {
        console.log('No new data points found - file may have already been uploaded');
        setIsProcessing(false);
        return;
      }
      
      // Combine new data with existing data
      const combinedData = [...heatingData, ...newDataPoints];
      
      // Sort by date and time to maintain chronological order
      combinedData.sort((a, b) => {
        const dateA = new Date(`${a.date.split('.').reverse().join('-')} ${a.time}`);
        const dateB = new Date(`${b.date.split('.').reverse().join('-')} ${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      const calculatedMetrics = calculateMetrics(combinedData);
      
      setHeatingData(combinedData);
      setMetrics(calculatedMetrics);
      setLastUpdated(new Date().toLocaleString());
      
      console.log(`Added ${newDataPoints.length} new data points`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
    } finally {
      setIsProcessing(false);
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
        {heatingData.length === 0 && (
          <div className="mb-8">
            <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
          </div>
        )}

        {/* Status Banner */}
        {heatingData.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="w-6 h-6" />
                  <div>
                    <h3 className="text-lg font-semibold">{t('dashboard.historicalData')}</h3>
                    <p className="opacity-90">{t('dashboard.analyzingPoints')} {heatingData.length} {t('dashboard.dataPoints')}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm opacity-90">{t('dashboard.dataRange')}</p>
                  <p className="font-semibold">
                    {heatingData[0]?.date} - {latestData?.date}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {heatingData.length > 0 && metrics ? (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <MetricsCards metrics={metrics} />

            <div className="grid grid-cols-1 gap-8">
              <SolarActivityChart data={heatingData} />
              <EnergyChart data={heatingData} />
              <GasPowerChart data={heatingData} />
              <CombinedPowerChart data={heatingData} />
            </div>

            {/* Additional Upload for New Data */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Add More Historical Data
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Upload additional CSV files to expand your historical analysis. Data will be combined and sorted chronologically.
              </p>
              <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
            </div>
          </div>
        ) : !isProcessing && (
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