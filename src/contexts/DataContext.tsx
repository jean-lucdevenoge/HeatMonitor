import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type HeatingPoint = { date: string; time: string /* ... */ };

type DataContextType = {
  heatingData: HeatingPoint[];
  metrics: any;
  dataCount: number;
  lastUpdated?: string;
  heatingDataLoaded: boolean;
  ensureHeatingData: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, ms = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
};

export const DataProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [heatingData, setHeatingData] = useState<HeatingPoint[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [dataCount, setDataCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);
  const [heatingDataLoaded, setHeatingDataLoaded] = useState<boolean>(false);

  // Replace '/api/heating' with your real endpoint
  const fetchHeatingData = useCallback(async () => {
    try {
      const res = await fetchWithTimeout('/api/heating', {}, 10000); // 10s timeout
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Expected shape: { data: HeatingPoint[], metrics: any, dataCount: number, lastUpdated: string }
      const json = await res.json();
      return json as { data: HeatingPoint[]; metrics: any; dataCount: number; lastUpdated?: string };
    } catch (err) {
      // Propagate so ensureHeatingData can mark loaded + let UI show an error
      throw err;
    }
  }, []);

  const ensureHeatingData = useCallback(async () => {
    if (heatingDataLoaded) return; // already loaded (even if empty/error handled)

    try {
      const result = await fetchHeatingData();
      setHeatingData(result?.data ?? []);
      setMetrics(result?.metrics ?? null);
      setDataCount(result?.dataCount ?? 0);
      setLastUpdated(result?.lastUpdated);
    } catch (e) {
      // Swallow here so the caller can decide UI error, but we still mark as "loaded"
      console.error('ensureHeatingData failed:', e);
    } finally {
      // Critical: always mark as loaded so the spinner can stop
      setHeatingDataLoaded(true);
    }
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
  if (!ctx) throw new Error('useData must be used within a <DataProvider>.');
  return ctx;
};
