import React, {
  useState,
  useRef,
} from 'react';

import { StoryPhase } from '../../types/story';
import { Scene02Phase } from '../../scenes/scene02/types';

import {
  SceneNavigator,
  ActiveScene,
} from './SceneNavigator';

import { GripHorizontal } from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface DeveloperPanelProps {
  activeScene: ActiveScene;

  scene1Phase: StoryPhase;

  scene2Phase: Scene02Phase;

  onSelectScene: (
    scene: ActiveScene
  ) => void;

  onSelectScene1Phase: (
    phase: StoryPhase
  ) => void;

  onSelectScene2Phase: (
    phase: Scene02Phase
  ) => void;

  onJumpScene2Interaction: () => void;

  isDevMode: boolean;

  onToggleDevMode: () => void;
}

// ============================================
// DEVELOPER PANEL
// ============================================

export const DeveloperPanel: React.FC<
  DeveloperPanelProps
> = ({
  activeScene,
  scene1Phase,
  scene2Phase,
  onSelectScene,
  onSelectScene1Phase,
  onSelectScene2Phase,
  onJumpScene2Interaction,
  isDevMode,
  onToggleDevMode,
}) => {
  // ==========================================
  // PANEL POSITION
  // ==========================================

  const [
    position,
    setPosition,
  ] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // ==========================================
  // DRAG STATE
  // ==========================================

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  // ==========================================
  // PANEL REF
  // ==========================================

  const panelRef =
    useRef<HTMLDivElement>(null);

  // ==========================================
  // DRAG START REF
  // ==========================================

  const dragStartRef =
    useRef<{
      mouseX: number;
      mouseY: number;
      posX: number;
      posY: number;
    }>({
      mouseX: 0,
      mouseY: 0,
      posX: 0,
      posY: 0,
    });

  // ==========================================
  // HIDE WHEN DEV MODE IS OFF
  // ==========================================

  if (!isDevMode) {
    return null;
  }

  // ==========================================
  // POINTER DOWN
  // ==========================================

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    // Don't drag when interacting
    // with buttons, inputs, selects or links.
    if (
      (
        e.target as HTMLElement
      ).closest(
        'button, input, select, a'
      )
    ) {
      return;
    }

    setIsDragging(true);

    const rect =
      panelRef.current?.getBoundingClientRect();

    const currentX =
      rect
        ? rect.left
        : window.innerWidth - 380;

    const currentY =
      rect
        ? rect.top
        : window.innerHeight - 320;

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: currentX,
      posY: currentY,
    };

    try {
      e.currentTarget.setPointerCapture(
        e.pointerId
      );
    } catch {
      // Pointer capture may not be supported.
    }
  };

  // ==========================================
  // POINTER MOVE
  // ==========================================

  const handlePointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) {
      return;
    }

    const dx =
      e.clientX -
      dragStartRef.current.mouseX;

    const dy =
      e.clientY -
      dragStartRef.current.mouseY;

    const panelWidth =
      panelRef.current?.offsetWidth ??
      350;

    const panelHeight =
      panelRef.current?.offsetHeight ??
      250;

    // Keep panel inside viewport.
    const newX = Math.max(
      10,
      Math.min(
        window.innerWidth -
          panelWidth -
          10,
        dragStartRef.current.posX +
          dx
      )
    );

    const newY = Math.max(
      10,
      Math.min(
        window.innerHeight -
          panelHeight -
          10,
        dragStartRef.current.posY +
          dy
      )
    );

    setPosition({
      x: newX,
      y: newY,
    });
  };

  // ==========================================
  // POINTER UP
  // ==========================================

  const handlePointerUp = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(
        e.pointerId
      );
    } catch {
      // Pointer capture may not be supported.
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div
      ref={panelRef}
      onPointerDown={
        handlePointerDown
      }
      onPointerMove={
        handlePointerMove
      }
      onPointerUp={
        handlePointerUp
      }
      onPointerCancel={
        handlePointerUp
      }
      className={`
        fixed
        z-50

        bg-slate-900/95
        text-slate-100

        p-3.5

        rounded-2xl

        border
        border-emerald-500/40

        shadow-2xl

        text-xs
        font-mono

        max-w-xs
        w-full

        backdrop-blur-md

        select-none
        touch-none

        max-h-[80vh]
        overflow-y-auto

        ${
          isDragging
            ? `
              cursor-grabbing
              border-emerald-400
              shadow-emerald-500/20
              ring-2
              ring-emerald-500/30
            `
            : `
              cursor-grab
            `
        }
      `}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: 'auto',
              right: 'auto',
            }
          : {
              bottom: '16px',
              right: '16px',
            }
      }
    >

      {/* ====================================== */}
      {/* PANEL HEADER */}
      {/* ====================================== */}

      <div
        className="
          flex
          items-center
          justify-between

          pb-2
          mb-2.5

          border-b
          border-slate-800
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <GripHorizontal
            className="
              w-4
              h-4
              text-emerald-400/70
            "
          />

          <span
            className="
              inline-block
              w-2.5
              h-2.5
              rounded-full
              bg-emerald-400
              animate-pulse
            "
          />

          <span
            className="
              font-bold
              tracking-wider
              text-slate-100
            "
          >
            DEV PANEL
          </span>
        </div>

        {/* ==================================== */}
        {/* DISABLE BUTTON */}
        {/* ==================================== */}

        <button
          type="button"
          onClick={
            onToggleDevMode
          }
          className="
            text-[10px]
            text-slate-400

            hover:text-white

            px-2
            py-1

            rounded

            bg-slate-800
            hover:bg-slate-700

            transition

            cursor-pointer

            font-sans
          "
        >
          Disable Dev Mode
        </button>
      </div>

      {/* ====================================== */}
      {/* SCENE NAVIGATOR */}
      {/* ====================================== */}

      <SceneNavigator
        activeScene={activeScene}
        scene1Phase={scene1Phase}
        scene2Phase={scene2Phase}
        onSelectScene={
          onSelectScene
        }
        onSelectScene1Phase={
          onSelectScene1Phase
        }
        onSelectScene2Phase={
          onSelectScene2Phase
        }
        onJumpScene2Interaction={
          onJumpScene2Interaction
        }
      />

    </div>
  );
};

export default DeveloperPanel;