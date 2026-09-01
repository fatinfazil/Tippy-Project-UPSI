import React, { useState, useEffect, useRef } from 'react';
import { StoryPhase, CharacterConfig } from '../../types/story';
import { scene1Config } from '../../config/scene1.config';
import { TEMPERATURE_STAGES } from '../../config/temperature.config';
import { playPopSound } from '../../utils/soundEffects';
import { SceneCanvas } from './SceneCanvas';
import { BackgroundLayer } from './BackgroundLayer';
import { CharacterLayer } from './CharacterLayer';
import { SpeechBubbleLayer, ActiveSpeech } from './SpeechBubbleLayer';
import { InteractionLayer } from './InteractionLayer';
import { TemperatureInteraction } from './TemperatureInteraction';
import {
  RefreshCw,
  CheckCircle2,
  Sliders,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Tv,
  ThermometerSun,
  ArrowRight,
} from 'lucide-react';

interface PlaygroundSceneProps {
  phase: StoryPhase;
  onNextPhase: () => void;
  onRestart: () => void;
  isDevMode: boolean;
}

type FlowState =
  | 'conversation'
  | 'await_next'
  | 'fade_out_all'
  | 'fade_in_bg'
  | 'tippy_entering'
  | 'tippy_narration'
  | 'pause_after_narration'
  | 'pop_sun'
  | 'pause_after_sun'
  | 'pop_thermo'
  | 'pause_after_thermo'
  | 'pop_claudy'
  | 'interactive';

const speakText = (text: string, onEnd: () => void) => {
  let isDone = false;
  let speechFinished = false;
  let timerFinished = false;

  // Minimum time to show speech bubble so user can read it comfortably
  const minReadMs = Math.max(3200, text.length * 85);

  const complete = () => {
    if (isDone) return;
    if (speechFinished && timerFinished) {
      isDone = true;
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {}
      onEnd();
    }
  };

  // 1. Timer for reading duration
  const readTimer = setTimeout(() => {
    timerFinished = true;
    complete();
  }, minReadMs);

  // 2. Safety max timer (e.g. 8 seconds) in case speech synthesis hangs
  const maxSafetyTimer = setTimeout(() => {
    speechFinished = true;
    timerFinished = true;
    complete();
  }, Math.max(7000, minReadMs + 3000));

  // 3. Speech synthesis setup
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Ensure speech engine is unpaused

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        speechFinished = true;
        complete();
      };

      utterance.onerror = () => {
        speechFinished = true;
        complete();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      speechFinished = true;
      complete();
    }
  } else {
    speechFinished = true;
    complete();
  }

  return () => {
    isDone = true;
    clearTimeout(readTimer);
    clearTimeout(maxSafetyTimer);
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  };
};

