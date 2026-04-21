import React from 'react';
import { createPortal } from 'react-dom';
import { useLoading } from '@/context/LoadingContext';
import Loader from './Loader';

export default function GlobalLoadingSpinner() {
  const { loadingCount } = useLoading();

  if (loadingCount === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <Loader size="lg" />
    </div>,
    document.body
  );
}
