
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", showText = true }) => {
  return (
    <div className="flex items-center gap-2 select-none">
      <img
        src="/logo.svg"
        alt="Monday Logo"
        className={className}
      />

      {showText && (
        <span className="text-2xl font-extrabold tracking-tight hidden sm:block">
          <span className="text-gray-800">Monday</span>
          <span className="text-[#4255ff]">Quizlet</span>
        </span>
      )}
    </div>
  );
};
