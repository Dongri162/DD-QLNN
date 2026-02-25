
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#003366" />
            <stop offset="100%" stopColor="#0055AA" />
          </linearGradient>
          <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#logoGradient)"/>
        <path d="M20 8L8 14L20 20L32 14L20 8Z" fill="white" fillOpacity="0.9"/>
        <path d="M8 14V26L20 32V20L8 14Z" fill="url(#accentGradient)"/>
        <path d="M32 14V26L20 32V20L32 14Z" fill="#059669"/>
        <circle cx="20" cy="18" r="4" fill="#FCD34D" className="animate-pulse" />
        <path d="M17 23H23V27H17V23Z" fill="white" opacity="0.8"/>
      </svg>
    </div>
  );
};

export default Logo;
