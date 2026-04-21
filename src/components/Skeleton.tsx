import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangle' | 'circle' | 'text';
  width?: string | number;
  height?: string | number;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangle', 
  width, 
  height 
}) => {
  const variantClasses = {
    rectangle: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      className={`
        relative overflow-hidden bg-zinc-100 dark:bg-slate-800
        ${variantClasses[variant]}
        ${className}
      `}
      style={{ width, height }}
    >
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
};

export default Skeleton;
