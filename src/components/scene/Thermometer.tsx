import React from 'react';
import { TemperatureStageConfig } from '../../config/temperature.config';

interface ThermometerProps {
  stageConfig: TemperatureStageConfig;
  visible: boolean;
  position?: { x: number; y: number };
  isPopping?: boolean;
}

export const Thermometer: React.FC<ThermometerProps> = ({ stageConfig, visible, position, isPopping }) => {
  const { temperature, thermometerLevel, thermometerColor } = stageConfig;
  const posX = position?.x ?? 8;
  const posY = position?.y ?? 50;

  return (
    <div
      className={`absolute -translate-y-1/2 z-30 flex flex-col items-center pointer-events-auto ${
        isPopping
          ? 'animate-pop-in'
          : `transition-all duration-300 ease-out ${
              visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-16 scale-0 pointer-events-none'
            }`
      }`}
      style={{
        left: `${posX}%`,
        top: `${posY}%`,
      }}
    >
      {/* Temperature Display Badge */}
      <div
        className="mb-2 bg-slate-900/90 text-white font-black text-xs sm:text-sm md:text-base px-3 py-1 rounded-full border-2 border-amber-300 shadow-xl tracking-wider font-mono transition-all duration-300 scale-105"
        style={{ color: thermometerColor }}
      >
        {temperature}°C
      </div>

      {/* Thermometer Stem + Bulb Body */}
      <div className="relative w-9 sm:w-11 md:w-12 h-44 sm:h-52 md:h-60 bg-white/95 border-3 sm:border-4 border-slate-800 rounded-full p-1 shadow-2xl flex flex-col items-center justify-end backdrop-blur-md">
        {/* Scale Marks overlay */}
        <div className="absolute inset-y-8 left-0 right-0 h-[calc(100%-4rem)] pointer-events-none flex flex-col justify-between items-center z-20 px-0.5 opacity-80">
          {[35, 32, 30, 28, 25].map((mark) => (
            <div key={mark} className="w-full flex items-center justify-between px-1">
              <div className="w-1.5 sm:w-2 h-0.5 bg-slate-800" />
              <span className="text-[8px] sm:text-[9px] font-mono font-black text-slate-800 tracking-tighter">
                {mark}°
              </span>
              <div className="w-1.5 sm:w-2 h-0.5 bg-slate-800" />
            </div>
          ))}
        </div>

        {/* Liquid Column Track */}
        <div className="relative w-3.5 sm:w-4 md:w-5 h-[calc(100%-2.5rem)] bg-slate-200/90 rounded-full overflow-hidden flex flex-col justify-end border border-slate-400/80">
          {/* Liquid Fill Column */}
          <div
            className="w-full rounded-b-full transition-all duration-500 ease-out shadow-inner"
            style={{
              height: `${thermometerLevel}%`,
              backgroundColor: thermometerColor,
            }}
          />
        </div>

        {/* Bulb at Bottom */}
        <div
          className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-3 sm:border-4 border-slate-800 -mt-2.5 z-30 shadow-md transition-colors duration-500 ease-out flex items-center justify-center"
          style={{
            backgroundColor: thermometerColor,
          }}
        >
          {/* Subtle gloss highlight on bulb */}
          <div className="w-2 h-2 rounded-full bg-white/40 -mt-2 -ml-2" />
        </div>
      </div>
    </div>
  );
};
