import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  loadingCount: number;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Helper for non-React files (like api.ts)
let startLoadingFn: (() => void) | null = null;
let stopLoadingFn: (() => void) | null = null;

export const startGlobalLoading = () => startLoadingFn?.();
export const stopGlobalLoading = () => stopLoadingFn?.();

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Register the global helpers
  React.useEffect(() => {
    startLoadingFn = startLoading;
    stopLoadingFn = stopLoading;
    return () => {
      startLoadingFn = null;
      stopLoadingFn = null;
    };
  }, [startLoading, stopLoading]);

  return (
    <LoadingContext.Provider value={{ loadingCount, startLoading, stopLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};