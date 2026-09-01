import React, {
  useEffect,
  useState,
} from 'react';

import { StoryPhase } from '../../types/story';
import { Scene02Phase } from '../../scenes/scene02/types';

import {
  enterFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
  isLandscape,
} from '../../utils/fullscreen';

import { scene1Config } from '../../scenes/scene01/scene01.config';

import { WelcomeScreen } from './WelcomeScreen';
import { IntroductionVideo } from './IntroductionVideo';

import { Scene01 } from '../../scenes/scene01/Scene01';
import { Scene02 } from '../../scenes/scene02/Scene02';
import { Scene05 } from '../../scenes/scene05/Scene05';

// Scene08 is a default export.
import Scene08 from '../../scenes/scene08/Scene08';

import { DeveloperPanel } from '../developer/DeveloperPanel';

import {
  ActiveScene,
} from '../developer/SceneNavigator';

import { OrientationNotice } from '../layout/OrientationNotice';
import { LoadingScreen } from '../layout/LoadingScreen';
import { FullscreenButton } from '../layout/FullscreenButton';

import {
  resolveActiveAccessCode,
  fetchChild,
  saveChildSession,
  clearChildSession,
  getSavedNickname,
  PLACEHOLDER_CHILD_NAME,
} from '../../config/childApi';

