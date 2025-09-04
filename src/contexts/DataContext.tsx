import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type HeatingPoint = {
  date: string;
  time: string;
  // ...other fields you have
};

type DataContextType = {
  heatingData: HeatingPoint[];
  metrics: any; // replace with your actual type
  dataCount: number;
  lastUpdated?: string;
  heatingDataLoaded: boolean;
  ensureHeatingData: () => Promise<void>;
};

const DataContext = createContext<DataContextType>(null as unknown as DataContextType);

export const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [heatingData, setHeatingData] = useState<HeatingPoint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [dataCount, setDataCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const [heatingDataLoaded, setHeatingDataLoaded] = useState<boolean>(false);

  // Example: fetch data from your API only when needed.
  const fetchHeatingData = useCallback(async () => {
    // TODO: replace with your API call
    // const res = await fetch('/api/heating');
    // const json = await res.json();
    // return json as { data: HeatingPoint[]; metrics: any; dataCount: number; lastUpdated: string };

    return {
      data: [] as HeatingPoint[],
      metrics: null,
      dataCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }, []);

  // Stable loader used by Dashboard (and others)
  const ensureHeatingData = useCallback(async () => {
    // If we've already loaded once, skip
    if (heatingDataLoaded) return;

    const result = await fetchHeatingData();

    // Only set state if something actually changed
    setHeatingData(prev => {
      const sameLength = prev.length === result.data.length;
      // You can add deeper equality checks if needed
      if (sameLength && heatingDataLoaded) return prev;
      return result.data;
    });

    setMetrics(result.metrics);
    setDataCount(result.dataCount);
    setLastUpdated(result.lastUpdated);
    setHeatingDataLoaded(true);
  }, [fetchHeatingData, heatingDataLoaded]);

  const value = useMemo<DataContextType>(() => ({
    heatingData,
    metrics,
    dataCount,
    lastUpdated,
    heatingDataLoaded,
    ensureHeatingData,
  }), [heatingData, metrics, dataCount, lastUpdated, heatingDataLoaded, ensureHeatingData]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
