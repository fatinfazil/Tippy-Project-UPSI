import React from 'react';

interface SceneCanvasProps {
  children: React.ReactNode;
  variant?: 'framed' | 'fullscreen';
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  variant = 'framed',
}) => {
  return (
    <div
      className="
        w-full
        h-full
        flex-1
        flex
        items-center
        justify-center
        overflow-hidden
        bg-slate-950
        p-0
        m-0
        relative
        min-h-0
        min-w-0
      "
    >
      <div
        className={`
          relative
          flex
          items-center
          justify-center
          overflow-hidden

          ${
            variant === 'fullscreen'
              ? `
                bg-black
                border-0
                rounded-none
                shadow-none
              `
              : `
                bg-slate-900
                border-0
                sm:border-2
                border-emerald-200/50
                rounded-xl
                sm:rounded-2xl
                shadow-2xl
              `
          }
        `}
        style={{
          /*
           * =========================================
           * FIXED GAME STAGE
           * =========================================
           *
           * The game itself ALWAYS uses 16:9.
           *
           * The stage will shrink to fit whichever
           * dimension is smaller:
           *
           * - available width
           * - available height
           *
           * This prevents cropping on phones/tablets.
           */
          aspectRatio: '16 / 9',

          width: '100%',
          maxWidth: '100%',
          maxHeight: '100%',

          /*
           * Let aspect-ratio determine the height.
           */
          height: 'auto',

          flexShrink: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
};