import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface BackgroundLayerProps {
  imageSrc?: string;
  isDevMode?: boolean;
  children?: React.ReactNode;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  imageSrc,
  isDevMode = false,
  children,
}) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center bg-slate-950 overflow-hidden">
      {imageSrc && !hasError && (
        <img
          src={imageSrc}
          alt="Playground Background"
          className="w-full h-full object-cover object-center block select-none pointer-events-none"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}

      {hasError && (
        <div className="z-10 bg-slate-900/90 text-slate-100 p-4 rounded-2xl border border-rose-500/40 shadow-xl max-w-sm text-center mx-4 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-2">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-rose-200 font-bold text-sm">
            The playground could not be loaded.
          </p>
          {isDevMode && (
            <p className="text-[11px] font-mono text-slate-400 mt-2 break-all bg-slate-950/60 p-2 rounded border border-slate-800">
              Path: {imageSrc}
            </p>
          )}
        </div>
      )}

      {/* Dev Mode Status Badge for Background Loading */}
      {isDevMode && (
        <div className="absolute top-2 left-2 z-30 bg-slate-900/90 text-slate-300 px-2.5 py-1 rounded-md text-[10px] font-mono border border-slate-700 pointer-events-auto shadow-md">
          BG Status:{' '}
          <span
            className={
              hasError
                ? 'text-rose-400 font-bold'
                : isLoaded
                ? 'text-emerald-400 font-bold'
                : 'text-amber-400 font-bold'
            }
          >
            {hasError ? 'FAILED' : isLoaded ? 'LOADED' : 'LOADING'}
          </span>
        </div>
      )}

      {children}
    </div>
  );
};
