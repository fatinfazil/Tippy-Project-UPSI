export type StoryPhase =
  | 'welcome'
  | 'intro-video'
  | 'playground-story'
  | 'playground-interaction';

export interface CharacterConfig {
  id: string;
  name: string;
  asset: string;
  x: number;
  y: number;
  height: number;
  zIndex: number;
  visible: boolean;
}

export type SequenceOperationType = 'switch_gif' | 'speech' | 'wait';

export interface SequenceOperation {
  stepNumber: number;
  stepDescription?: string;
  type: SequenceOperationType;
  characterId: string;
  targetGif?: string;
  speechText?: string;
  waitFlag?: boolean;
  durationMs?: number;
  async?: boolean;
}

export interface SceneConfig {
  id: string;
  title: string;
  introVideo: string;
  background: string;
  characters: CharacterConfig[];
  sequence: SequenceOperation[];
  interactions: string[];
}
