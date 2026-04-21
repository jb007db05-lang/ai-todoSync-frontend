import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  center?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '', center = false }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const loader = (
    <div
      className={`
        ${sizeClasses[size]}
        border-zinc-200/50 dark:border-slate-800/50 
        border-t-olive-600 dark:border-t-olive-500 
        rounded-full animate-[spin_0.8s_linear_infinite] ${className}
      `}
    />
  );

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[100px]">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;
