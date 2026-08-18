import { CharacterConfig } from '../../types/story';

export type Scene02Phase = 'video' | 'conversation' | 'ready' | 'droplet-intro' | 'interaction';

export interface Scene02Props {
  onComplete: () => void;
  isDevMode?: boolean;
  phase?: Scene02Phase;
  onPhaseChange?: (phase: Scene02Phase) => void;
}

export interface Scene02DialogueStep {
  id: string;
  characterId: string;
  characterName: string;
  speechText: string;
  talkingGif: string;
  idleGif: string;
  delayAfterMs: number;
}

export interface DropletConfig {
  id: string;
  x: number;
  y: number;
  size: number;
  zIndex?: number;
}

export interface ClaudyStageInfo {
  stage: number;
  name: string;
  asset: string;
}

export interface Scene02Config {
  id: string;
  title: string;
  video: string;
  background: string;
  characterAssets: {
    claudyDefault: string;
  };
  claudyStages: {
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
  };
  totalDroplets: number;
  dropletAsset: string;
  droplets: DropletConfig[];
  characters: CharacterConfig[];
  dialogueSequence: Scene02DialogueStep[];
}

