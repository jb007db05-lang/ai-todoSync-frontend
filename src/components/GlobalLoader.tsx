import React from 'react';
import Loader from './Loader';

interface GlobalLoaderProps {
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message = 'Synchronizing...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        {message && (
          <span className="text-sm font-bold tracking-widest text-olive-900/60 dark:text-slate-100/60 uppercase font-['Outfit'] animate-pulse">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
