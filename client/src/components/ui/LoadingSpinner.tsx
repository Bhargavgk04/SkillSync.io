import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'accent' | 'white' | 'gray';
  thickness?: 'thin' | 'medium' | 'thick';
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  variant = 'primary',
  thickness = 'medium',
  speed = 'normal',
  className = '',
  label = 'Loading...'
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const variantClasses = {
    primary: 'border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400',
    secondary: 'border-purple-200 border-t-purple-600 dark:border-purple-800 dark:border-t-purple-400',
    accent: 'border-emerald-200 border-t-emerald-600 dark:border-emerald-800 dark:border-t-emerald-400',
    white: 'border-white/30 border-t-white',
    gray: 'border-gray-200 border-t-gray-600 dark:border-gray-700 dark:border-t-gray-400'
  };

  const thicknessClasses = {
    thin: 'border-[1.5px]',
    medium: 'border-2',
    thick: 'border-[3px]'
  };

  const speedClasses = {
    slow: 'animate-spin [animation-duration:2s]',
    normal: 'animate-spin [animation-duration:1s]',
    fast: 'animate-spin [animation-duration:0.6s]'
  };

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      role="status" 
      aria-label={label}
    >
      <div 
        className={`
          ${sizeClasses[size]} 
          ${variantClasses[variant]} 
          ${thicknessClasses[thickness]}
          ${speedClasses[speed]}
          rounded-full
          transition-all duration-200 ease-in-out
        `}
      >
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
};

// Additional spinner variants for different use cases
export const LoadingDots: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'gray';
  className?: string;
}> = ({ 
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  const variantClasses = {
    primary: 'bg-blue-600 dark:bg-blue-400',
    secondary: 'bg-purple-600 dark:bg-purple-400',
    gray: 'bg-gray-600 dark:bg-gray-400'
  };

  return (
    <div className={`flex space-x-1 ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} 
            ${variantClasses[variant]}
            rounded-full
            animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Pulsing circle loader
export const LoadingPulse: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}> = ({ 
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const variantClasses = {
    primary: 'bg-blue-600/20 border-blue-600',
    secondary: 'bg-purple-600/20 border-purple-600',
    accent: 'bg-emerald-600/20 border-emerald-600'
  };

  return (
    <div className={`relative ${className}`} role="status" aria-label="Loading">
      <div className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-full
        border-2
        animate-pulse
      `}>
        <div className={`
          absolute inset-2
          ${variantClasses[variant]}
          rounded-full
          animate-ping
        `} />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;