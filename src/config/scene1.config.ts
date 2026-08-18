import { SceneConfig, SequenceOperation } from '../types/story';

export const STORY_STAGE_ASPECT_RATIO = 16 / 9;

export const scene1Sequence: SequenceOperation[] = [
  // STEP 1: Narrator intro
  {
    stepNumber: 1,
    stepDescription: 'Narrator intro',
    type: 'speech',
    characterId: 'narrator',
    speechText: 'A few moments later, Tippy, Mia, and Adam arrived at their neighbourhood playground.',
    waitFlag: true,
  },

  // STEP 2: Mia feels hot
  {
    stepNumber: 2,
    stepDescription: 'Mia feels hot',
    type: 'switch_gif',
    characterId: 'mia',
    targetGif: '/characters/mia/mia-hot.gif',
  },
  {
    stepNumber: 2,
    type: 'speech',
    characterId: 'mia',
    speechText: "It feel very hot today.",
    waitFlag: true,
  },

  // STEP 3: Adam notices Claudy (Mia switches back to idle, Adam points & speaks)
  {
    stepNumber: 3,
    stepDescription: 'Adam notices Claudy',
    type: 'switch_gif',
    characterId: 'mia',
    targetGif: '/characters/mia/mia-idle.gif',
    durationMs: 100,
  },
  {
    stepNumber: 3,
    type: 'switch_gif',
    characterId: 'adam',
    targetGif: '/characters/adam/adam-pointing.gif',
    durationMs: 100,
  },
  {
    stepNumber: 3,
    type: 'speech',
    characterId: 'adam',
    speechText: 'Look! That cloud is getting bigger and darker.',
    async: true,
    durationMs: 100,
  },
  {
    stepNumber: 3,
    type: 'wait',
    characterId: 'adam',
    durationMs: 1000,
  },

  // STEP 4: Claudy transforms (1 second after adam-pointing.gif starts)
  {
    stepNumber: 4,
    stepDescription: 'Claudy transforms',
    type: 'switch_gif',
    characterId: 'claudy',
    targetGif: '/characters/claudy/claudy-transform.gif',
    durationMs: 100,
  },
  {
    stepNumber: 4,
    type: 'wait',
    characterId: 'claudy',
    durationMs: 3200,
  },
  {
    stepNumber: 4,
    type: 'switch_gif',
    characterId: 'claudy',
    targetGif: '/characters/claudy/claudygrey-idle.gif',
    durationMs: 100,
  },

  // STEP 5: Adam returns to idle
  {
    stepNumber: 5,
    stepDescription: 'Adam returns to idle',
    type: 'switch_gif',
    characterId: 'adam',
    targetGif: '/characters/adam/adam-idle.gif',
  },

  // STEP 6: Tippy explains
  {
    stepNumber: 6,
    stepDescription: 'Tippy explains',
    type: 'switch_gif',
    characterId: 'tippy',
    targetGif: '/characters/tippy/tippy-talking.gif',
  },
  {
    stepNumber: 6,
    type: 'speech',
    characterId: 'tippy',
    speechText:
      'When the Earth gets warmer, the air can hold more water. Sometimes, this can make the rain fall very heavily.',
    waitFlag: true,
  },
  {
    stepNumber: 6,
    type: 'switch_gif',
    characterId: 'tippy',
    targetGif: '/characters/tippy/tippy-idle.gif',
  },

  // STEP 7: Claudy speaks
  {
    stepNumber: 7,
    stepDescription: 'Claudy speaks',
    type: 'switch_gif',
    characterId: 'claudy',
    targetGif: '/characters/claudy/claudy-talking.gif',
  },
  {
    stepNumber: 7,
    type: 'speech',
    characterId: 'claudy',
    speechText: 'I am not a bad cloud. I am just very full of water!',
    waitFlag: true,
  },
  {
    stepNumber: 7,
    type: 'switch_gif',
    characterId: 'claudy',
    targetGif: '/characters/claudy/claudy-idle.gif',
  },
];

export const scene1Config: SceneConfig = {
  id: 'scene-01',
  title: 'Scene 1',
  introVideo: '/videos/scene1-video.mp4',
  background: '/bg/bg_scene1_park.png',
  characters: [
    {
      id: 'claudy',
      name: 'Claudy',
      asset: '/characters/claudy/claudy-idle.gif',
      x: 16,
      y: 42,
      height: 42,
      zIndex: 2,
      visible: true,
    },
    {
      id: 'tippy',
      name: 'Tippy',
      asset: '/characters/tippy/tippy-idle.gif',
      x: 48,
      y: 88,
      height: 48,
      zIndex: 4,
      visible: true,
    },
    {
      id: 'mia',
      name: 'Mia',
      asset: '/characters/mia/mia-idle.gif',
      x: 68,
      y: 88,
      height: 48,
      zIndex: 4,
      visible: true,
    },
    {
      id: 'adam',
      name: 'Adam',
      asset: '/characters/adam/adam-idle.gif',
      x: 84,
      y: 88,
      height: 48,
      zIndex: 4,
      visible: true,
    },
  ],
  sequence: scene1Sequence,
  interactions: [],
};
