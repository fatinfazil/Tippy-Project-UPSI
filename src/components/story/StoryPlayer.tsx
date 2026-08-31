import React, { useEffect, useState } from 'react';
import { StoryPhase } from '../../types/story';
import {
  enterFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
  isLandscape,
} from '../../utils/fullscreen';
import { Scene02Phase } from '../../scenes/scene02/types';
import { Scene05 } from '../../scenes/scene05/Scene05';
import { scene1Config } from '../../scenes/scene01/scene01.config';
import { WelcomeScreen } from './WelcomeScreen';
import { IntroductionVideo } from './IntroductionVideo';
import { Scene01 } from '../../scenes/scene01/Scene01';
import { Scene02 } from '../../scenes/scene02/Scene02';
import { DeveloperPanel } from '../developer/DeveloperPanel';
import { ActiveScene } from '../developer/SceneNavigator';
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
import { Wrench, BookOpen } from 'lucide-react';

interface StoryPlayerProps {
  /** When set (e.g. /play/{code} or /launch/{code}), wins over localStorage. */
  accessCode?: string | null;
}

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  accessCode: accessCodeProp = null,
}) => {
  const [activeScene, setActiveScene] = useState<ActiveScene>('welcome');
  const [scene1Phase, setScene1Phase] = useState<StoryPhase>('intro-video');
  const [scene2Phase, setScene2Phase] = useState<Scene02Phase>('video');
  const [scene1ResetKey, setScene1ResetKey] = useState<number>(0);
  const [scene2ResetKey, setScene2ResetKey] = useState<number>(0);
  const [scene5ResetKey, setScene5ResetKey] = useState<number>(0);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [assetsLoaded, setAssetsLoaded] = useState<boolean>(false);
  // Identity from prop, path, ?u=, saved session, or a code parked by install.
  const [childAccessCode] = useState<string | null>(
    () => accessCodeProp ?? resolveActiveAccessCode(),
  );
  const [childName, setChildName] = useState<string>(
    () => getSavedNickname(childAccessCode) ?? PLACEHOLDER_CHILD_NAME,
  );
  const [isLoadingChild, setIsLoadingChild] = useState<boolean>(() => Boolean(childAccessCode));
  const [childError, setChildError] = useState<boolean>(false);
  // No code at all means the device was never set up, which is not an error.
  const setupNeeded = !childAccessCode;

  useEffect(() => {
    if (!childAccessCode) {
      setIsLoadingChild(false);
      setChildName(PLACEHOLDER_CHILD_NAME);
      return;
    }

    let cancelled = false;
    setIsLoadingChild(true);
    setChildError(false);

    void fetchChild(childAccessCode).then((child) => {
      if (cancelled) return;
      if (child) {
        saveChildSession(child.access_code, child.nickname);
        setChildName(child.nickname);
        setChildError(false);
      } else {
        clearChildSession(childAccessCode);
        setChildName(PLACEHOLDER_CHILD_NAME);
        setChildError(true);
      }
      setIsLoadingChild(false);
    });

    return () => {
      cancelled = true;
    };
  }, [childAccessCode]);

  // Enter fullscreen on any tap while not already fullscreen (landscape only).
  // Fullscreen must be requested from a user gesture. Keep listening so a
  // failed first attempt (or later exit) can succeed on the next tap.
  useEffect(() => {
    if (!isFullscreenSupported()) return;

    const handleTap = () => {
      if (isLandscape() && !isFullscreenActive()) {
        void enterFullscreen();
      }
    };

    document.addEventListener('pointerdown', handleTap);
    return () => document.removeEventListener('pointerdown', handleTap);
  }, []);

  const handleSelectScene = (scene: ActiveScene) => {

  setActiveScene(scene);


  if (scene === 'scene01') {

    setScene1Phase('intro-video');
    setScene1ResetKey((k) => k + 1);

  } else if (scene === 'scene02') {

    setScene2Phase('video');
    setScene2ResetKey((k) => k + 1);

  } else if (scene === 'scene05') {

    setScene5ResetKey((k) => k + 1);

  }

};

  const handleSelectScene1Phase = (phase: StoryPhase) => {
    setActiveScene('scene01');
    setScene1Phase(phase);
    setScene1ResetKey((k) => k + 1);
  };

  const handleSelectScene2Phase = (phase: Scene02Phase) => {
    setActiveScene('scene02');
    setScene2Phase(phase);
    setScene2ResetKey((k) => k + 1);
  };

  const handleJumpScene2Interaction = () => {
    setActiveScene('scene02');
    setScene2Phase('interaction');
    setScene2ResetKey((k) => k + 1);
  };

  // Download all media assets before showing the game to avoid on-the-fly
  // loading hitches during playback.
  if (!assetsLoaded) {
    return <LoadingScreen onComplete={() => setAssetsLoaded(true)} />;
  }

  return (
    <div className="w-full h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col overflow-hidden min-h-0 relative select-none">
      {/* Portrait Mode Warning Overlay */}
      <OrientationNotice />

      {/* Top Responsive Header Bar */}
      <header className="flex-shrink-0 w-full border-b border-emerald-900/30 bg-slate-900/80 backdrop-blur-md px-3 sm:px-6 py-1.5 sm:py-2.5 flex items-center justify-between z-40 transition-all short-landscape-compact-py">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md flex-shrink-0 short-landscape-icon-sm">
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 font-bold" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-wide truncate short-landscape-text-sm">
              Tippy Wira Hijau
            </h1>
            <p className="text-[10px] sm:text-[11px] text-emerald-400/80 font-medium hidden md:block short-landscape-hide">
              An Interactive Climate Adventure
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Fullscreen toggle - landscape only, hides browser UI */}
          <FullscreenButton />

          {/* Dev Mode Toggle Pill - Hidden on short landscape when Dev Mode is OFF */}
          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition cursor-pointer border shadow-sm ${
              !isDevMode ? 'short-landscape-hide' : ''
            } ${
              isDevMode
                ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-300 ring-2 ring-emerald-400/30'
                : 'bg-slate-800/80 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Wrench className="w-3 h-3" />
            <span className="hidden sm:inline">Developer Mode: {isDevMode ? 'ON' : 'OFF'}</span>
            <span className="sm:hidden">DEV: {isDevMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </header>

      {/* Main Story Stage Area (Consumes all remaining space below header) */}
      <main className="flex-1 min-h-0 w-full overflow-hidden relative flex items-center justify-center p-0 m-0 bg-slate-950">
        {activeScene === 'welcome' && (
          <WelcomeScreen
            childName={childName}
            isLoadingChild={isLoadingChild}
            childError={childError}
            setupNeeded={setupNeeded}
            onStartStory={() => {
              setActiveScene('scene01');
              setScene1Phase('intro-video');
            }}
          />
        )}

        {activeScene === 'scene01' && scene1Phase === 'intro-video' && (
          <IntroductionVideo
            videoSrc={scene1Config.introVideo}
            onVideoComplete={() => {
              setScene1Phase('playground-story');
            }}
            isDevMode={isDevMode}
          />
        )}

        {activeScene === 'scene01' && (scene1Phase === 'playground-story' || scene1Phase === 'playground-interaction') && (
          <Scene01
            key={`scene1-${scene1ResetKey}`}
            phase={scene1Phase}
            onNextPhase={() => setScene1Phase('playground-interaction')}
            onRestart={() => {
              setActiveScene('welcome');
            }}
            onComplete={() => {
              setActiveScene('scene02');
              setScene2Phase('video');
              setScene2ResetKey((k) => k + 1);
            }}
            isDevMode={isDevMode}
          />
        )}

        {activeScene === 'scene02' && (
          <Scene02
            key={`scene2-${scene2ResetKey}`}
            phase={scene2Phase}
            onPhaseChange={(p) => setScene2Phase(p)}
            isDevMode={isDevMode}
            onComplete={() => {
              setActiveScene('scene05');
              setScene5ResetKey((k) => k + 1);
            }}
          />
        )}

        {activeScene === 'scene05' && (
          <Scene05
            key={`scene5-${scene5ResetKey}`}
            onComplete={() => {
              setActiveScene('welcome');
            }}
            isDevMode={isDevMode}
          />
        )}

      </main>

      {/* Floating Developer Panel */}
      <DeveloperPanel
        activeScene={activeScene}
        scene1Phase={scene1Phase}
        scene2Phase={scene2Phase}
        onSelectScene={handleSelectScene}
        onSelectScene1Phase={handleSelectScene1Phase}
        onSelectScene2Phase={handleSelectScene2Phase}
        onJumpScene2Interaction={handleJumpScene2Interaction}
        isDevMode={isDevMode}
        onToggleDevMode={() => setIsDevMode(false)}
      />
    </div>
  );
};
