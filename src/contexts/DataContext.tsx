import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HeatingPoint = {
  date: string;
  time: string;
  // ...other fields
};

type DataContextType = {
  heatingData: HeatingPoint[];
  metrics: any;
  dataCount: number;
  lastUpdated?: string;
  heatingDataLoaded: boolean;
  ensureHeatingData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [heatingData, setHeatingData] = useState<HeatingPoint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [dataCount, setDataCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const [heatingDataLoaded, setHeatingDataLoaded] = useState<boolean>(false);

  const fetchHeatingData = useCallback(async () => {
    // TODO replace with real API
    return {
      data: [] as HeatingPoint[],
      metrics: null,
      dataCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  const ensureHeatingData = useCallback(async () => {
    if (heatingDataLoaded) return;
    const result = await fetchHeatingData();
    setHeatingData(result.data);
    setMetrics(result.metrics);
    setDataCount(result.dataCount);
    setLastUpdated(result.lastUpdated);
    setHeatingDataLoaded(true);
  }, [fetchHeatingData, heatingDataLoaded]);

  const value = useMemo(
    () => ({
      heatingData,
      metrics,
      dataCount,
      lastUpdated,
      heatingDataLoaded,
      ensureHeatingData,
    }),
    [heatingData, metrics, dataCount, lastUpdated, heatingDataLoaded, ensureHeatingData]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a <DataProvider>.');
  }
  return ctx;
};
