import React from 'react';

interface GlobalLoaderProps {
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ message = 'Synchronizing...' }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <div className="absolute inset-4 w-8 h-8 rounded-full bg-blue-500/10 animate-pulse" />
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 font-['Outfit']">
            {message}
          </span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;
