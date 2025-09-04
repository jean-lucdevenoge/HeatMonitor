import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { HeatingDataPoint, SystemMetrics } from '../types/HeatingData';
import { HeatingDataService } from '../services/heatingDataService';
import { EnergyCalculationsService } from '../services/energyCalculationsService';
import { calculateMetrics } from '../utils/csvParser';

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

interface DataContextType {
  // Heating data
  heatingData: HeatingDataPoint[];
  metrics: SystemMetrics | null;
  dataCount: number;
  lastUpdated: string | null;
  
  // Energy calculations
  energyData: EnergyCalculation[];
  
  // Loading states
  isLoadingHeatingData: boolean;
  isLoadingEnergyData: boolean;
  
  // Error states
  heatingDataError: string | null;
  energyDataError: string | null;
  
  // Methods
  refreshHeatingData: () => Promise<void>;
  refreshEnergyData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Heating data state
  const [heatingData, setHeatingData] = useState<HeatingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [dataCount, setDataCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoadingHeatingData, setIsLoadingHeatingData] = useState(true);
  const [heatingDataError, setHeatingDataError] = useState<string | null>(null);
  
  // Energy data state
  const [energyData, setEnergyData] = useState<EnergyCalculation[]>([]);
  const [isLoadingEnergyData, setIsLoadingEnergyData] = useState(true);
  const [energyDataError, setEnergyDataError] = useState<string | null>(null);

  // Load heating data
  const refreshHeatingData = async () => {
    setIsLoadingHeatingData(true);
    setHeatingDataError(null);
    try {
      console.log('Loading heating data from database...');
      const data = await HeatingDataService.getAllData();
      const count = await HeatingDataService.getDataCount();
      
      if (data.length > 0) {
        const calculatedMetrics = calculateMetrics(data);
        setHeatingData(data);
        setMetrics(calculatedMetrics);
        setDataCount(count);
        setLastUpdated(new Date().toLocaleString());
        
        console.log('Heating data loaded successfully:', {
          totalPoints: data.length,
          firstDate: data[0]?.date,
          lastDate: data[data.length - 1]?.date,
        });
      } else {
        setHeatingData([]);
        setMetrics(null);
        setDataCount(0);
      }
    } catch (error) {
      console.error('Error loading heating data:', error);
      setHeatingDataError('Failed to load heating data');
    } finally {
      setIsLoadingHeatingData(false);
    }
  };

  // Load energy calculations
  const refreshEnergyData = async () => {
    setIsLoadingEnergyData(true);
    setEnergyDataError(null);
    try {
      console.log('Loading energy calculations from database...');
      const data = await EnergyCalculationsService.getAllCalculations();
      setEnergyData(data);
      console.log('Energy calculations loaded successfully:', data.length, 'records');
    } catch (error) {
      console.error('Error loading energy calculations:', error);
      setEnergyDataError('Failed to load energy calculations');
    } finally {
      setIsLoadingEnergyData(false);
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    await Promise.all([refreshHeatingData(), refreshEnergyData()]);
  };

  // Load data on mount
  useEffect(() => {
    console.log('DataProvider: Initial data load');
    refreshAllData();
  }, []);

  const value: DataContextType = {
    // Heating data
    heatingData,
    metrics,
    dataCount,
    lastUpdated,
    
    // Energy calculations
    energyData,
    
    // Loading states
    isLoadingHeatingData,
    isLoadingEnergyData,
    
    // Error states
    heatingDataError,
    energyDataError,
    
    // Methods
    refreshHeatingData,
    refreshEnergyData,
    refreshAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};