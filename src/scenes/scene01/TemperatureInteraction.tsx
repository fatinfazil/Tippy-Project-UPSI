import React, { useState } from 'react';
import { TEMPERATURE_STAGES, TemperatureStageConfig } from './temperature.config';
import { Sun } from './Sun';
import { Thermometer } from './Thermometer';
import { Plus, Minus } from 'lucide-react';
import { playPopSound } from '../../utils/soundEffects';

interface TemperatureInteractionProps {
  visible: boolean;
  temperatureStage: number;
  hasReachedStage4: boolean;
  onIncreaseStage: () => void;
  onDecreaseStage: () => void;
  position?: { x: number; y: number; gap: number };
  isSunVisible?: boolean;
  isSunPopping?: boolean;
  isThermoVisible?: boolean;
  isThermoPopping?: boolean;
  isInteractionEnabled?: boolean;
}

export const TemperatureInteraction: React.FC<TemperatureInteractionProps> = ({
  visible,
  temperatureStage,
  hasReachedStage4,
  onIncreaseStage,
  onDecreaseStage,
  position,
  isSunVisible = visible,
  isSunPopping = false,
  isThermoVisible = visible,
  isThermoPopping = false,
  isInteractionEnabled = true,
}) => {
  const stageConfig: TemperatureStageConfig =
    TEMPERATURE_STAGES[temperatureStage] || TEMPERATURE_STAGES[1];

  const [isLocked, setIsLocked] = useState<boolean>(false);

  const handlePlusClick = () => {
    if (!isInteractionEnabled || isLocked || temperatureStage >= 4) return;
    setIsLocked(true);
    playPopSound(1.2 + temperatureStage * 0.15);
    onIncreaseStage();
    setTimeout(() => setIsLocked(false), 400);
  };

  const handleMinusClick = () => {
    if (!isInteractionEnabled || isLocked || temperatureStage <= 1) return;
    setIsLocked(true);
    playPopSound(0.9 + temperatureStage * 0.1);
    onDecreaseStage();
    setTimeout(() => setIsLocked(false), 400);
  };

  const thermoX = position?.x ?? 8;
  const thermoY = position?.y ?? 50;
  const gap = position?.gap ?? 13;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* 1. Sun Visual */}
      <Sun stageConfig={stageConfig} visible={isSunVisible} isPopping={isSunPopping} />

      {/* 2. Thermometer Visual */}
      <Thermometer
        stageConfig={stageConfig}
        visible={isThermoVisible}
        isPopping={isThermoPopping}
        position={{ x: thermoX, y: thermoY }}
      />

      {/* 3. Control Buttons Group (Positioned beside thermometer as one unit) */}
      <div
        className={`absolute -translate-y-1/2 flex flex-col items-center gap-3 sm:gap-4 z-30 pointer-events-auto ${
          isThermoPopping
            ? 'animate-pop-in'
            : `transition-all duration-300 ease-out ${
                isThermoVisible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 -translate-x-12 scale-0 pointer-events-none'
              }`
        }`}
        style={{
          left: `${thermoX + gap}%`,
          top: `${thermoY}%`,
        }}
      >
        {/* PLUS BUTTON */}
        <button
          onClick={handlePlusClick}
          disabled={temperatureStage >= 4 || isLocked || !isInteractionEnabled}
          aria-label="Increase temperature"
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 active:scale-95 text-white border-3 border-amber-300 shadow-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ring-4 ring-rose-500/30"
        >
          <Plus className="w-7 h-7 sm:w-9 sm:h-9 font-black stroke-[3.5]" />
        </button>

        {/* MINUS BUTTON (Hidden until Stage 4 is reached for the first time) */}
        <div
          className={`transition-all duration-700 ease-out ${
            hasReachedStage4
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-50 -translate-y-4 pointer-events-none'
          }`}
        >
          <button
            onClick={handleMinusClick}
            disabled={temperatureStage <= 1 || isLocked || !isInteractionEnabled}
            aria-label="Decrease temperature"
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-b from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 active:scale-95 text-white border-3 border-sky-200 shadow-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ring-4 ring-sky-500/30"
          >
            <Minus className="w-7 h-7 sm:w-9 sm:h-9 font-black stroke-[3.5]" />
          </button>
        </div>
      </div>

    </div>
  );
};
