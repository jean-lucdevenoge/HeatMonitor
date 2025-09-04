import React, { createContext, useCallback, useContext, useMemo, useRef, useState, useEffect } from 'react';
import { HeatingDataService } from '../services/heatingDataService';
import { calculateMetrics } from '../utils/csvParser';

type HeatingPoint = {
  date: string;
  time?: string;
  // ...your other fields
};

type Metrics = ReturnType<typeof calculateMetrics> | null;

type DataContextValue = {
  heatingData: HeatingPoint[];
  metrics: Metrics;
  dataCount: number;
  lastUpdated: string | null;
  heatingDataLoaded: boolean;
  ensureHeatingData: () => Promise<void>;
  // keep your existing setter for manual overrides if you use it
  setHeatingDataCache: (data: HeatingPoint[], metrics: Metrics, count: number) => void;
  // (optional) expose for special cases
  setHeatingDataLoaded?: (v: boolean) => void;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [heatingData, setHeatingData] = useState<HeatingPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics>(null);
  const [dataCount, setDataCount] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Persist "loaded this session" so remounts won't refetch
  const SESSION_KEY = 'heating_data_loaded_v1';
  const [heatingDataLoaded, setHeatingDataLoaded] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.sessionStorage.getItem(SESSION_KEY) === '1';
  });

  // in-flight guard across re-renders
  const loadingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (heatingDataLoaded) {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    }
  }, [heatingDataLoaded]);

  const setHeatingDataCache = useCallback(
    (data: HeatingPoint[], m: Metrics, count: number) => {
      setHeatingData(data);
      setMetrics(m);
      setDataCount(count);
      setLastUpdated(new Date().toISOString());
    },
    []
  );

  const ensureHeatingData = useCallback(async () => {
    if (heatingDataLoaded || loadingRef.current) return;
    loadingRef.current = true;

    // cancel any previous inflight
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const [data, count] = await Promise.all([
        HeatingDataService.getAllData({ signal: controller.signal }),
        HeatingDataService.getDataCount({ signal: controller.signal }),
      ]);

      if (controller.signal.aborted) return;

      if (Array.isArray(data) && data.length > 0) {
        const m = calculateMetrics(data);
        setHeatingDataCache(data, m, count ?? data.length);
      } else {
        setHeatingDataCache([], null, count ?? 0);
      }

      setHeatingDataLoaded(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('ensureHeatingData error:', err);
      // Do NOT flip loaded true on error; allow caller to retry
      loadingRef.current = false; // unlock so user can retry
    }
  }, [heatingDataLoaded, setHeatingDataCache]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      heatingData,
      metrics,
      dataCount,
      lastUpdated,
      heatingDataLoaded,
      ensureHeatingData,
      setHeatingDataCache,
      setHeatingDataLoaded, // optional exposure
    }),
    [heatingData, metrics, dataCount, lastUpdated, heatingDataLoaded, ensureHeatingData, setHeatingDataCache]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
};
