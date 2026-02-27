'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UIContextValue {
  /** Whether the app is rendering in dark mode */
  isDarkMode: boolean;
  /** Toggle or explicitly set dark mode */
  setIsDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  /** Key that increments whenever the listening history should be refreshed */
  historyRefreshKey: number;
  /** Call this to signal that the listening history UI should refetch */
  refreshHistory: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const UIContext = createContext<UIContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState<number>(0);

  const refreshHistory = useCallback(() => {
    setHistoryRefreshKey((prev) => prev + 1);
  }, []);

  const value: UIContextValue = {
    isDarkMode,
    setIsDarkMode,
    historyRefreshKey,
    refreshHistory,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useUIContext(): UIContextValue {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUIContext must be used within a UIProvider');
  }
  return context;
}
