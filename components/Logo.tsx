
import React from 'react';

export const DelpLogoFull: React.FC<{ className?: string }> = ({ className = "h-16" }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="flex items-center space-x-3">
      {/* Triângulos Delp */}
      <div className="flex flex-col items-center">
        <div className="flex space-x-1">
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-red-600"></div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-red-600"></div>
        </div>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[10px] border-t-red-600 mt-1"></div>
      </div>
      {/* Texto Delp */}
      <span className="text-4xl font-black tracking-tighter text-black" style={{ fontFamily: 'sans-serif' }}>delp</span>
    </div>
    <div className="text-red-600 text-[10px] font-medium tracking-[0.2em] mt-1 uppercase">
      paixão em fabricar
    </div>
  </div>
);

export const DelpIcon: React.FC<{ className?: string }> = ({ className = "h-8" }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <div className="flex space-x-1">
      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-red-600"></div>
      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-red-600"></div>
    </div>
    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[7px] border-t-red-600 mt-0.5"></div>
  </div>
);
