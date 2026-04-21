import React from 'react';
import { createPortal } from 'react-dom';
import { useLoading } from '@/context/LoadingContext';

export default function GlobalLoadingSpinner() {
  const { loadingCount } = useLoading();

  if (loadingCount === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/20 backdrop-blur-[4px] animate-fadeIn transition-all duration-300">
      <div className="relative flex flex-col items-center justify-center p-12 rounded-[3rem] bg-white/40 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
        
        {/* Modern Multi-Orbit Spinner */}
        <div className="relative w-20 h-20">
          {/* Centering Glow */}
          <div className="absolute inset-0 rounded-full bg-olive-500/10 blur-[20px] animate-pulse" />
          
          {/* Outer Ring: Dash animation */}
          <div className="absolute inset-x-0 inset-y-0 rounded-full border-2 border-dashed border-olive-500/20 dark:border-olive-400/20 animate-[spin_10s_linear_infinite]" />
          
          {/* Middle Ring: Main gradient spin */}
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-olive-500 dark:border-t-olive-400 border-r-emerald-500/30 animate-[spin_1.5s_linear_infinite]" />
          
          {/* Inner Ring: Reverse spin */}
          <div className="absolute inset-5 rounded-full border-[3px] border-transparent border-b-teal-500/60 border-l-olive-400/20 animate-[spin_1s_linear_infinite_reverse]" />
          
          {/* Core Dot: Pulsing */}
          <div className="absolute inset-[34px] rounded-full bg-olive-600 dark:bg-olive-400 shadow-[0_0_12px_rgba(132,143,62,0.8)] animate-pulse" />
        </div>
      </div>
    </div>,
    document.body
  );
}