import {
  Wrench,
  BookOpen,
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface StoryPlayerProps {
  /**
   * When set, for example /play/{code}
   * or /launch/{code}, this value wins
   * over localStorage.
   */
  accessCode?: string | null;
}

// ============================================
// STORY PLAYER
// ============================================

export const StoryPlayer: React.FC<
  StoryPlayerProps
> = ({
  accessCode: accessCodeProp = null,
}) => {

  // ==========================================
  // ACTIVE SCENE
  // ==========================================

  const [
    activeScene,
    setActiveScene,
  ] = useState<ActiveScene>(
    'welcome'
  );

  // ==========================================
  // SCENE PHASES
  // ==========================================

  const [
    scene1Phase,
    setScene1Phase,
  ] = useState<StoryPhase>(
    'intro-video'
  );

  const [
    scene2Phase,
    setScene2Phase,
  ] = useState<Scene02Phase>(
    'video'
  );

  // ==========================================
  // SCENE RESET KEYS
  // ==========================================

  const [
    scene1ResetKey,
    setScene1ResetKey,
  ] = useState<number>(0);

  const [
    scene2ResetKey,
    setScene2ResetKey,
  ] = useState<number>(0);

  const [
    scene5ResetKey,
    setScene5ResetKey,
  ] = useState<number>(0);

  // ==========================================
  // APPLICATION STATE
  // ==========================================

  const [
    isDevMode,
    setIsDevMode,
  ] = useState<boolean>(false);

  const [
    assetsLoaded,
    setAssetsLoaded,
  ] = useState<boolean>(false);

  // ==========================================
  // CHILD ACCESS CODE
  // ==========================================

  const [
    childAccessCode,
  ] = useState<string | null>(
    () =>
      accessCodeProp ??
      resolveActiveAccessCode()
  );

  // ==========================================
  // CHILD NAME
  // ==========================================

  const [
    childName,
    setChildName,
  ] = useState<string>(
    () =>
      getSavedNickname(
        childAccessCode
      ) ??
      PLACEHOLDER_CHILD_NAME
  );

  // ==========================================
  // CHILD LOADING
  // ==========================================

  const [
    isLoadingChild,
    setIsLoadingChild,
  ] = useState<boolean>(
    () =>
      Boolean(childAccessCode)
  );

  const [
    childError,
    setChildError,
  ] = useState<boolean>(false);

  // No access code means the device
  // has not been set up yet.
  const setupNeeded =
    !childAccessCode;

  // ==========================================
  // LOAD CHILD INFORMATION
  // ==========================================

  useEffect(() => {
    if (!childAccessCode) {
      setIsLoadingChild(false);

      setChildName(
        PLACEHOLDER_CHILD_NAME
      );

      return;
    }

    let cancelled = false;

    setIsLoadingChild(true);
    setChildError(false);

    void fetchChild(
      childAccessCode
    ).then((child) => {

      if (cancelled) {
        return;
      }

      if (child) {

        saveChildSession(
          child.access_code,
          child.nickname
        );

        setChildName(
          child.nickname
        );

        setChildError(false);

      } else {

        clearChildSession(
          childAccessCode
        );

        setChildName(
          PLACEHOLDER_CHILD_NAME
        );

        setChildError(true);
      }

      setIsLoadingChild(false);
    });

    return () => {
      cancelled = true;
    };
  }, [childAccessCode]);

  // ==========================================
  // FULLSCREEN ON USER TAP
  // ==========================================

  useEffect(() => {
    if (!isFullscreenSupported()) {
      return;
    }

    const handleTap = () => {

      if (
        isLandscape() &&
        !isFullscreenActive()
      ) {
        void enterFullscreen();
      }
    };

    document.addEventListener(
      'pointerdown',
      handleTap
    );

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleTap
      );
    };
  }, []);

  // ==========================================
  // SELECT MAJOR SCENE
  // ==========================================

  const handleSelectScene = (
    scene: ActiveScene
  ) => {

    setActiveScene(scene);

    if (
      scene === 'scene01'
    ) {

      setScene1Phase(
        'intro-video'
      );

      setScene1ResetKey(
        (previous) =>
          previous + 1
      );

    } else if (
      scene === 'scene02'
    ) {

      setScene2Phase(
        'video'
      );

      setScene2ResetKey(
        (previous) =>
          previous + 1
      );

    } else if (
      scene === 'scene05'
    ) {

      setScene5ResetKey(
        (previous) =>
          previous + 1
      );
    }
  };

  // ==========================================
  // SELECT SCENE 1 PHASE
  // ==========================================

  const handleSelectScene1Phase = (
    phase: StoryPhase
  ) => {

    setActiveScene(
      'scene01'
    );

    setScene1Phase(
      phase
    );

    setScene1ResetKey(
      (previous) =>
        previous + 1
    );
  };

  // ==========================================
  // SELECT SCENE 2 PHASE
  // ==========================================

  const handleSelectScene2Phase = (
    phase: Scene02Phase
  ) => {

    setActiveScene(
      'scene02'
    );

    setScene2Phase(
      phase
    );

    setScene2ResetKey(
      (previous) =>
        previous + 1
    );
  };

  // ==========================================
  // DIRECT SCENE 2 INTERACTION
  // ==========================================

  const handleJumpScene2Interaction =
    () => {

      setActiveScene(
        'scene02'
      );

      setScene2Phase(
        'interaction'
      );

      setScene2ResetKey(
        (previous) =>
          previous + 1
      );
    };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (!assetsLoaded) {
    return (
      <LoadingScreen
        onComplete={() =>
          setAssetsLoaded(true)
        }
      />
    );
  }

  // ==========================================
  // MAIN STORY PLAYER
  // ==========================================

  return (
    <div
      className="
        relative

        flex
        flex-col

        w-full
        h-screen
        h-[100dvh]

        min-h-0

        overflow-hidden

        select-none

        bg-slate-950
        text-slate-100
      "
    >

      {/* ==================================== */}
      {/* PORTRAIT MODE WARNING */}
      {/* ==================================== */}

      <OrientationNotice />

      {/* ==================================== */}
      {/* TOP HEADER */}
      {/* ==================================== */}

      <header
        className="
          z-40

          flex
          flex-shrink-0

          items-center
          justify-between

          w-full

          px-3
          sm:px-6

          py-1.5
          sm:py-2.5

          border-b
          border-emerald-900/30

          bg-slate-900/80

          backdrop-blur-md

          transition-all

          short-landscape-compact-py
        "
      >

        {/* ================================== */}
        {/* TITLE */}
        {/* ================================== */}

        <div
          className="
            flex
            items-center

            gap-2
            sm:gap-3

            min-w-0
          "
        >

          <div
            className="
              flex
              flex-shrink-0

              items-center
              justify-center

              w-7
              h-7

              sm:w-8
              sm:h-8

              rounded-lg

              bg-gradient-to-tr
              from-emerald-500
              to-teal-400

              text-slate-950

              shadow-md

              short-landscape-icon-sm
            "
          >
            <BookOpen
              className="
                w-4
                h-4

                sm:w-5
                sm:h-5

                font-bold
              "
            />
          </div>

          <div
            className="
              min-w-0
              truncate
            "
          >

            <h1
              className="
                truncate

                text-sm
                sm:text-base
                md:text-lg

                font-extrabold

                tracking-wide

                text-white

                short-landscape-text-sm
              "
            >
              Tippy Wira Hijau
            </h1>

            <p
              className="
                hidden
                md:block

                text-[10px]
                sm:text-[11px]

                font-medium

                text-emerald-400/80

                short-landscape-hide
              "
            >
              An Interactive Climate Adventure
            </p>

          </div>
        </div>

        {/* ================================== */}
        {/* HEADER BUTTONS */}
        {/* ================================== */}

        <div
          className="
            flex
            flex-shrink-0

            items-center

            gap-2
          "
        >

          <FullscreenButton />

          {/* ================================= */}
          {/* DEVELOPER MODE */}
          {/* ================================= */}

          <button
            type="button"
            onClick={() =>
              setIsDevMode(
                (previous) =>
                  !previous
              )
            }
            className={`
              inline-flex
              items-center

              gap-1.5

              px-2.5
              py-1

              rounded-full

              border

              text-[11px]

              font-mono

              shadow-sm

              transition

              cursor-pointer

              ${
                !isDevMode
                  ? 'short-landscape-hide'
                  : ''
              }

              ${
                isDevMode
                  ? `
                    bg-emerald-500
                    border-emerald-300
                    text-slate-950
                    font-bold
                    ring-2
                    ring-emerald-400/30
                  `
                  : `
                    bg-slate-800/80
                    border-slate-700
                    text-slate-300
                    hover:text-white
                    hover:bg-slate-700
                  `
              }
            `}
          >

            <Wrench
              className="
                w-3
                h-3
              "
            />

            <span
              className="
                hidden
                sm:inline
              "
            >
              Developer Mode:{' '}
              {isDevMode
                ? 'ON'
                : 'OFF'}
            </span>

            <span
              className="
                sm:hidden
              "
            >
              DEV:{' '}
              {isDevMode
                ? 'ON'
                : 'OFF'}
            </span>

          </button>

        </div>

      </header>

      {/* ==================================== */}
      {/* MAIN STORY STAGE */}
      {/* ==================================== */}

      <main
        className="
          relative

          flex
          flex-1

          items-center
          justify-center

          w-full

          min-h-0

          p-0
          m-0

          overflow-hidden

          bg-slate-950
        "
      >

        {/* ================================== */}
        {/* WELCOME */}
        {/* ================================== */}

        {activeScene ===
          'welcome' && (
          <WelcomeScreen
            childName={childName}
            isLoadingChild={
              isLoadingChild
            }
            childError={
              childError
            }
            setupNeeded={
              setupNeeded
            }
            onStartStory={() => {

              setActiveScene(
                'scene01'
              );

              setScene1Phase(
                'intro-video'
              );
            }}
          />
        )}

        {/* ================================== */}
        {/* SCENE 1 INTRO VIDEO */}
        {/* ================================== */}

        {activeScene ===
          'scene01' &&
          scene1Phase ===
            'intro-video' && (
          <IntroductionVideo
            videoSrc={
              scene1Config.introVideo
            }
            onVideoComplete={() =>
              setScene1Phase(
                'playground-story'
              )
            }
            isDevMode={
              isDevMode
            }
          />
        )}

        {/* ================================== */}
        {/* SCENE 1 STORY / INTERACTION */}
        {/* ================================== */}

        {activeScene ===
          'scene01' &&
          (
            scene1Phase ===
              'playground-story' ||
            scene1Phase ===
              'playground-interaction'
          ) && (
          <Scene01
            key={
              `scene1-${scene1ResetKey}`
            }
            phase={
              scene1Phase
            }
            onNextPhase={() =>
              setScene1Phase(
                'playground-interaction'
              )
            }
            onRestart={() => {
              setActiveScene(
                'welcome'
              );
            }}
            onComplete={() => {

              setActiveScene(
                'scene02'
              );

              setScene2Phase(
                'video'
              );

              setScene2ResetKey(
                (previous) =>
                  previous + 1
              );
            }}
            isDevMode={
              isDevMode
            }
          />
        )}

        {/* ================================== */}
        {/* SCENE 2 */}
        {/* ================================== */}

        {activeScene ===
          'scene02' && (
          <Scene02
            key={
              `scene2-${scene2ResetKey}`
            }
            phase={
              scene2Phase
            }
            onPhaseChange={(
              phase
            ) =>
              setScene2Phase(
                phase
              )
            }
            isDevMode={
              isDevMode
            }
            onComplete={() => {

              // Scene 2 goes to Scene 5
              setActiveScene(
                'scene05'
              );

              setScene5ResetKey(
                (previous) =>
                  previous + 1
              );
            }}
          />
        )}

        {/* ================================== */}
        {/* SCENE 5 */}
        {/* ================================== */}

        {activeScene ===
          'scene05' && (
          <Scene05
            key={
              `scene5-${scene5ResetKey}`
            }
            onComplete={() => {

              // After Scene 5,
              // continue to Scene 8 Quiz.
              setActiveScene(
                'scene08'
              );
            }}
            isDevMode={
              isDevMode
            }
          />
        )}

        {/* ================================== */}
        {/* SCENE 8 QUIZ */}
        {/* ================================== */}

        {activeScene ===
          'scene08' && (
          <Scene08
            accessCode={
              childAccessCode ?? ''
            }
            onComplete={() => {

              setActiveScene(
                'welcome'
              );
            }}
          />
        )}

      </main>

      {/* ==================================== */}
      {/* DEVELOPER PANEL */}
      {/* ==================================== */}

      <DeveloperPanel
        activeScene={
          activeScene
        }
        scene1Phase={
          scene1Phase
        }
        scene2Phase={
          scene2Phase
        }
        onSelectScene={
          handleSelectScene
        }
        onSelectScene1Phase={
          handleSelectScene1Phase
        }
        onSelectScene2Phase={
          handleSelectScene2Phase
        }
        onJumpScene2Interaction={
          handleJumpScene2Interaction
        }
        isDevMode={
          isDevMode
        }
        onToggleDevMode={() =>
          setIsDevMode(false)
        }
      />

    </div>
  );
};

export default StoryPlayer;