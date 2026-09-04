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
          overflow-hidden
          flex
          items-center
          justify-center
          transition-all

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
          aspectRatio: '16 / 9',

          /*
            IMPORTANT:
            Keep the game stage at 16:9.
            Letterbox empty space if screen ratio differs.
          */

          width: 'min(100%, calc(100vh * 16 / 9))',

          height: 'min(100%, calc(100vw * 9 / 16))',

          position: 'relative',
        }}
      >

        {children}

      </div>

    </div>
  );
};