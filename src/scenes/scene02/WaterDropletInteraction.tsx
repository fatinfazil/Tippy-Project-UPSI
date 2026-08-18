import React, { useState, useRef, useEffect } from 'react';
import { Play, Droplet, ArrowRight } from 'lucide-react';
import { DropletConfig, ClaudyStageInfo } from './types';
import { CharacterConfig } from '../../types/story';
import { preloadClaudyStages, getClaudyStageInfo } from './scene02.config';
import './WaterDropletInteraction.css';

interface WaterDropletInteractionProps {
  showStartButton: boolean;
  onStartActivity: () => void;
  visibleDropletCount: number;
  droplets: DropletConfig[];
  dropletAsset: string;
  onDropletMove?: (id: string, x: number, y: number) => void;
  isDraggable?: boolean;
  currentPhase?: string;
  isDevMode?: boolean;
  claudyCharacter?: CharacterConfig;
  onClaudyStyleChange?: (style: React.CSSProperties) => void;
  onClaudyAssetChange?: (assetUrl: string) => void;
  onClaudyDebugInfoChange?: (info: { collectedCount: number; stageInfo: ClaudyStageInfo; scale: number }) => void;
  onTriggerWarningSpeech?: (text: string, onEnd: () => void) => void;
  onComplete?: () => void;
}

interface ActiveDrag {
  id: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

interface DropletPos {
  x: number;
  y: number;
}

interface RippleEffect {
  id: string;
  x: number;
  y: number;
}

interface DebugDropZone {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export const WaterDropletInteraction: React.FC<WaterDropletInteractionProps> = ({
  showStartButton,
  onStartActivity,
  visibleDropletCount,
  droplets,
  dropletAsset,
  onDropletMove,
  isDraggable = false,
  currentPhase,
  isDevMode = false,
  claudyCharacter,
  onClaudyStyleChange,
  onClaudyAssetChange,
  onClaudyDebugInfoChange,
  onTriggerWarningSpeech,
  onComplete,
}) => {
  const [isButtonPressed, setIsButtonPressed] = useState<boolean>(false);
  const [isButtonExiting, setIsButtonExiting] = useState<boolean>(false);

  // Preload all Claudy stage GIFs eagerly when interaction component mounts
  useEffect(() => {
    preloadClaudyStages();
  }, []);

  // Active drag state
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  // Current position overrides during dragging or returning
  const [customPositions, setCustomPositions] = useState<Record<string, DropletPos>>({});
  // Set of droplet IDs currently executing return transition
  const [returningIds, setReturningIds] = useState<Set<string>>(new Set());
  // Set of droplet IDs currently executing absorption sequence
  const [absorbingIds, setAbsorbingIds] = useState<Set<string>>(new Set());
  // Set of droplet IDs fully collected and hidden
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set());
  // Active temporary blue pop/ripple effects
  const [ripples, setRipples] = useState<RippleEffect[]>([]);

  // Stage 3 warning speech state & flag
  const hasPlayedStage3WarningRef = useRef<boolean>(false);
  const [isWarningSpeaking, setIsWarningSpeaking] = useState<boolean>(false);

  // Stage 4 Next button state
  const [showNextButton, setShowNextButton] = useState<boolean>(false);
  const [isNextClicked, setIsNextClicked] = useState<boolean>(false);

  // Debug drop zone coordinates for Developer Mode
  const [debugDropZone, setDebugDropZone] = useState<DebugDropZone | null>(null);

  // Counter, Claudy scale & derived stage calculation
  const collectedCount = collectedIds.size;
  const currentStageInfo = getClaudyStageInfo(collectedCount);

  // ONLY for Stage 4 override the visible scale to 1.28 so Claudy + rain are fully visible without cropping
  const claudyScale =
    currentStageInfo.stage === 4
      ? 1.28
      : Math.min(1.40, Math.max(1.00, 1 + collectedCount * 0.04));

  // Opacity dip transition on stage GIF change
  const prevStageRef = useRef<number>(currentStageInfo.stage);
  const [isStageTransitioning, setIsStageTransitioning] = useState<boolean>(false);

