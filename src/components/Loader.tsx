import React from 'react';
import logoImg from '@/assets/logo.png';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  center?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ size = 'md', className = '', center = false }) => {
  const outerSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const ringSizeClasses = {
    sm: 'w-8 h-8 border-2',
    md: 'w-12 h-12 border-2',
    lg: 'w-16 h-16 border-2'
  };

  const logoSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const loader = (
    <div className={`relative flex items-center justify-center ${outerSizeClasses[size]} ${className}`}>
      {/* Spinning outer compliance ring */}
      <div
        className={`
          absolute
          ${ringSizeClasses[size]}
          border-neutral-200/60
          border-t-emerald-600
          rounded-full
          animate-spin
        `}
      />
      {/* Pristine Logo inside loader */}
      <img
        src={logoImg}
        alt="Pristine Logo"
        className={`absolute ${logoSizeClasses[size]} object-contain animate-pulse`}
      />
    </div>
  );

  if (center) {
    return (
      <div className="flex items-center justify-center w-full h-full min-h-[120px]">
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;