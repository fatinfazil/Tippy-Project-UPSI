import React from 'react';
import { RotateCw, Smartphone } from 'lucide-react';

export const OrientationNotice: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex-col items-center justify-center p-6 text-center portrait-overlay-flex hidden">
      <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 animate-bounce">
        <RotateCw className="w-10 h-10" />
      </div>
      <div className="flex items-center gap-3 mb-4 text-slate-300">
        <Smartphone className="w-8 h-8 rotate-90 text-emerald-400 animate-pulse" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-300 mb-3 tracking-tight">
        Landscape Mode Preferred
      </h2>
      <p className="text-lg sm:text-xl font-medium text-slate-200 max-w-sm leading-relaxed">
        Please rotate your device to continue Tippy’s adventure.
      </p>
    </div>
  );
};
