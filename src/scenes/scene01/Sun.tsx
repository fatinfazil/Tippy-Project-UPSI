import React from 'react';
import { TemperatureStageConfig } from './temperature.config';

interface SunProps {
  stageConfig: TemperatureStageConfig;
  visible: boolean;
  isPopping?: boolean;
}

export const Sun: React.FC<SunProps> = ({ stageConfig, visible, isPopping }) => {
  const { sunScale, sunCenterColor, sunRayColor, sunSaturation } = stageConfig;

  // 8 radiating sun rays
  const rays = Array.from({ length: 8 });

  return (
    <div
      className={`absolute z-20 pointer-events-none ${
        isPopping
          ? 'animate-pop-in-smooth'
          : `transition-all duration-1000 ease-out ${
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
            }`
      }`}
      style={{
        left: '64%',
        top: '18%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center"
        style={{
          transform: `scale(${sunScale})`,
          filter: `saturate(${sunSaturation}%) drop-shadow(0 0 16px ${sunCenterColor}80)`,
          transition: 'transform 500ms ease, filter 500ms ease',
        }}
      >
        {/* Sun Rays */}
        {rays.map((_, i) => (
          <div
            key={i}
            className="absolute w-2.5 h-6 sm:w-3 sm:h-7 md:w-3.5 md:h-8 rounded-full shadow-sm"
            style={{
              backgroundColor: sunRayColor,
              transform: `rotate(${i * 45}deg) translateY(-145%)`,
              transition: 'background-color 500ms ease',
            }}
          />
        ))}

        {/* Sun Center Body */}
        <div
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full shadow-md z-10 border-2 border-amber-200/50"
          style={{
            backgroundColor: sunCenterColor,
            transition: 'background-color 500ms ease',
          }}
        />
      </div>
    </div>
  );
};
