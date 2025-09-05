import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HeatingDataPoint, SystemMetrics } from '../types/HeatingData';

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
  // Heating data cache
  heatingData: HeatingDataPoint[];
  metrics: SystemMetrics | null;
  dataCount: number;
  lastUpdated: string | null;
  heatingDataLoaded: boolean;
  
  // Energy calculations cache
  energyData: EnergyCalculation[];
  energyDataLoaded: boolean;
  
  // Cache setters
  setHeatingDataCache: (data: HeatingDataPoint[], metrics: SystemMetrics | null, count: number) => void;
  setEnergyDataCache: (data: EnergyCalculation[]) => void;
  
  // Cache status
  clearCache: () => void;
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
  // Heating data cache
  const [heatingData, setHeatingData] = useState<HeatingDataPoint[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [dataCount, setDataCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [heatingDataLoaded, setHeatingDataLoaded] = useState(false);
  
  // Energy data cache
  const [energyData, setEnergyData] = useState<EnergyCalculation[]>([]);
  const [energyDataLoaded, setEnergyDataLoaded] = useState(false);

  const setHeatingDataCache = (data: HeatingDataPoint[], calculatedMetrics: SystemMetrics | null, count: number) => {
    setHeatingData(data);
    setMetrics(calculatedMetrics);
    setDataCount(count);
    setLastUpdated(new Date().toLocaleString());
    setHeatingDataLoaded(true);
  };

  const setEnergyDataCache = (data: EnergyCalculation[]) => {
    setEnergyData(data);
    setEnergyDataLoaded(true);
  };

  const clearCache = () => {
    setHeatingData([]);
    setMetrics(null);
    setDataCount(0);
    setLastUpdated(null);
    setHeatingDataLoaded(false);
    setEnergyData([]);
    setEnergyDataLoaded(false);
  };

  const value: DataContextType = {
    // Heating data cache
    heatingData,
    metrics,
    dataCount,
    lastUpdated,
    heatingDataLoaded,
    
    // Energy calculations cache
    energyData,
    energyDataLoaded,
    
    // Cache setters
    setHeatingDataCache,
    setEnergyDataCache,
    
    // Cache management
    clearCache,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};