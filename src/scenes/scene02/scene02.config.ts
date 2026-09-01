import { Scene02Config, Scene02DialogueStep, ClaudyStageInfo } from './types';

export const claudyStages = {
  stage1: '/characters/claudy/claudy-idle.gif',
  stage2: '/characters/claudy/claudy-stage2.gif',
  stage3: '/characters/claudy/claudy-stage3.gif',
  stage4: '/characters/claudy/claudy-stage4.gif',
};

export const getClaudyStageInfo = (collectedCount: number): ClaudyStageInfo => {
  if (collectedCount >= 10) {
    return {
      stage: 4,
      name: 'Stage 4 / Final Claudy',
      asset: claudyStages.stage4,
    };
  }
  if (collectedCount >= 7) {
    return {
      stage: 3,
      name: 'Stage 3 / Too Full Claudy',
      asset: claudyStages.stage3,
    };
  }
  if (collectedCount >= 4) {
    return {
      stage: 2,
      name: 'Stage 2 / Getting Full Claudy',
      asset: claudyStages.stage2,
    };
  }
  return {
    stage: 1,
    name: 'Stage 1 / Happy Claudy',
    asset: claudyStages.stage1,
  };
};

export const preloadClaudyStages = () => {
  if (typeof window === 'undefined') return;
  Object.values(claudyStages).forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

export const scene02DialogueSequence: Scene02DialogueStep[] = [
  {
    id: 'tippy-dialogue-1',
    characterId: 'tippy',
    characterName: 'Tippy',
    speechText: 'Can you help us see what happens when a cloud collects more and more water?',
    talkingGif: '/characters/tippy/tippy-talking.gif',
    idleGif: '/characters/tippy/tippy-idle.gif',
    delayAfterMs: 300,
  },
  {
    id: 'mia-dialogue-1',
    characterId: 'mia',
    characterName: 'Mia',
    speechText: 'Try dragging the water droplets into Claudy and see what happens!',
    talkingGif: '/characters/mia/mia-talking.gif',
    idleGif: '/characters/mia/mia-idle.gif',
    delayAfterMs: 500,
  },
];

export const scene02Config: Scene02Config = {
  id: 'scene02',
  title: 'Claudy Collects Water',
  video: '/videos/scene2-video.mp4',
  background: '/bg/bg_scene2_gadern.png',
  characterAssets: {
    claudyDefault: '/characters/claudy/claudy-idle.gif',
  },
  claudyStages,
  totalDroplets: 10,
  dropletAsset: '/characters/droplet.png',
  droplets: [
    { id: 'droplet-01', x: 47.6, y: 17.7, size: 8.2, zIndex: 10 },
    { id: 'droplet-02', x: 90.9, y: 27.1, size: 8.2, zIndex: 10 },
    { id: 'droplet-03', x: 78.7, y: 20.6, size: 8.5, zIndex: 10 },
    { id: 'droplet-04', x: 66.1, y: 38.4, size: 8.2, zIndex: 10 },
    { id: 'droplet-05', x: 81.7, y: 56.7, size: 8.5, zIndex: 10 },
    { id: 'droplet-06', x: 94.4, y: 62.8, size: 8.5, zIndex: 10 },
    { id: 'droplet-07', x: 39.4, y: 42.7, size: 8.8, zIndex: 10 },
    { id: 'droplet-08', x: 17.5, y: 58.6, size: 8.2, zIndex: 10 },
    { id: 'droplet-09', x: 4, y: 39.7, size: 8.2, zIndex: 10 },
    { id: 'droplet-10', x: 6, y: 79.7, size: 8.2, zIndex: 10 },
  ],
  dialogueSequence: scene02DialogueSequence,
  characters: [
    {
      id: 'claudy',
      name: 'Claudy',
      asset: '/characters/claudy/claudy-idle.gif',
      x: 21,
      y: 42.8,
      height: 48,
      zIndex: 3,
      visible: true,
    },
    {
      id: 'tippy',
      name: 'Tippy',
      asset: '/characters/tippy/tippy-idle.gif',
      x: 36,
      y: 100,
      height: 45,
      zIndex: 4,
      visible: true,
    },
    {
      id: 'mia',
      name: 'Mia',
      asset: '/characters/mia/mia-idle.gif',
      x: 51,
      y: 100,
      height: 45,
      zIndex: 4,
      visible: true,
    },
    {
      id: 'adam',
      name: 'Adam',
      asset: '/characters/adam/adam-idle.gif',
      x: 66,
      y: 100,
      height: 45.1,
      zIndex: 4,
      visible: true,
    },
  ],
};


