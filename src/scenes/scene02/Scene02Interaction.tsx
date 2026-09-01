import React, { useState, useEffect, useCallback } from 'react';
import { SceneCanvas } from '../../components/shared/SceneCanvas';
import { BackgroundLayer } from '../../components/shared/BackgroundLayer';
import { CharacterLayer } from '../../components/shared/CharacterLayer';
import { SpeechBubbleLayer, ActiveSpeech } from '../../components/shared/SpeechBubbleLayer';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { scene02Config, getClaudyStageInfo } from './scene02.config';
import { CharacterConfig } from '../../types/story';
import { Scene02Phase, DropletConfig, ClaudyStageInfo } from './types';
import { Scene02DeveloperPanel } from './Scene02DeveloperPanel';
import { WaterDropletInteraction } from './WaterDropletInteraction';

interface Scene02InteractionProps {
  onComplete: () => void;
  isDevMode?: boolean;
  phase?: Scene02Phase;
  onPhaseChange?: (phase: Scene02Phase) => void;
}

const speakText = (text: string, onEnd: () => void) => {
  let isDone = false;

  const complete = () => {
    if (isDone) return;
    isDone = true;
    clearTimeout(safetyTimer);
    onEnd();
  };

  // Safety fallback timer so speech callback never hangs indefinitely
  const maxMs = Math.max(3500, text.length * 90);
  const safetyTimer = setTimeout(() => {
    complete();
  }, maxMs);

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onend = () => {
        complete();
      };

      utterance.onerror = () => {
        complete();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      complete();
    }
  } else {
    // If SpeechSynthesis is not supported, safetyTimer will naturally complete after reading time
  }

  return () => {
    if (!isDone) {
      isDone = true;
      clearTimeout(safetyTimer);
      try {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {}
    }
  };
};

