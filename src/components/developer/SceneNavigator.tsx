import React from 'react';
import { StoryPhase } from '../../types/story';
import { Scene02Phase } from '../../scenes/scene02/types';

import {
  Compass,
  Sparkles,
  Film,
  MessageSquare,
  Zap,
  Brain,
} from 'lucide-react';

// ============================================
// ACTIVE SCENE
// ============================================

export type ActiveScene =
  | 'welcome'
  | 'scene01'
  | 'scene02'
  | 'scene05'
  | 'scene08';

// ============================================
// PROPS
// ============================================

interface SceneNavigatorProps {
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
}

// ============================================
// COMPONENT
// ============================================

export const SceneNavigator: React.FC<
  SceneNavigatorProps
> = ({
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

      {/* ====================================== */}
      {/* SCENE NAVIGATOR HEADER */}
      {/* ====================================== */}

      <div
        className="
          flex
          items-center
          gap-1.5
          pb-1.5
          border-b
          border-slate-800
          text-sky-400
          font-bold
        "
      >
        <Compass className="w-4 h-4 text-sky-400" />

        <span>
          Scene Navigator
        </span>
      </div>

      {/* ====================================== */}
      {/* MAJOR SCENE BUTTONS */}
      {/* ====================================== */}

      <div>
        <label
          className="
            block
            mb-1
            text-[10px]
            uppercase
            tracking-wider
            text-slate-400
            font-bold
          "
        >
          Major Scene
        </label>

        <div
          className="
            grid
            grid-cols-5
            gap-1
            p-1
            rounded-xl
            border
            border-slate-800
            bg-slate-950
          "
        >

          {/* WELCOME */}

          <button
            type="button"
            onClick={() =>
              onSelectScene('welcome')
            }
            className={`
              py-1.5
              px-2
              rounded-lg
              text-[11px]
              font-bold
              text-center
              transition
              cursor-pointer
              ${
                activeScene === 'welcome'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }
            `}
          >
            Welcome
          </button>

          {/* SCENE 1 */}

          <button
            type="button"
            onClick={() =>
              onSelectScene('scene01')
            }
            className={`
              py-1.5
              px-2
              rounded-lg
              text-[11px]
              font-bold
              text-center
              transition
              cursor-pointer
              ${
                activeScene === 'scene01'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }
            `}
          >
            Scene 1
          </button>

          {/* SCENE 2 */}

          <button
            type="button"
            onClick={() =>
              onSelectScene('scene02')
            }
            className={`
              py-1.5
              px-2
              rounded-lg
              text-[11px]
              font-bold
              text-center
              transition
              cursor-pointer
              ${
                activeScene === 'scene02'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }
            `}
          >
            Scene 2
          </button>

          {/* SCENE 5 */}

          <button
            type="button"
            onClick={() =>
              onSelectScene('scene05')
            }
            className={`
              py-1.5
              px-2
              rounded-lg
              text-[11px]
              font-bold
              text-center
              transition
              cursor-pointer
              ${
                activeScene === 'scene05'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }
            `}
          >
            Scene 5
          </button>

          {/* SCENE 8 */}

          <button
            type="button"
            onClick={() =>
              onSelectScene('scene08')
            }
            className={`
              py-1.5
              px-2
              rounded-lg
              text-[11px]
              font-bold
              text-center
              transition
              cursor-pointer
              ${
                activeScene === 'scene08'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }
            `}
          >
            Scene 8
          </button>

        </div>
      </div>

      {/* ====================================== */}
      {/* CURRENT ACTIVE SCENE */}
      {/* ====================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          px-2.5
          py-1.5
          rounded-lg
          border
          border-slate-800
          bg-slate-950/80
          text-[11px]
        "
      >
        <span className="text-slate-400">
          Current Scene:
        </span>

        <span
          className="
            px-2
            py-0.5
            rounded
            border
            border-sky-800/60
            bg-sky-950/80
            text-sky-300
            font-bold
          "
        >
          {activeScene === 'welcome' &&
            'Welcome Screen'}

          {activeScene === 'scene01' &&
            'Scene 1 (Park)'}

          {activeScene === 'scene02' &&
            'Scene 2 (Garden)'}

          {activeScene === 'scene05' &&
            'Scene 5 (Green City)'}

          {activeScene === 'scene08' &&
            'Scene 8 (Quiz)'}
        </span>
      </div>

      {/* ====================================== */}
      {/* SCENE 1 PHASE NAVIGATION */}
      {/* ====================================== */}

      {activeScene === 'scene01' && (
        <div
          className="
            space-y-1.5
            p-2.5
            rounded-xl
            border
            border-slate-800
            bg-slate-950/60
          "
        >
          <label
            className="
              block
              text-[10px]
              uppercase
              tracking-wider
              text-amber-400
              font-bold
            "
          >
            Scene 1 Phase Jump
          </label>

          <div className="grid grid-cols-3 gap-1">

            {/* INTRO VIDEO */}

            <button
              type="button"
              onClick={() =>
                onSelectScene1Phase(
                  'intro-video'
                )
              }
              className={`
                flex
                items-center
                justify-center
                gap-1
                py-1.5
                px-1
                rounded-lg
                text-[10px]
                font-bold
                transition
                cursor-pointer
                ${
                  scene1Phase === 'intro-video'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Film className="w-3 h-3" />

              <span>
                Intro Video
              </span>
            </button>

            {/* STORY */}

            <button
              type="button"
              onClick={() =>
                onSelectScene1Phase(
                  'playground-story'
                )
              }
              className={`
                flex
                items-center
                justify-center
                gap-1
                py-1.5
                px-1
                rounded-lg
                text-[10px]
                font-bold
                transition
                cursor-pointer
                ${
                  scene1Phase ===
                  'playground-story'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <MessageSquare className="w-3 h-3" />

              <span>
                Story
              </span>
            </button>

            {/* INTERACTION */}

            <button
              type="button"
              onClick={() =>
                onSelectScene1Phase(
                  'playground-interaction'
                )
              }
              className={`
                flex
                items-center
                justify-center
                gap-1
                py-1.5
                px-1
                rounded-lg
                text-[10px]
                font-bold
                transition
                cursor-pointer
                ${
                  scene1Phase ===
                  'playground-interaction'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Zap className="w-3 h-3" />

              <span>
                Interaction
              </span>
            </button>

          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* SCENE 2 PHASE NAVIGATION */}
      {/* ====================================== */}

      {activeScene === 'scene02' && (
        <div
          className="
            space-y-1.5
            p-2.5
            rounded-xl
            border
            border-slate-800
            bg-slate-950/60
          "
        >
          <label
            className="
              block
              text-[10px]
              uppercase
              tracking-wider
              text-emerald-400
              font-bold
            "
          >
            Scene 2 Phase Jump
          </label>

          <div className="grid grid-cols-2 gap-1.5">

            {/* VIDEO */}

            <button
              type="button"
              onClick={() =>
                onSelectScene2Phase(
                  'video'
                )
              }
              className={`
                flex
                items-center
                justify-center
                gap-1.5
                py-1.5
                px-2
                rounded-lg
                text-[11px]
                font-bold
                transition
                cursor-pointer
                ${
                  scene2Phase === 'video'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Film className="w-3.5 h-3.5" />

              <span>
                Video
              </span>
            </button>

            {/* INTERACTION */}

            <button
              type="button"
              onClick={() =>
                onSelectScene2Phase(
                  'interaction'
                )
              }
              className={`
                flex
                items-center
                justify-center
                gap-1.5
                py-1.5
                px-2
                rounded-lg
                text-[11px]
                font-bold
                transition
                cursor-pointer
                ${
                  scene2Phase ===
                  'interaction'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                }
              `}
            >
              <Zap className="w-3.5 h-3.5" />

              <span>
                Interaction
              </span>
            </button>

          </div>
        </div>
      )}

      {/* ====================================== */}
      {/* SCENE 8 INFORMATION */}
      {/* ====================================== */}

      {activeScene === 'scene08' && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            p-2.5
            rounded-xl
            border
            border-violet-800
            bg-violet-950/40
            text-violet-300
            font-bold
          "
        >
          <Brain className="w-4 h-4" />

          <span>
            Scene 8 Quiz
          </span>
        </div>
      )}

      {/* ====================================== */}
      {/* SCENE 5 INFORMATION */}
      {/* ====================================== */}

      {activeScene === 'scene05' && (
        <div
          className="
            flex
            items-center
            justify-center
            gap-2
            p-2.5
            rounded-xl
            border
            border-emerald-800
            bg-emerald-950/40
            text-emerald-300
            font-bold
          "
        >
          <Sparkles className="w-4 h-4" />

          <span>
            Scene 5 Green City
          </span>
        </div>
      )}

      {/* ====================================== */}
      {/* QUICK ACTIONS */}
      {/* ====================================== */}

      <div className="space-y-2 pt-1">

        {/* DIRECT SCENE 2 INTERACTION */}

        <button
          type="button"
          onClick={
            onJumpScene2Interaction
          }
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            w-full
            px-3
            py-2
            rounded-xl
            border
            border-sky-400/30
            bg-gradient-to-r
            from-sky-600
            to-emerald-600
            text-white
            text-[11px]
            font-bold
            shadow-lg
            transition
            cursor-pointer
            hover:from-sky-500
            hover:to-emerald-500
            active:scale-95
          "
        >
          <Sparkles
            className="
              w-4
              h-4
              text-amber-300
              animate-pulse
            "
          />

          <span>
            Direct Jump: Scene 2 → Interaction
          </span>
        </button>

        {/* DIRECT SCENE 8 QUIZ */}

        <button
          type="button"
          onClick={() =>
            onSelectScene('scene08')
          }
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            w-full
            px-3
            py-2
            rounded-xl
            border
            border-violet-400/30
            bg-gradient-to-r
            from-violet-600
            to-fuchsia-600
            text-white
            text-[11px]
            font-bold
            shadow-lg
            transition
            cursor-pointer
            hover:from-violet-500
            hover:to-fuchsia-500
            active:scale-95
          "
        >
          <Brain
            className="
              w-4
              h-4
              text-yellow-300
            "
          />

          <span>
            Direct Jump: Scene 8 → Quiz
          </span>
        </button>

      </div>
    </div>
  );
};

export default SceneNavigator;