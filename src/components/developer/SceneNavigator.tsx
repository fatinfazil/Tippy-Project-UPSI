import React from 'react';
import { StoryPhase } from '../../types/story';
import { Scene02Phase } from '../../scenes/scene02/types';
import { Compass, Sparkles, Play, Film, MessageSquare, Zap } from 'lucide-react';

export type ActiveScene =
  | 'welcome'
  | 'scene01'
  | 'scene02'
  | 'scene05';

interface SceneNavigatorProps {
  activeScene: ActiveScene;
  scene1Phase: StoryPhase;
  scene2Phase: Scene02Phase;
  onSelectScene: (scene: ActiveScene) => void;
  onSelectScene1Phase: (phase: StoryPhase) => void;
  onSelectScene2Phase: (phase: Scene02Phase) => void;
  onJumpScene2Interaction: () => void;
}

export const SceneNavigator: React.FC<SceneNavigatorProps> = ({
  activeScene,
  scene1Phase,
  scene2Phase,
  onSelectScene,
  onSelectScene1Phase,
  onSelectScene2Phase,
  onJumpScene2Interaction,
}) => {
  return (
    <div className="space-y-3 font-mono text-xs">
      {/* Scene Navigator Header */}
      <div className="flex items-center gap-1.5 text-sky-400 font-bold border-b border-slate-800 pb-1.5">
        <Compass className="w-4 h-4 text-sky-400" />
        <span>Scene Navigator</span>
      </div>

      {/* Global Major Scene Buttons */}
      <div>
        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1 block">
          Major Scene
        </label>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectScene('welcome')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
              activeScene === 'welcome'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Welcome
          </button>
          <button
            onClick={() => onSelectScene('scene01')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
              activeScene === 'scene01'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Scene 1
          </button>
          <button
            onClick={() => onSelectScene('scene02')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
              activeScene === 'scene02'
                ? 'bg-sky-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Scene 2
          </button>

          <button
  onClick={() => onSelectScene('scene05')}
  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
    activeScene === 'scene05'
      ? 'bg-sky-600 text-white shadow-md'
      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
  }`}
>
  Scene 5
</button>
        </div>
      </div>

      {/* Current Active Scene Indicator */}
      <div className="flex justify-between items-center bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]">
        <span className="text-slate-400">Current Scene:</span>
        <span className="font-bold text-sky-300 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/60">
          {activeScene === 'welcome' && 'Welcome Screen'}
          {activeScene === 'scene01' && 'Scene 1 (Park)'}
          {activeScene === 'scene02' && 'Scene 2 (Garden)'}
          {activeScene === 'scene05' && 'Scene 5 (Green City)'}
        </span>
      </div>

      {/* Scene-Specific Phase Navigation */}
      {activeScene === 'scene01' && (
        <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <label className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
            Scene 1 Phase Jump
          </label>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => onSelectScene1Phase('intro-video')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                scene1Phase === 'intro-video'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Film className="w-3 h-3" />
              <span>Intro Video</span>
            </button>
            <button
              onClick={() => onSelectScene1Phase('playground-story')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                scene1Phase === 'playground-story'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Story</span>
            </button>
            <button
              onClick={() => onSelectScene1Phase('playground-interaction')}
              className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1 ${
                scene1Phase === 'playground-interaction'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Interaction</span>
            </button>
          </div>
        </div>
      )}

      {activeScene === 'scene02' && (
        <div className="space-y-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <label className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
            Scene 2 Phase Jump
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onSelectScene2Phase('video')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                scene2Phase === 'video'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => onSelectScene2Phase('interaction')}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                scene2Phase === 'interaction'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Interaction</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Action: Direct Scene 2 Interaction Jump */}
      <div className="pt-1">
        <button
          onClick={onJumpScene2Interaction}
          className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white py-2 px-3 rounded-xl text-[11px] font-bold transition cursor-pointer shadow-lg active:scale-95 border border-sky-400/30"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
          <span>Direct Jump: Scene 2 → Interaction</span>
        </button>
      </div>
    </div>
  );
};
