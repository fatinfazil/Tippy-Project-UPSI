import React from 'react';
import { STORY_STAGE_ASPECT_RATIO } from '../../config/scene1.config';

interface SceneCanvasProps {
  children: React.ReactNode;
  variant?: 'framed' | 'fullscreen';
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  variant = 'framed',
}) => {
  return (
    <div className="w-full h-full flex-1 flex items-center justify-center overflow-hidden bg-slate-950 p-0 m-0 relative min-h-0 min-w-0">
      <div
        className={`relative overflow-hidden flex items-center justify-center transition-all ${
          variant === 'fullscreen'
            ? 'bg-black border-0 rounded-none shadow-none'
            : 'bg-slate-900 border-0 sm:border-2 border-emerald-200/50 rounded-xl sm:rounded-2xl shadow-2xl'
        }`}
        style={{
          aspectRatio: `${STORY_STAGE_ASPECT_RATIO}`,
          maxWidth: '100%',
          maxHeight: '100%',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      >
        {children}
      </div>
    </div>
  );
};