  useEffect(() => {
    if (prevStageRef.current !== currentStageInfo.stage) {
      prevStageRef.current = currentStageInfo.stage;
      setIsStageTransitioning(true);
      const timer = setTimeout(() => {
        setIsStageTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStageInfo.stage]);

  // Notify parent component of Claudy asset change & debug info
  useEffect(() => {
    if (onClaudyAssetChange) {
      onClaudyAssetChange(currentStageInfo.asset);
    }
    if (onClaudyDebugInfoChange) {
      onClaudyDebugInfoChange({
        collectedCount,
        stageInfo: currentStageInfo,
        scale: claudyScale,
      });
    }
  }, [
    currentStageInfo.asset,
    currentStageInfo.stage,
    collectedCount,
    claudyScale,
    onClaudyAssetChange,
    onClaudyDebugInfoChange,
  ]);

  const onTriggerWarningSpeechRef = useRef(onTriggerWarningSpeech);
  useEffect(() => {
    onTriggerWarningSpeechRef.current = onTriggerWarningSpeech;
  }, [onTriggerWarningSpeech]);

  // Trigger Stage 3 warning speech when collected count first reaches 7
  useEffect(() => {
    if (collectedCount === 7 && !hasPlayedStage3WarningRef.current) {
      hasPlayedStage3WarningRef.current = true;
      setIsWarningSpeaking(true);

      const warningTimer = setTimeout(() => {
        if (onTriggerWarningSpeechRef.current) {
          onTriggerWarningSpeechRef.current("I'm getting too full!", () => {
            setIsWarningSpeaking(false);
          });
        } else {
          setIsWarningSpeaking(false);
        }
      }, 300);

      return () => clearTimeout(warningTimer);
    }
  }, [collectedCount]);

  // Trigger Stage 4 Next button after 1.8s of rain
  useEffect(() => {
    if (collectedCount === droplets.length && droplets.length > 0) {
      const nextTimer = setTimeout(() => {
        setShowNextButton(true);
      }, 1800);
      return () => clearTimeout(nextTimer);
    } else {
      setShowNextButton(false);
    }
  }, [collectedCount, droplets.length]);

  const prevCountRef = useRef<number>(0);
  const [isCounterBouncing, setIsCounterBouncing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeDragRef = useRef<ActiveDrag | null>(null);
  activeDragRef.current = activeDrag;

  // Trigger counter pop feedback when a new droplet finishes absorption
  useEffect(() => {
    const currentCount = collectedIds.size;
    const prevCount = prevCountRef.current;

    if (currentCount > prevCount && currentCount > 0) {
      // Counter feedback animation
      setIsCounterBouncing(true);
      const counterTimer = setTimeout(() => {
        setIsCounterBouncing(false);
      }, 200);

      prevCountRef.current = currentCount;
      return () => {
        clearTimeout(counterTimer);
      };
    }

    prevCountRef.current = currentCount;
  }, [collectedIds]);

  // Communicate Claudy's current scale & opacity transition style back to parent CharacterLayer
  useEffect(() => {
    if (onClaudyStyleChange) {
      onClaudyStyleChange({
        transform: `scale(${claudyScale.toFixed(4)})`,
        opacity: isStageTransitioning ? 0.85 : 1,
        transition: 'transform 300ms ease-out, opacity 150ms ease-in-out',
      });
    }
  }, [claudyScale, isStageTransitioning, onClaudyStyleChange]);

  // Reset collected/absorbing state whenever phase resets or droplets restart
  useEffect(() => {
    if (
      currentPhase === 'conversation' ||
      currentPhase === 'ready' ||
      currentPhase === 'droplet-intro' ||
      visibleDropletCount === 0
    ) {
      setAbsorbingIds(new Set());
      setCollectedIds(new Set());
      setReturningIds(new Set());
      setCustomPositions({});
      setActiveDrag(null);
      setRipples([]);
      setIsCounterBouncing(false);
      setShowNextButton(false);
      setIsNextClicked(false);
      setIsWarningSpeaking(false);
      hasPlayedStage3WarningRef.current = false;
      prevStageRef.current = 1;
      prevCountRef.current = 0;
    }
  }, [currentPhase, visibleDropletCount]);


  const handleButtonClick = () => {
    if (isButtonPressed) return;
    setIsButtonPressed(true);
    setIsButtonExiting(true);

    setTimeout(() => {
      onStartActivity();
    }, 180);
  };

  // Helper to find Claudy's rendered DOM element
  const getClaudyElement = (): HTMLElement | null => {
    if (!containerRef.current) return null;
    const parent = containerRef.current.parentElement;
    if (!parent) return null;
    return (
      parent.querySelector('img[alt="Claudy"]') ||
      parent.querySelector('img[alt="claudy"]') ||
      parent.querySelector('[alt="Claudy"]') ||
      parent.querySelector('[alt="claudy"]')
    );
  };

  // Helper to calculate Claudy's responsive drop zone bounds
  const getDropZoneBounds = () => {
    if (!containerRef.current) return null;

    const stageRect = containerRef.current.getBoundingClientRect();
    const claudyEl = getClaudyElement();

    let cLeft: number;
    let cTop: number;
    let cWidth: number;
    let cHeight: number;

    if (claudyEl) {
      const cRect = claudyEl.getBoundingClientRect();
      cLeft = cRect.left - stageRect.left;
      cTop = cRect.top - stageRect.top;
      cWidth = cRect.width;
      cHeight = cRect.height;
    } else if (claudyCharacter) {
      cHeight = (claudyCharacter.height / 100) * stageRect.height;
      cWidth = cHeight * 0.95;
      cLeft = (claudyCharacter.x / 100) * stageRect.width - cWidth / 2;
      cTop = (claudyCharacter.y / 100) * stageRect.height - cHeight;
    } else {
      cHeight = 0.48 * stageRect.height;
      cWidth = cHeight * 0.95;
      cLeft = 0.5 * stageRect.width - cWidth / 2;
      cTop = 0.48 * stageRect.height - cHeight;
    }

    // Apply 12% horizontal and 10% vertical insets to be forgiving for children
    const insetX = cWidth * 0.12;
    const insetY = cHeight * 0.10;

    const zoneLeft = cLeft + insetX;
    const zoneRight = cLeft + cWidth - insetX;
    const zoneTop = cTop + insetY;
    const zoneBottom = cTop + cHeight - insetY;

    return {
      clientLeft: stageRect.left + zoneLeft,
      clientRight: stageRect.left + zoneRight,
      clientTop: stageRect.top + zoneTop,
      clientBottom: stageRect.top + zoneBottom,
      leftPct: (zoneLeft / stageRect.width) * 100,
      topPct: (zoneTop / stageRect.height) * 100,
      widthPct: ((zoneRight - zoneLeft) / stageRect.width) * 100,
      heightPct: ((zoneBottom - zoneTop) / stageRect.height) * 100,
    };
  };

  // Keep debug drop zone overlay aligned in Developer Mode
  useEffect(() => {
    if (!isDevMode) {
      setDebugDropZone(null);
      return;
    }

    const updateDebugZone = () => {
      const zone = getDropZoneBounds();
      if (zone) {
        setDebugDropZone({
          leftPct: zone.leftPct,
          topPct: zone.topPct,
          widthPct: zone.widthPct,
          heightPct: zone.heightPct,
        });
      }
    };

    updateDebugZone();
    const interval = setInterval(updateDebugZone, 250);
    window.addEventListener('resize', updateDebugZone);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateDebugZone);
    };
  }, [isDevMode, claudyCharacter]);

  // Enable dragging after all droplets finished pop-in entrance animation or in interaction phase
  const isInteractionUnlocked =
    currentPhase === 'interaction' ||
    (visibleDropletCount >= droplets.length &&
      currentPhase !== 'droplet-intro' &&
      currentPhase !== 'conversation' &&
      currentPhase !== 'ready');

  const isAllCollected = collectedCount >= droplets.length;
  const canDragDroplets =
    (isDraggable || isInteractionUnlocked) &&
    !isAllCollected &&
    !isWarningSpeaking;

  const handleNextClick = () => {
    if (isNextClicked) return;
    setIsNextClicked(true);
    if (onComplete) {
      setTimeout(() => {
        onComplete();
      }, 200);
    }
  };

  const handlePointerDown = (droplet: DropletConfig, e: React.PointerEvent) => {
    // Only allow dragging if unlocked, not already collected/absorbing, and no other droplet is active
    if (
      !canDragDroplets ||
      collectedIds.has(droplet.id) ||
      absorbingIds.has(droplet.id) ||
      activeDragRef.current !== null ||
      !containerRef.current
    ) {
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch {}

    const rect = containerRef.current.getBoundingClientRect();
    const pointerXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const pointerYPct = ((e.clientY - rect.top) / rect.height) * 100;

    const currentPos = customPositions[droplet.id] || { x: droplet.x, y: droplet.y };
    const offsetX = pointerXPct - currentPos.x;
    const offsetY = pointerYPct - currentPos.y;

    const dragInfo: ActiveDrag = {
      id: droplet.id,
      pointerId: e.pointerId,
      offsetX,
      offsetY,
    };

    setActiveDrag(dragInfo);

    // If re-grabbed mid-return, cancel returning transition
    setReturningIds((prev) => {
      const next = new Set(prev);
      next.delete(droplet.id);
      return next;
    });

    const updatePosition = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const cRect = containerRef.current.getBoundingClientRect();
      const pX = ((clientX - cRect.left) / cRect.width) * 100;
      const pY = ((clientY - cRect.top) / cRect.height) * 100;

      const targetX = pX - dragInfo.offsetX;
      const targetY = pY - dragInfo.offsetY;

      // Keep droplet strictly within Story Stage boundaries
      const halfSize = (droplet.size || 8) / 2;
      const minX = Math.max(2, halfSize);
      const maxX = Math.min(98, 100 - halfSize);
      const minY = Math.max(2, halfSize);
      const maxY = Math.min(98, 100 - halfSize);

      const clampedX = Math.min(Math.max(targetX, minX), maxX);
      const clampedY = Math.min(Math.max(targetY, minY), maxY);

      const roundedX = Math.round(clampedX * 10) / 10;
      const roundedY = Math.round(clampedY * 10) / 10;

      setCustomPositions((prev) => ({
        ...prev,
        [droplet.id]: { x: roundedX, y: roundedY },
      }));
    };

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (moveEv.pointerId !== dragInfo.pointerId) return;
      updatePosition(moveEv.clientX, moveEv.clientY);
    };

    const finishDrag = (upEv: PointerEvent) => {
      if (upEv.pointerId !== dragInfo.pointerId) return;

      try {
        targetEl.releasePointerCapture(upEv.pointerId);
      } catch {}

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', cancelDrag);

      setActiveDrag(null);

      // Perform drop test against Claudy's valid drop zone
      const stageRect = containerRef.current
        ? containerRef.current.getBoundingClientRect()
        : null;
      const dRect = targetEl.getBoundingClientRect();
      const dropletCenterX = dRect.left + dRect.width / 2;
      const dropletCenterY = dRect.top + dRect.height / 2;

      let releasePctX = droplet.x;
      let releasePctY = droplet.y;
      if (stageRect) {
        releasePctX = ((dropletCenterX - stageRect.left) / stageRect.width) * 100;
        releasePctY = ((dropletCenterY - stageRect.top) / stageRect.height) * 100;
      }

      const zone = getDropZoneBounds();
      const isInsideClaudy =
        zone !== null &&
        dropletCenterX >= zone.clientLeft &&
        dropletCenterX <= zone.clientRight &&
        dropletCenterY >= zone.clientTop &&
        dropletCenterY <= zone.clientBottom;

      if (isInsideClaudy && !isDraggable) {
        // STEP 1 — LOCK THE DROPLET: Prevent any further pointer interaction or double collection
        setAbsorbingIds((prev) => new Set(prev).add(droplet.id));

        // Calculate target inward position relative to Claudy's drop zone center
        const zoneCenterPctX = zone.leftPct + zone.widthPct / 2;
        const zoneCenterPctY = zone.topPct + zone.heightPct / 2;

        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // STEP 2 — MOVE INWARD (100–140ms ease-out): Directly move inward from release position without snapping back
        const inwardX = prefersReducedMotion
          ? releasePctX
          : releasePctX + (zoneCenterPctX - releasePctX) * 0.35;
        const inwardY = prefersReducedMotion
          ? releasePctY
          : releasePctY + (zoneCenterPctY - releasePctY) * 0.35;

        setCustomPositions((prev) => ({
          ...prev,
          [droplet.id]: { x: inwardX, y: inwardY },
        }));

        // STEP 4 — BLUE POP / RIPPLE: Trigger temporary ripple at disappearance point inside Claudy
        const rippleId = `ripple-${droplet.id}-${Date.now()}`;
        if (!prefersReducedMotion) {
          setTimeout(() => {
            setRipples((prev) => [...prev, { id: rippleId, x: inwardX, y: inwardY }]);
            setTimeout(() => {
              setRipples((prev) => prev.filter((r) => r.id !== rippleId));
            }, 200);
          }, 150);
        }

        // STEP 3 & STEP 5 — SHRINK/FADE & COMPLETE COLLECTION: Hide permanently & call collection state
        setTimeout(() => {
          setCollectedIds((prev) => new Set(prev).add(droplet.id));
          setAbsorbingIds((prev) => {
            const next = new Set(prev);
            next.delete(droplet.id);
            return next;
          });
          setCustomPositions((prev) => {
            const copy = { ...prev };
            delete copy[droplet.id];
            return copy;
          });
        }, 180);
      } else {
        // Released outside Claudy's drop zone
        if (isDraggable && onDropletMove) {
          // Developer positioning mode: store final position permanently
          setCustomPositions((prev) => {
            const finalPos = prev[droplet.id] || { x: droplet.x, y: droplet.y };
            onDropletMove(droplet.id, finalPos.x, finalPos.y);
            return prev;
          });
        } else {
          // Child interaction mode: animate return home over ~250ms
          setReturningIds((prev) => new Set(prev).add(droplet.id));

          setCustomPositions((prev) => ({
            ...prev,
            [droplet.id]: { x: droplet.x, y: droplet.y },
          }));

          setTimeout(() => {
            setReturningIds((prev) => {
              const next = new Set(prev);
              next.delete(droplet.id);
              return next;
            });
            setCustomPositions((prev) => {
              const copy = { ...prev };
              delete copy[droplet.id];
              return copy;
            });
          }, 260);
        }
      }
    };

    const cancelDrag = (cancelEv: PointerEvent) => {
      if (cancelEv.pointerId !== dragInfo.pointerId) return;

      try {
        targetEl.releasePointerCapture(cancelEv.pointerId);
      } catch {}

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', cancelDrag);

      setActiveDrag(null);

      // Return to original position cleanly
      setReturningIds((prev) => new Set(prev).add(droplet.id));
      setCustomPositions((prev) => ({
        ...prev,
        [droplet.id]: { x: droplet.x, y: droplet.y },
      }));

      setTimeout(() => {
        setReturningIds((prev) => {
          const next = new Set(prev);
          next.delete(droplet.id);
          return next;
        });
        setCustomPositions((prev) => {
          const copy = { ...prev };
          delete copy[droplet.id];
          return copy;
        });
      }, 260);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', cancelDrag);
  };

  return (
    <>
      {/* Developer Mode Debug Visualization for Claudy's Drop Zone */}
      {isDevMode && debugDropZone && (
        <div
          className="absolute border-2 border-dashed border-sky-400/80 bg-sky-400/15 rounded-2xl pointer-events-none z-30 flex items-center justify-center transition-all duration-150 shadow-lg"
          style={{
            left: `${debugDropZone.leftPct}%`,
            top: `${debugDropZone.topPct}%`,
            width: `${debugDropZone.widthPct}%`,
            height: `${debugDropZone.heightPct}%`,
          }}
        >
          <span className="text-[10px] text-sky-200 font-mono font-bold bg-slate-900/90 px-2 py-0.5 rounded border border-sky-400/40 shadow-sm whitespace-nowrap select-none">
            Claudy Drop Zone (Collected: {collectedCount}/{droplets.length}, Scale: {claudyScale.toFixed(2)})
          </span>
        </div>
      )}

      {/* Visible Droplet Counter UI Badge */}
      {visibleDropletCount > 0 && (
        <div className="absolute top-4 right-44 sm:right-48 z-30 pointer-events-none select-none">
          <div
            className={`flex items-center gap-2.5 bg-slate-900/85 text-white backdrop-blur-md px-3.5 py-2 rounded-2xl border border-sky-400/30 shadow-xl transition-transform ${
              isCounterBouncing ? 'counter-pop-feedback' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300 shadow-inner">
              <Droplet className="w-4 h-4 fill-sky-400 text-sky-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold tracking-wider text-sky-300/90 leading-none">
                Water Droplets
              </span>
              <span className="text-sm font-extrabold text-white leading-tight font-mono">
                {collectedCount} / {droplets.length}
              </span>
            </div>
          </div>
          <div aria-live="polite" className="sr-only">
            {collectedCount} of {droplets.length} water droplets collected.
          </div>
        </div>
      )}

      {/* Start Activity Button Overlay */}
      {showStartButton && !isButtonPressed && (
        <div className="absolute top-[51.1%] left-[62.4%] -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
          <button
            onClick={handleButtonClick}
            disabled={isButtonPressed}
            className={`group inline-flex items-center gap-3 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base sm:text-lg px-7 py-3.5 rounded-full shadow-[0_10px_25px_rgba(14,165,233,0.5)] border-2 border-sky-200/80 transition-all transform cursor-pointer active:scale-95 ${
              isButtonExiting ? 'start-activity-btn-exit' : 'start-activity-btn-enter'
            }`}
          >
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />
            </span>
            <span className="tracking-wide drop-shadow-sm">Start Activity</span>
          </button>
        </div>
      )}

      {/* Stage 4 Next Button Overlay */}
      {showNextButton && (
        <div className="absolute bottom-8 right-8 sm:bottom-10 sm:right-12 z-40 pointer-events-auto">
          <button
            onClick={handleNextClick}
            disabled={isNextClicked}
            className={`group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-base sm:text-lg px-8 py-4 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] border-2 border-emerald-200/80 transition-all transform cursor-pointer active:scale-95 next-button-enter ${
              isNextClicked ? 'opacity-60 scale-95 pointer-events-none' : ''
            }`}
          >
            <span className="tracking-wide drop-shadow-sm">Next</span>
            <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5 text-white" />
            </span>
          </button>
        </div>
      )}

      {/* Temporary Blue Pop / Ripple Effects Layer */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="water-ripple-container -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
        >
          <div className="water-ripple-ring -translate-x-1/2 -translate-y-1/2" />
          <div className="water-sparkle-dot sparkle-1 -translate-x-1/2 -translate-y-1/2" />
          <div className="water-sparkle-dot sparkle-2 -translate-x-1/2 -translate-y-1/2" />
          <div className="water-sparkle-dot sparkle-3 -translate-x-1/2 -translate-y-1/2" />
        </div>
      ))}

      {/* Water Droplets Layer */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {droplets.map((droplet, index) => {
          // Skip fully collected droplets
          if (collectedIds.has(droplet.id)) return null;

          const isVisible = index < visibleDropletCount;
          const isJustPopped = index === visibleDropletCount - 1 && visibleDropletCount < droplets.length;
          const isBeingDragged = activeDrag?.id === droplet.id;
          const isReturning = returningIds.has(droplet.id);
          const isAbsorbing = absorbingIds.has(droplet.id);

          if (!isVisible) return null;

          const currentPos = customPositions[droplet.id] || { x: droplet.x, y: droplet.y };

          let zIndex = droplet.zIndex ?? 10;
          if (isBeingDragged) {
            zIndex = 50;
          } else if (isReturning || isAbsorbing) {
            zIndex = 40;
          }

          let cursorClass = 'cursor-default';
          if (isBeingDragged) {
            cursorClass = 'cursor-grabbing';
          } else if (canDragDroplets && !isAbsorbing) {
            cursorClass = 'cursor-grab hover:scale-105';
          }

          return (
            <div
              key={droplet.id}
              onPointerDown={(e) => handlePointerDown(droplet, e)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center select-none droplet-interactive ${
                canDragDroplets && !isAbsorbing ? 'pointer-events-auto' : 'pointer-events-none'
              } ${isJustPopped ? 'droplet-pop-in' : ''} ${
                isBeingDragged ? 'droplet-dragging' : ''
              } ${isReturning ? 'droplet-returning' : ''} ${
                isAbsorbing ? 'droplet-absorbing' : ''
              } ${cursorClass}`}
              style={{
                left: `${currentPos.x}%`,
                top: `${currentPos.y}%`,
                width: `${droplet.size}%`,
                minWidth: '44px',
                minHeight: '44px',
                zIndex,
                opacity: isAbsorbing ? 0 : 1,
                touchAction: 'none',
                transform: isBeingDragged
                  ? 'translate(-50%, -50%) scale(1.08)'
                  : isAbsorbing
                  ? 'translate(-50%, -50%) scale(0)'
                  : 'translate(-50%, -50%) scale(1.0)',
              }}
            >
              <img
                src={dropletAsset}
                alt={`Water Droplet ${index + 1}`}
                className={`w-full h-auto object-contain pointer-events-none select-none drop-shadow-md ${
                  isBeingDragged ? 'filter drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]' : ''
                }`}
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};
