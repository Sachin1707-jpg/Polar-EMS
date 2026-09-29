/**
 * Data Mode Context
 * Manages switching between simulation and live data modes
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_CONFIG } from '@/config/api';

type DataMode = 'simulation' | 'live';

interface DataModeContextType {
  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;
  isSimulation: boolean;
  isLive: boolean;
}

const DataModeContext = createContext<DataModeContextType | undefined>(undefined);

export function DataModeProvider({ children }: { children: React.ReactNode }) {
  const [dataMode, setDataModeState] = useState<DataMode>(API_CONFIG.dataMode);

  const setDataMode = (mode: DataMode) => {
    setDataModeState(mode);
    localStorage.setItem('data_mode', mode);
  };

  useEffect(() => {
    // Load saved data mode from localStorage
    const savedMode = localStorage.getItem('data_mode') as DataMode;
    if (savedMode && (savedMode === 'simulation' || savedMode === 'live')) {
      setDataModeState(savedMode);
    }
  }, []);

  const value: DataModeContextType = {
    dataMode,
    setDataMode,
    isSimulation: dataMode === 'simulation',
    isLive: dataMode === 'live',
  };

  return <DataModeContext.Provider value={value}>{children}</DataModeContext.Provider>;
}

export function useDataMode() {
  const context = useContext(DataModeContext);
  if (context === undefined) {
    throw new Error('useDataMode must be used within a DataModeProvider');
  }
  return context;
}