export const Scene02Interaction: React.FC<Scene02InteractionProps> = ({
  onComplete,
  isDevMode = false,
  phase: externalPhase,
  onPhaseChange,
}) => {
  const [characters, setCharacters] = useState<CharacterConfig[]>(scene02Config.characters);
  const [droplets, setDroplets] = useState<DropletConfig[]>(scene02Config.droplets);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('claudy');
  const [activeSpeech, setActiveSpeech] = useState<ActiveSpeech | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  // Current Scene 2 phase: 'conversation' | 'ready' | 'droplet-intro' | 'interaction'
  const [currentPhase, setCurrentPhase] = useState<Scene02Phase>(externalPhase || 'conversation');
  const [visibleDropletCount, setVisibleDropletCount] = useState<number>(0);
  const [isPositioningMode, setIsPositioningMode] = useState<boolean>(false);
  const [claudyStyle, setClaudyStyle] = useState<React.CSSProperties>({});
  const [isExitingScene, setIsExitingScene] = useState<boolean>(false);
  const [claudyDebugInfo, setClaudyDebugInfo] = useState<{
    collectedCount: number;
    stageInfo: ClaudyStageInfo;
    scale: number;
  }>({
    collectedCount: 0,
    stageInfo: getClaudyStageInfo(0),
    scale: 1.0,
  });

  const handleClaudyAssetChange = useCallback((newAsset: string) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === 'claudy' && c.asset !== newAsset ? { ...c, asset: newAsset } : c))
    );
  }, []);

  const handleTriggerWarningSpeech = useCallback(
    (text: string, onSpeechEnd: () => void) => {
      const claudyChar =
        characters.find((c) => c.id === 'claudy') ||
        scene02Config.characters.find((c) => c.id === 'claudy');

      setActiveSpeech({
        characterId: 'claudy',
        characterName: 'Claudy',
        text,
        characterX: claudyChar?.x ?? 50,
        characterY: claudyChar?.y ?? 100,
        characterHeight: claudyChar?.height ?? 45,
      });

      speakText(text, () => {
        setActiveSpeech(null);
        onSpeechEnd();
      });
    },
    [characters]
  );

  const handleSceneComplete = useCallback(() => {
    setIsExitingScene(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  const handleDropletMove = (id: string, x: number, y: number) => {
    setDroplets((prev) =>
      prev.map((d) => (d.id === id ? { ...d, x, y } : d))
    );
  };

  useEffect(() => {
    if (externalPhase && externalPhase !== 'video') {
      setCurrentPhase(externalPhase);
    }
  }, [externalPhase]);

  // Handle phase specific defaults
  useEffect(() => {
    if (currentPhase === 'interaction') {
      setVisibleDropletCount(10);
      setActiveSpeech(null);
    } else if (currentPhase === 'ready') {
      setVisibleDropletCount(0);
      setActiveSpeech(null);
    } else if (currentPhase === 'conversation') {
      setVisibleDropletCount(0);
    }
  }, [currentPhase]);

  // Play dialogue sequence when in 'conversation' phase
  useEffect(() => {
    if (currentPhase !== 'conversation') {
      return;
    }

    if (activeStepIndex < 0 || activeStepIndex >= scene02Config.dialogueSequence.length) {
      setActiveSpeech(null);
      // Conversation complete! Return all characters to idle
      setCharacters((prev) =>
        prev.map((c) => {
          const def = scene02Config.characters.find((d) => d.id === c.id);
          return def ? { ...c, asset: def.asset } : c;
        })
      );

      // Wait 450ms then show Start Activity button (ready phase)
      const readyTimer = setTimeout(() => {
        setCurrentPhase('ready');
        if (onPhaseChange) onPhaseChange('ready');
      }, 450);

      return () => clearTimeout(readyTimer);
    }

    const step = scene02Config.dialogueSequence[activeStepIndex];

    // 1. Switch active character asset to talking GIF
    setCharacters((prev) =>
      prev.map((c) => (c.id === step.characterId ? { ...c, asset: step.talkingGif } : c))
    );

    // 2. Find character config for speech bubble positioning
    const charConfig =
      characters.find((c) => c.id === step.characterId) ||
      scene02Config.characters.find((c) => c.id === step.characterId);

    setActiveSpeech({
      characterId: step.characterId,
      characterName: step.characterName,
      text: step.speechText,
      characterX: charConfig?.x ?? 50,
      characterY: charConfig?.y ?? 100,
      characterHeight: charConfig?.height ?? 45,
    });

    let delayTimer: NodeJS.Timeout | null = null;

    // 3. Play TTS & wait for speech to finish
    const cleanupSpeech = speakText(step.speechText, () => {
      // Speech ended
      setActiveSpeech(null);

      // Switch character asset back to idle GIF
      setCharacters((prev) =>
        prev.map((c) => (c.id === step.characterId ? { ...c, asset: step.idleGif } : c))
      );

      // Wait delayAfterMs before advancing
      delayTimer = setTimeout(() => {
        setActiveStepIndex((prev) => prev + 1);
      }, step.delayAfterMs);
    });

    return () => {
      cleanupSpeech();
      if (delayTimer) clearTimeout(delayTimer);
    };
  }, [activeStepIndex, currentPhase, onPhaseChange]);

  // Handle droplet entrance animation when in 'droplet-intro' phase
  useEffect(() => {
    if (currentPhase !== 'droplet-intro') return;

    setVisibleDropletCount(0);
    let count = 0;

    const interval = setInterval(() => {
      count += 1;
      setVisibleDropletCount(count);

      if (count >= scene02Config.totalDroplets) {
        clearInterval(interval);
        // Wait for final droplet pop animation to finish (~200ms) then enter interaction phase
        setTimeout(() => {
          setCurrentPhase('interaction');
          if (onPhaseChange) onPhaseChange('interaction');
        }, 220);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [currentPhase, onPhaseChange]);

  const handleStartActivity = () => {
    setCurrentPhase('droplet-intro');
    if (onPhaseChange) onPhaseChange('droplet-intro');
  };

  const handleFieldChange = (
    id: string,
    field: 'x' | 'y' | 'height' | 'zIndex',
    value: number
  ) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleResetSelected = (id: string) => {
    const defaultChar = scene02Config.characters.find((c) => c.id === id);
    if (defaultChar) {
      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...defaultChar } : c))
      );
    }
  };

  const handleResetAll = () => {
    setCharacters(scene02Config.characters);
    setActiveSpeech(null);
    setActiveStepIndex(0);
    setVisibleDropletCount(0);
    setIsExitingScene(false);
    setCurrentPhase('conversation');
    if (onPhaseChange) onPhaseChange('conversation');
  };

  const handleReplayDialogue = () => {
    setCharacters((prev) =>
      prev.map((c) => {
        const def = scene02Config.characters.find((d) => d.id === c.id);
        return def ? { ...c, asset: def.asset } : c;
      })
    );
    setActiveSpeech(null);
    setActiveStepIndex(0);
    setVisibleDropletCount(0);
    setIsExitingScene(false);
    setCurrentPhase('conversation');
    if (onPhaseChange) onPhaseChange('conversation');
  };

  const handlePhaseChangeInternal = (newPhase: Scene02Phase) => {
    setCurrentPhase(newPhase);
    if (onPhaseChange) onPhaseChange(newPhase);
  };

  // Dynamically attach current character position to activeSpeech for responsive updates
  const speakerChar = activeSpeech ? characters.find((c) => c.id === activeSpeech.characterId) : null;
  const speechForRender =
    activeSpeech && speakerChar
      ? {
          ...activeSpeech,
          characterX: speakerChar.x,
          characterY: speakerChar.y,
          characterHeight: speakerChar.height,
        }
      : activeSpeech;

  return (
    <div className={`w-full h-full flex-1 flex flex-col items-center justify-center bg-slate-950 text-white relative overflow-hidden select-none transition-opacity duration-300 ${
      isExitingScene ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <SceneCanvas variant="fullscreen">
        {/* Background Layer */}
        <BackgroundLayer imageSrc={scene02Config.background} isDevMode={isDevMode} />

        {/* Character Layer - Claudy, Tippy, Mia, Adam */}
        <CharacterLayer characters={characters} characterStyles={{ claudy: claudyStyle }} isDevMode={isDevMode} />

        {/* Speech Bubble Layer */}
        <SpeechBubbleLayer speech={speechForRender} />

        {/* Water Droplet Activity Entrance Layer */}
        <WaterDropletInteraction
          showStartButton={currentPhase === 'ready'}
          onStartActivity={handleStartActivity}
          visibleDropletCount={visibleDropletCount}
          droplets={droplets}
          dropletAsset={scene02Config.dropletAsset}
          onDropletMove={handleDropletMove}
          isDraggable={isDevMode && isPositioningMode}
          currentPhase={currentPhase}
          isDevMode={isDevMode}
          claudyCharacter={characters.find((c) => c.id === 'claudy')}
          onClaudyStyleChange={setClaudyStyle}
          onClaudyAssetChange={handleClaudyAssetChange}
          onClaudyDebugInfoChange={setClaudyDebugInfo}
          onTriggerWarningSpeech={handleTriggerWarningSpeech}
          onComplete={handleSceneComplete}
        />

        {/* Scene 2 Developer Panel - Only rendered when Dev Mode is ON */}
        {isDevMode && (
          <Scene02DeveloperPanel
            characters={characters}
            selectedId={selectedCharacterId}
            onSelectCharacter={setSelectedCharacterId}
            onChangeField={handleFieldChange}
            onResetSelected={handleResetSelected}
            onResetAll={handleResetAll}
            onReplayDialogue={handleReplayDialogue}
            currentPhase={currentPhase}
            onPhaseChange={handlePhaseChangeInternal}
            droplets={droplets}
            isPositioningMode={isPositioningMode}
            onTogglePositioningMode={() => setIsPositioningMode((prev) => !prev)}
            claudyDebugInfo={claudyDebugInfo}
          />
        )}

        {/* Compact "Complete Scene 2" button in top-right corner */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {isDevMode && (
            <button
              onClick={handleReplayDialogue}
              className="inline-flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-sky-300 font-bold text-xs px-3 py-2 rounded-xl shadow-lg border border-sky-500/30 transition cursor-pointer active:scale-95 backdrop-blur-md"
              title="Replay Dialogue"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Replay Dialogue</span>
            </button>
          )}
          <button
            onClick={onComplete}
            className="inline-flex items-center gap-2 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg border border-emerald-400/30 transition cursor-pointer active:scale-95 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Complete Scene 2</span>
          </button>
        </div>
      </SceneCanvas>
    </div>
  );
};



