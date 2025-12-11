import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-24 h-24 text-5xl',
  };

  return (
    <div className={`${sizes[size]} bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-brand-200 transform hover:rotate-3 transition-transform`}>
        <span>ز</span>
    </div>
  );
};
