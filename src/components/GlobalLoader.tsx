import React from 'react';
import Loader from './Loader';

interface GlobalLoaderProps {
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/40 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4">
        <Loader size="lg" />
        {message && (
          <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 dark:text-zinc-500 uppercase font-['Outfit'] animate-pulse">
            {message}
          </span>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;