export const PlaygroundScene: React.FC<PlaygroundSceneProps> = ({
  phase,
  onNextPhase,
  onRestart,
  isDevMode,
}) => {
  const isInteractivePhase = phase === 'playground-interaction';

  // Presentation Flow State
  const [flowState, setFlowState] = useState<FlowState>(
    isInteractivePhase ? 'interactive' : 'conversation'
  );

  // Character layout state (initialized from config)
  const [characters, setCharacters] = useState<CharacterConfig[]>(scene1Config.characters);
  const [selectedCharId, setSelectedCharId] = useState<string>('claudy');
  const [loadStatus, setLoadStatus] = useState<Record<string, boolean>>({});

  // Initial buffer delay to let DOM & assets settle on mount after video transition
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);

  // Sequence Runner State
  const [opIndex, setOpIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeSpeech, setActiveSpeech] = useState<ActiveSpeech | null>(null);

  // Temperature Interaction State
  const [temperatureStage, setTemperatureStage] = useState<number>(1);
  const [hasReachedStage4, setHasReachedStage4] = useState<boolean>(false);
  const [thermoPosition, setThermoPosition] = useState<{ x: number; y: number; gap: number }>({
    x: 8,
    y: 57.5,
    gap: 9,
  });

  const sequence = scene1Config.sequence;
  const charactersRef = useRef(characters);
  charactersRef.current = characters;

  // Activity elements visibility and popping flags derived from flowState
  const isSunVisible = [
    'pop_sun',
    'pop_thermo',
    'pop_claudy',
    'interactive',
  ].includes(flowState) || isInteractivePhase;

  const isSunPopping = flowState === 'pop_sun';

  const isThermoVisible = [
    'pop_thermo',
    'pop_claudy',
    'interactive',
  ].includes(flowState) || isInteractivePhase;

  const isThermoPopping = flowState === 'pop_thermo';

  const isInteractionEnabled = flowState === 'interactive' || isInteractivePhase;

  const currentStageConfig = TEMPERATURE_STAGES[temperatureStage] || TEMPERATURE_STAGES[1];

  // Character CSS style overrides for temperature stages and transitions
  const characterStyles: Record<string, React.CSSProperties> = {
    mia: {
      opacity: flowState === 'fade_out_all' ? 0 : 1,
      transition: 'opacity 1000ms ease-out',
    },
    adam: {
      opacity: flowState === 'fade_out_all' ? 0 : 1,
      transition: 'opacity 1000ms ease-out',
    },
    tippy: {
      opacity: flowState === 'fade_out_all' || flowState === 'fade_in_bg' ? 0 : 1,
      transition: 'opacity 1000ms ease-out',
    },
    claudy: {
      transform: `scale(${currentStageConfig.claudyScale})`,
      filter: `grayscale(${currentStageConfig.claudyGrayscale}%) brightness(${currentStageConfig.claudyBrightness}%) contrast(${currentStageConfig.claudyContrast}%)`,
      opacity: flowState === 'fade_out_all' ? 0 : 1,
      transition: 'transform 500ms ease, filter 500ms ease, opacity 1000ms ease-out',
      ...(flowState === 'pop_claudy'
        ? { animation: 'popIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }
        : {}),
    },
  };

  const handleIncreaseStage = () => {
    setTemperatureStage((prev) => {
      const next = Math.min(4, prev + 1);
      if (next === 4) {
        setHasReachedStage4(true);
      }
      return next;
    });
  };

  const handleDecreaseStage = () => {
    setTemperatureStage((prev) => Math.max(1, prev - 1));
  };

  const handleResetInteraction = () => {
    setTemperatureStage(1);
    setHasReachedStage4(false);
  };

  // Set scene ready after initial 500ms buffer on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSceneReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Sync state when entering interaction phase directly
  useEffect(() => {
    if (phase === 'playground-interaction') {
      setOpIndex(sequence.length);
      setFlowState('interactive');
      setActiveSpeech(null);
      setCharacters((prev) =>
        prev.map((c) => ({
          ...c,
          visible: c.id !== 'mia' && c.id !== 'adam',
          ...(c.id === 'tippy' ? { x: 62, y: 100, height: 60 } : {}),
          asset:
            c.id === 'claudy'
              ? '/characters/claudy/claudygrey-idle.gif'
              : `/characters/${c.id}/${c.id}-idle.gif`,
        }))
      );
    }
  }, [phase, sequence.length]);

  const handleLoadStatus = (id: string, success: boolean) => {
    setLoadStatus((prev) => ({ ...prev, [id]: success }));
  };

  const handleUpdateCharacter = (id: string, updates: Partial<CharacterConfig>) => {
    setCharacters((prev) =>
      prev.map((char) => (char.id === id ? { ...char, ...updates } : char))
    );
  };

  const selectedChar = characters.find((c) => c.id === selectedCharId) || characters[0];

  // Helper to get character info for active speech
  const getCharInfo = (id: string) => {
    if (id === 'narrator') {
      return { name: 'Narrator', x: 50, y: 15, height: 0 };
    }
    const c = charactersRef.current.find((char) => char.id === id);
    return c
      ? { name: c.name, x: c.x, y: c.y, height: c.height }
      : { name: id, x: 50, y: 50, height: 40 };
  };

  // Execute sequence operations step-by-step
  useEffect(() => {
    if (!isSceneReady || !isPlaying || isPaused) return;

    if (opIndex >= sequence.length) {
      if (flowState === 'conversation' && phase !== 'playground-interaction') {
        setFlowState('await_next');
      }
      return;
    }

    const op = sequence[opIndex];
    let isCancelled = false;

    if (op.type === 'switch_gif' && op.targetGif) {
      // 1. Immediately switch character GIF asset
      setCharacters((prev) =>
        prev.map((c) => (c.id === op.characterId ? { ...c, asset: op.targetGif! } : c))
      );

      // Custom hold duration if specified, else 600ms if waitFlag, else 300ms
      const holdTime =
        op.durationMs !== undefined ? op.durationMs : op.waitFlag ? 600 : 300;

      const timer = setTimeout(() => {
        if (!isCancelled) setOpIndex((prev) => prev + 1);
      }, holdTime);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    } else if (op.type === 'speech' && op.speechText) {
      // 2. Display speech bubble & play speech audio
      const charInfo = getCharInfo(op.characterId);
      setActiveSpeech({
        characterId: op.characterId,
        characterName: charInfo.name,
        text: op.speechText,
        characterX: charInfo.x,
        characterY: charInfo.y,
        characterHeight: charInfo.height,
      });

      if (op.async) {
        // Non-blocking / asynchronous speech: start speech in background, advance sequence after durationMs
        speakText(op.speechText, () => {
          setActiveSpeech((prev) => (prev?.text === op.speechText ? null : prev));
        });

        const advanceDelay = op.durationMs !== undefined ? op.durationMs : 100;
        const advanceTimer = setTimeout(() => {
          if (!isCancelled) setOpIndex((prev) => prev + 1);
        }, advanceDelay);

        return () => {
          isCancelled = true;
          clearTimeout(advanceTimer);
        };
      } else {
        // Synchronous speech: wait for speech to complete before advancing
        const cleanupSpeech = speakText(op.speechText, () => {
          if (!isCancelled) {
            setActiveSpeech((prev) => (prev?.text === op.speechText ? null : prev));
            setOpIndex((prev) => prev + 1);
          }
        });

        return () => {
          isCancelled = true;
          cleanupSpeech();
        };
      }
    } else if (op.type === 'wait' && op.durationMs) {
      // 3. Wait for specified duration (e.g. animation duration)
      const timer = setTimeout(() => {
        if (!isCancelled) {
          setOpIndex((prev) => prev + 1);
        }
      }, op.durationMs);

      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [opIndex, isPlaying, isPaused, isSceneReady, sequence, flowState, phase]);

  // Handle Presentation Flow Transitions (Step 3 -> Step 8)
  useEffect(() => {
    if (flowState === 'fade_out_all') {
      const timer = setTimeout(() => {
        setFlowState('fade_in_bg');
      }, 1000); // 1s fade out duration
      return () => clearTimeout(timer);
    }

    if (flowState === 'fade_in_bg') {
      // Hide Mia and Adam, set Claudy hidden until pop_claudy, set Tippy ready with x:62, y:100, height:60
      setCharacters((prev) =>
        prev.map((c) => {
          if (c.id === 'mia' || c.id === 'adam') {
            return { ...c, visible: false };
          }
          if (c.id === 'tippy') {
            return {
              ...c,
              visible: true,
              asset: '/characters/tippy/tippy-idle.gif',
              x: 62,
              y: 100,
              height: 60,
            };
          }
          if (c.id === 'claudy') {
            return { ...c, visible: false };
          }
          return c;
        })
      );

      // Wait 1000ms for background to fully fade back in + 1000ms pause before Tippy fades in
      const timer = setTimeout(() => {
        setFlowState('tippy_entering');
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (flowState === 'tippy_entering') {
      const timer = setTimeout(() => {
        setFlowState('tippy_narration');
      }, 1000); // 1s Tippy fade in
      return () => clearTimeout(timer);
    }

    if (flowState === 'tippy_narration') {
      setCharacters((prev) =>
        prev.map((c) =>
          c.id === 'tippy' ? { ...c, asset: '/characters/tippy/tippy-talking.gif' } : c
        )
      );
      const tippyChar = charactersRef.current.find((c) => c.id === 'tippy');
      setActiveSpeech({
        characterId: 'tippy',
        characterName: 'Tippy',
        text: 'Can you make the temperature go up, and see what happens?',
        characterX: tippyChar?.x ?? 48,
        characterY: tippyChar?.y ?? 88,
        characterHeight: tippyChar?.height ?? 48,
      });

      const cleanupSpeech = speakText(
        'Can you make the temperature go up, and see what happens?',
        () => {
          setActiveSpeech(null);
          setCharacters((prev) =>
            prev.map((c) =>
              c.id === 'tippy' ? { ...c, asset: '/characters/tippy/tippy-idle.gif' } : c
            )
          );
          setFlowState('pause_after_narration');
        }
      );

      return () => {
        cleanupSpeech();
      };
    }

    if (flowState === 'pause_after_narration') {
      const timer = setTimeout(() => {
        setFlowState('pop_sun');
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (flowState === 'pop_sun') {
      playPopSound(1.1);
      const timer = setTimeout(() => {
        setFlowState('pop_thermo');
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (flowState === 'pop_thermo') {
      playPopSound(1.35);
      const timer = setTimeout(() => {
        setFlowState('pop_claudy');
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (flowState === 'pop_claudy') {
      setCharacters((prev) =>
        prev.map((c) => (c.id === 'claudy' ? { ...c, visible: true } : c))
      );
      playPopSound(0.85);
      const timer = setTimeout(() => {
        setFlowState('interactive');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [flowState]);

  const handlePressNext = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setActiveSpeech(null);
    setFlowState('fade_out_all');
  };

  // Developer Controls Logic
  const totalSteps = Math.max(...sequence.map((s) => s.stepNumber), 1);
  const currentOp = opIndex < sequence.length ? sequence[opIndex] : null;
  const currentStepNumber = currentOp ? currentOp.stepNumber : totalSteps;
  const currentStepDesc =
    currentOp?.stepDescription ||
    (opIndex >= sequence.length ? 'Sequence Complete' : `Step ${currentStepNumber}`);

  const handlePlayScene = () => {
    if (opIndex >= sequence.length) {
      handleRestartSequence();
    } else {
      setIsPlaying(true);
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  };

  const handleResume = () => {
    setIsPaused(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  };

  const handleRestartSequence = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setActiveSpeech(null);
    setCharacters(scene1Config.characters);
    setOpIndex(0);
    setFlowState('conversation');
    setIsPlaying(true);
    setIsPaused(false);
    handleResetInteraction();
  };

  const handleSkipStep = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setActiveSpeech(null);

    if (opIndex >= sequence.length) return;

    const currentStep = sequence[opIndex].stepNumber;
    let nextIdx = opIndex;
    const newAssetMap: Record<string, string> = {};

    while (nextIdx < sequence.length && sequence[nextIdx].stepNumber === currentStep) {
      const op = sequence[nextIdx];
      if (op.type === 'switch_gif' && op.targetGif) {
        newAssetMap[op.characterId] = op.targetGif;
      }
      nextIdx++;
    }

    if (Object.keys(newAssetMap).length > 0) {
      setCharacters((prev) =>
        prev.map((c) => (newAssetMap[c.id] ? { ...c, asset: newAssetMap[c.id] } : c))
      );
    }

    setOpIndex(nextIdx);
    setIsPaused(false);
    setIsPlaying(true);
  };

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-0 m-0 bg-slate-950 relative min-h-0 min-w-0">
      <SceneCanvas variant="fullscreen">
        {/* Full Scene Fade Overlay for Next Transition */}
        <div
          className={`absolute inset-0 bg-black z-50 pointer-events-none transition-opacity duration-1000 ease-out ${
            flowState === 'fade_out_all' ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Layer 1: Background */}
        <BackgroundLayer imageSrc={scene1Config.background} isDevMode={isDevMode} />

        {/* Layer 2: Characters */}
        <CharacterLayer
          characters={characters}
          characterStyles={characterStyles}
          isDevMode={isDevMode}
          onCharacterLoadStatus={handleLoadStatus}
        />

        {/* Layer 3: Speech Bubble */}
        <SpeechBubbleLayer speech={activeSpeech} />

        {/* Layer 4: Interaction Layer */}
        <InteractionLayer isInteractive={isSunVisible || isThermoVisible}>
          <TemperatureInteraction
            visible={isSunVisible || isThermoVisible}
            isSunVisible={isSunVisible}
            isSunPopping={isSunPopping}
            isThermoVisible={isThermoVisible}
            isThermoPopping={isThermoPopping}
            isInteractionEnabled={isInteractionEnabled}
            temperatureStage={temperatureStage}
            hasReachedStage4={hasReachedStage4}
            onIncreaseStage={handleIncreaseStage}
            onDecreaseStage={handleDecreaseStage}
            position={thermoPosition}
          />
        </InteractionLayer>

        {/* STEP 2: Large "Next" Button at Bottom of Screen (Fade in over 300ms) */}
        {flowState === 'await_next' && (
          <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 transition-opacity duration-300 opacity-100">
            <button
              onClick={handlePressNext}
              aria-label="Next step"
              className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xl sm:text-2xl px-8 py-3.5 sm:px-10 sm:py-4 rounded-full shadow-2xl border-3 border-amber-300 ring-4 ring-emerald-400/40 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans tracking-wide"
            >
              <span>Next</span>
              <ArrowRight className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3.5] transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </SceneCanvas>

      {/* Developer Mode Overlay Controls */}
      {isDevMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-slate-100 p-2.5 sm:p-3 rounded-2xl border border-emerald-500/40 shadow-2xl flex flex-col gap-2 max-w-2xl w-[calc(100%-1.5rem)] backdrop-blur-md font-mono text-xs">
          {/* Header & Step Display */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Tv className="w-3.5 h-3.5" /> [Dev] Scene 1 Sequence
              </span>
              <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded text-[11px] font-bold">
                Step {currentStepNumber} / {totalSteps}: {currentStepDesc}
              </span>
            </div>

            <div className="flex gap-1.5 items-center">
              {phase === 'playground-story' && (
                <button
                  onClick={onNextPhase}
                  className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Next Phase</span>
                </button>
              )}
              {phase === 'playground-interaction' && (
                <button
                  onClick={onRestart}
                  className="inline-flex items-center gap-1 bg-slate-700 hover:bg-slate-600 text-slate-100 font-sans font-bold text-[11px] px-2.5 py-1 rounded-lg transition cursor-pointer border border-slate-600"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
              )}
            </div>
          </div>

          {/* Sequence Runner Developer Controls */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            {(!isPlaying || isPaused || opIndex >= sequence.length) ? (
              <button
                onClick={isPaused ? handleResume : handlePlayScene}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isPaused ? 'Resume' : opIndex >= sequence.length ? 'Replay Scene' : 'Play Scene'}</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-500 text-white font-sans font-bold text-[11px] px-3 py-1.5 rounded-lg transition cursor-pointer shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={handleRestartSequence}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-sans font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Scene</span>
            </button>

            <button
              onClick={handleSkipStep}
              disabled={opIndex >= sequence.length}
              className="inline-flex items-center gap-1 bg-sky-900/80 hover:bg-sky-800 text-sky-200 border border-sky-700/60 font-sans font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-3.5 h-3.5" />
              <span>Skip Step</span>
            </button>
          </div>

          {/* Character Selector & Tuner */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mr-1">
              <Sliders className="w-3 h-3 inline mr-1" />
              Tuner:
            </span>
            {characters.map((char) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharId(char.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                  selectedCharId === char.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <span>{char.name}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    loadStatus[char.id] === true
                      ? 'bg-emerald-400'
                      : loadStatus[char.id] === false
                      ? 'bg-rose-400'
                      : 'bg-amber-400'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Controls for Selected Character */}
          {selectedChar && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-[11px]">
              {/* X position */}
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400">X Position (%): {selectedChar.x}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedChar.x}
                  onChange={(e) =>
                    handleUpdateCharacter(selectedChar.id, { x: Number(e.target.value) })
                  }
                  className="accent-emerald-400 h-1.5 cursor-pointer"
                />
              </div>

              {/* Y position */}
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400">Y Position (%): {selectedChar.y}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedChar.y}
                  onChange={(e) =>
                    handleUpdateCharacter(selectedChar.id, { y: Number(e.target.value) })
                  }
                  className="accent-emerald-400 h-1.5 cursor-pointer"
                />
              </div>

              {/* Height */}
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400">Height (%): {selectedChar.height}</span>
                <input
                  type="range"
                  min="5"
                  max="80"
                  value={selectedChar.height}
                  onChange={(e) =>
                    handleUpdateCharacter(selectedChar.id, { height: Number(e.target.value) })
                  }
                  className="accent-emerald-400 h-1.5 cursor-pointer"
                />
              </div>

              {/* zIndex */}
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-400">zIndex: {selectedChar.zIndex}</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={selectedChar.zIndex}
                  onChange={(e) =>
                    handleUpdateCharacter(selectedChar.id, { zIndex: Number(e.target.value) })
                  }
                  className="bg-slate-900 border border-slate-700 rounded px-1 text-slate-200 text-xs w-full"
                />
              </div>

              {/* Visibility */}
              <div className="flex flex-col justify-end">
                <button
                  onClick={() =>
                    handleUpdateCharacter(selectedChar.id, { visible: !selectedChar.visible })
                  }
                  className={`w-full py-1 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer border ${
                    selectedChar.visible
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                  }`}
                >
                  {selectedChar.visible ? (
                    <>
                      <Eye className="w-3 h-3" /> Visible
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3 h-3" /> Hidden
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Developer Mode Temperature Interaction Debug Section */}
          <div className="flex flex-col gap-1.5 bg-amber-950/40 p-2 rounded-xl border border-amber-500/30 text-[11px] mt-1">
            <div className="flex items-center justify-between text-amber-300 font-bold border-b border-amber-800/40 pb-1">
              <span className="flex items-center gap-1">
                <ThermometerSun className="w-3.5 h-3.5 text-amber-400" /> [Dev] Temperature Interaction State
              </span>
              <span className="bg-amber-900/80 text-amber-200 border border-amber-600/50 px-2 py-0.5 rounded font-mono text-[10px]">
                Stage {temperatureStage} / 4 ({currentStageConfig.temperature}°C)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-slate-300 font-mono">
              <div>Stage: <span className="text-amber-400 font-bold">{temperatureStage}</span></div>
              <div>Temp: <span className="text-amber-400 font-bold">{currentStageConfig.temperature}°C</span></div>
              <div>Stage 4 Reached: <span className={hasReachedStage4 ? "text-emerald-400 font-bold" : "text-slate-500"}>{hasReachedStage4 ? "YES" : "NO"}</span></div>
              <div>Liquid Height: <span className="text-amber-400 font-bold">{currentStageConfig.thermometerLevel}%</span></div>
              <div>Liquid Color: <span className="font-bold" style={{ color: currentStageConfig.thermometerColor }}>{currentStageConfig.thermometerColor}</span></div>
              <div>Sun Scale: <span className="text-amber-400 font-bold">{currentStageConfig.sunScale}x</span></div>
              <div>Claudy Scale: <span className="text-amber-400 font-bold">{currentStageConfig.claudyScale}x</span></div>
              <div>Claudy Grayscale: <span className="text-amber-400 font-bold">{currentStageConfig.claudyGrayscale}%</span></div>
            </div>

            {/* Thermometer & +/- Group Position Controls */}
            <div className="flex flex-col gap-1.5 bg-slate-900/90 p-2 rounded-lg border border-amber-500/30 text-[11px] my-0.5">
              <div className="flex items-center justify-between text-amber-300 font-bold text-[10px]">
                <span>Thermometer & +/- Buttons Position (Group)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-emerald-300 text-[10px]">
                    X: {thermoPosition.x}% | Y: {thermoPosition.y}% | Gap: {thermoPosition.gap}%
                  </span>
                  <button
                    onClick={() => setThermoPosition({ x: 8, y: 57.5, gap: 9 })}
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-800/60 cursor-pointer transition"
                  >
                    Reset Pos
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-300 font-mono">
                {/* Pos X */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Pos X (%):</span>
                    <span className="text-amber-300 font-bold">{thermoPosition.x}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="0.5"
                    value={thermoPosition.x}
                    onChange={(e) =>
                      setThermoPosition((prev) => ({ ...prev, x: Number(e.target.value) }))
                    }
                    className="accent-amber-400 h-1.5 cursor-pointer"
                  />
                </div>

                {/* Pos Y */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>Pos Y (%):</span>
                    <span className="text-amber-300 font-bold">{thermoPosition.y}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="0.5"
                    value={thermoPosition.y}
                    onChange={(e) =>
                      setThermoPosition((prev) => ({ ...prev, y: Number(e.target.value) }))
                    }
                    className="accent-amber-400 h-1.5 cursor-pointer"
                  />
                </div>

                {/* Gap / Buttons Offset */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span>+/- Gap (%):</span>
                    <span className="text-amber-300 font-bold">{thermoPosition.gap}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="0.5"
                    value={thermoPosition.gap}
                    onChange={(e) =>
                      setThermoPosition((prev) => ({ ...prev, gap: Number(e.target.value) }))
                    }
                    className="accent-amber-400 h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-amber-900/30">
              {[1, 2, 3, 4].map((stg) => (
                <button
                  key={stg}
                  onClick={() => {
                    setTemperatureStage(stg);
                    if (stg === 4) setHasReachedStage4(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition border ${
                    temperatureStage === stg
                      ? 'bg-amber-500 text-slate-950 border-amber-300'
                      : 'bg-slate-800 text-amber-200 border-amber-900/60 hover:bg-slate-700'
                  }`}
                >
                  Stage {stg} ({TEMPERATURE_STAGES[stg].temperature}°C)
                </button>
              ))}

              <button
                onClick={handleResetInteraction}
                className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60 cursor-pointer transition"
              >
                Reset Interaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
