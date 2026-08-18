import React, { useState, useEffect } from 'react';
import { CharacterConfig } from '../../types/story';

export const PRELOAD_CHARACTER_GIFS = [
  // Adam
  '/characters/adam/adam-idle.gif',
  '/characters/adam/adam-pointing.gif',
  '/characters/adam/adam-talking.gif',
  // Claudy
  '/characters/claudy/claudy-idle.gif',
  '/characters/claudy/claudy-talking.gif',
  '/characters/claudy/claudy-transform.gif',
  '/characters/claudy/claudygrey-idle.gif',
  '/characters/claudy/claudy-stage2.gif',
  '/characters/claudy/claudy-stage3.gif',
  '/characters/claudy/claudy-stage4.gif',
  // Mia
  '/characters/mia/mia-idle.gif',
  '/characters/mia/mia-hot.gif',
  '/characters/mia/mia-hotlp.gif',
  '/characters/mia/mia-talking.gif',
  // Tippy
  '/characters/tippy/tippy-idle.gif',
  '/characters/tippy/tippy-talking.gif',
];

const getBaseAssetUrl = (url: string): string => {
  if (!url) return '';
  return url.split('?')[0];
};

// Global image cache reference to prevent garbage collection of preloaded assets
const globalImageCache: HTMLImageElement[] = [];

export const preloadCharacterGifs = () => {
  if (typeof window === 'undefined') return;
  PRELOAD_CHARACTER_GIFS.forEach((url) => {
    if (!globalImageCache.some((img) => img.src.includes(url))) {
      const img = new Image();
      img.src = url;
      globalImageCache.push(img);
    }
  });
};

// Eagerly trigger preloading on module initialization
preloadCharacterGifs();

interface CharacterLayerProps {
  characters?: CharacterConfig[];
  characterStyles?: Record<string, React.CSSProperties>;
  isDevMode?: boolean;
  onCharacterLoadStatus?: (id: string, success: boolean) => void;
  children?: React.ReactNode;
}

export const CharacterLayer: React.FC<CharacterLayerProps> = ({
  characters = [],
  characterStyles = {},
  isDevMode = false,
  onCharacterLoadStatus,
  children,
}) => {
  const [retryMap, setRetryMap] = useState<Record<string, number>>({});

  useEffect(() => {
    preloadCharacterGifs();
  }, []);

  const handleImageError = (charId: string, assetUrl: string) => {
    onCharacterLoadStatus?.(charId, false);
    const key = `${charId}:${assetUrl}`;
    setRetryMap((prev) => {
      const currentRetries = prev[key] || 0;
      if (currentRetries < 3) {
        return { ...prev, [key]: currentRetries + 1 };
      }
      return prev;
    });
  };

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {characters.map((char) => {
        if (!char.visible) return null;

        const extraStyle = characterStyles[char.id] || {};
        const activeBaseAsset = getBaseAssetUrl(char.asset);

        return (
          <div
            key={char.id}
            className="absolute pointer-events-none block"
            style={{
              left: `${char.x}%`,
              top: `${char.y}%`,
              height: `${char.height}%`,
              zIndex: char.zIndex,
              opacity: extraStyle.opacity,
              transform: `translate(-50%, -100%) ${extraStyle.transform || ''}`,
              filter: extraStyle.filter || undefined,
              transition:
                extraStyle.transition ||
                'left 75ms, top 75ms, transform 500ms ease, filter 500ms ease',
              transformOrigin: '50% 100%',
            }}
          >
            {/* Active Asset Image */}
            <div className="relative h-full w-auto pointer-events-none flex items-end justify-center">
              {(() => {
                const activeBaseAsset = getBaseAssetUrl(char.asset);
                const retryKey = `${char.id}:${activeBaseAsset}`;
                const retryCount = retryMap[retryKey] || 0;
                
                let imgSrc = char.asset;
                if (retryCount >= 3) {
                  // Fall back to gray idle asset if standard idle also fails
                  imgSrc = char.id === 'claudy' 
                    ? `/characters/claudy/claudygrey-idle.gif` 
                    : `/characters/${char.id}/${char.id}-idle.gif`;
                } else if (retryCount >= 2) {
                  // Fall back to default idle asset if specific GIF URL fails
                  imgSrc = `/characters/${char.id}/${char.id}-idle.gif`;
                } else if (retryCount > 0) {
                  imgSrc = `${char.asset}${char.asset.includes('?') ? '&' : '?'}r=${retryCount}`;
                }

                return (
                  <img
                    key={activeBaseAsset}
                    src={imgSrc}
                    alt={char.name}
                    className="h-full max-h-full w-auto max-w-none object-contain block select-none pointer-events-none transition-opacity duration-150 ease-in-out"
                    onLoad={() => {
                      onCharacterLoadStatus?.(char.id, true);
                    }}
                    onError={() => handleImageError(char.id, activeBaseAsset)}
                  />
                );
              })()}
            </div>

            {/* In Developer Mode ONLY: show a small non-intrusive debug badge over the character */}
            {isDevMode && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-emerald-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-emerald-500/40 whitespace-nowrap shadow-md pointer-events-auto flex items-center gap-1 z-20">
                <span>
                  {char.name} (x:{char.x}, y:{char.y}, h:{char.height}%)
                </span>
              </div>
            )}
          </div>
        );
      })}
      {children}
    </div>
  );
};

