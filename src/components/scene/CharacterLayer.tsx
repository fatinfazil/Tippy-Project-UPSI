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
  // Mia
  '/characters/mia/mia-idle.gif',
  '/characters/mia/mia-hot.gif',
  '/characters/mia/mia-hotlp.gif',
  '/characters/mia/mia-talking.gif',
  // Tippy
  '/characters/tippy/tippy-idle.gif',
  '/characters/tippy/tippy-talking.gif',
];

const DEFAULT_CHARACTER_ASSETS: Record<string, string[]> = {
  adam: [
    '/characters/adam/adam-idle.gif',
    '/characters/adam/adam-pointing.gif',
    '/characters/adam/adam-talking.gif',
  ],
  claudy: [
    '/characters/claudy/claudy-idle.gif',
    '/characters/claudy/claudy-talking.gif',
    '/characters/claudy/claudy-transform.gif',
    '/characters/claudy/claudygrey-idle.gif',
  ],
  mia: [
    '/characters/mia/mia-idle.gif',
    '/characters/mia/mia-hot.gif',
    '/characters/mia/mia-hotlp.gif',
    '/characters/mia/mia-talking.gif',
  ],
  tippy: [
    '/characters/tippy/tippy-idle.gif',
    '/characters/tippy/tippy-talking.gif',
  ],
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
  const [characterAssetsMap, setCharacterAssetsMap] = useState<Record<string, string[]>>(
    DEFAULT_CHARACTER_ASSETS
  );

  useEffect(() => {
    preloadCharacterGifs();
  }, []);

  // Dynamically register any new asset assigned to a character
  useEffect(() => {
    characters.forEach((char) => {
      if (!char.asset) return;
      setCharacterAssetsMap((prev) => {
        const existing = prev[char.id] || [];
        if (!existing.includes(char.asset)) {
          return { ...prev, [char.id]: [...existing, char.asset] };
        }
        return prev;
      });
    });
  }, [characters]);

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
        const registeredAssets = characterAssetsMap[char.id] || [char.asset];

        // Ensure current active asset is in the stack
        const assetList = registeredAssets.includes(char.asset)
          ? registeredAssets
          : [...registeredAssets, char.asset];

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
            {/* Dual-Layer / Multi-Asset Opacity Stack */}
            <div className="relative h-full w-auto pointer-events-none flex items-end justify-center">
              {assetList.map((assetUrl) => {
                const isActive = char.asset === assetUrl;
                const retryKey = `${char.id}:${assetUrl}`;
                const retryCount = retryMap[retryKey] || 0;
                const imgSrc = retryCount > 0 ? `${assetUrl}?r=${retryCount}` : assetUrl;

                return (
                  <img
                    key={assetUrl}
                    src={imgSrc}
                    alt={char.name}
                    className="h-full max-h-full w-auto max-w-none object-contain block select-none pointer-events-none transition-opacity duration-150 ease-in-out"
                    style={{
                      position: isActive ? 'relative' : 'absolute',
                      top: isActive ? undefined : 0,
                      left: isActive ? undefined : '50%',
                      transform: isActive ? undefined : 'translateX(-50%)',
                      opacity: isActive ? 1 : 0,
                      zIndex: isActive ? 2 : 1,
                      pointerEvents: 'none',
                    }}
                    onLoad={() => {
                      if (isActive) {
                        onCharacterLoadStatus?.(char.id, true);
                      }
                    }}
                    onError={() => handleImageError(char.id, assetUrl)}
                  />
                );
              })}
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

