import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FastForward, Play, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { SceneCanvas } from '../shared/SceneCanvas';
import { useCachedMediaSrc } from '../../utils/cachedMedia';

interface IntroductionVideoProps {
  videoSrc: string;
  onVideoComplete: () => void;
  isDevMode: boolean;
}

type VideoStatus = 'loading' | 'playing' | 'paused' | 'blocked' | 'ended' | 'failed';

export const IntroductionVideo: React.FC<IntroductionVideoProps> = ({
  videoSrc,
  onVideoComplete,
  isDevMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<VideoStatus>('loading');
  const completedRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const [streamFallback, setStreamFallback] = useState(false);
  const { playbackSrc, ready, cached } = useCachedMediaSrc(videoSrc);
  const activeSrc = streamFallback ? videoSrc : playbackSrc;

  // Safely trigger video completion once
  const handleComplete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    if (videoRef.current) {
      videoRef.current.pause();
    }

    onVideoComplete();
  }, [onVideoComplete]);

  // Handle Autoplay & video play attempts
  const attemptPlay = useCallback(() => {
    if (!videoRef.current) return;

    const playPromise = videoRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isMountedRef.current) {
            setStatus('playing');
          }
        })
        .catch(() => {
          // Autoplay was prevented by browser policy
          if (isMountedRef.current) {
            setStatus('blocked');
          }
        });
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  // Reset completion state when the resolved source is ready to mount.
  useEffect(() => {
    completedRef.current = false;
    setStreamFallback(false);
    setStatus('loading');
  }, [videoSrc]);

  useEffect(() => {
    completedRef.current = false;
    setStatus('loading');
  }, [activeSrc]);

  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-0 m-0 bg-black relative min-h-0 min-w-0">
      <SceneCanvas variant="fullscreen">
        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {/* HTML5 Video Element */}
          {ready && status !== 'failed' && (
            <video
              key={activeSrc}
              ref={videoRef}
              src={activeSrc}
              autoPlay
              playsInline
              controls={false}
              className="w-full h-full object-contain bg-black block"
              onCanPlay={attemptPlay}
              onPlay={() => {
                if (isMountedRef.current) setStatus('playing');
              }}
              onPause={() => {
                if (isMountedRef.current && status !== 'ended' && status !== 'blocked') {
                  setStatus('paused');
                }
              }}
              onEnded={() => {
                if (isMountedRef.current) {
                  setStatus('ended');
                  handleComplete();
                }
              }}
              onError={() => {
                if (!isMountedRef.current) return;
                // Cached copy missing or unreadable: stream from the network.
                if (!streamFallback && cached) {
                  setStreamFallback(true);
                  setStatus('loading');
                  return;
                }
                setStatus('failed');
              }}
            />
          )}

          {/* Overlay 1: Autoplay Blocked - Manual Play Button */}
          {status === 'blocked' && (
            <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-3 animate-bounce">
                <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-white mb-1">Ready for Scene 1!</h3>
              <p className="text-slate-300 text-xs sm:text-sm max-w-sm mb-4">
                Click below to start playing the introduction video.
              </p>
              <button
                onClick={attemptPlay}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-base sm:text-lg px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-2xl shadow-xl transition transform hover:scale-105 active:scale-95 cursor-pointer border-b-4 border-emerald-700"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play Video</span>
              </button>
            </div>
          )}

          {/* Overlay 2: Failed Load Fallback */}
          {status === 'failed' && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
                <AlertCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <p className="text-rose-200 font-bold text-base sm:text-lg mb-1">
                The introduction video could not be loaded.
              </p>
              <p className="text-slate-400 text-xs max-w-sm mb-4">
                Don't worry! You can still continue directly to the story playground.
              </p>
              <button
                onClick={handleComplete}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
              >
                <span>Continue to Playground</span>
              </button>
            </div>
          )}

          {/* Overlay 3: Skip Intro Button (Top-Right overlay inside story stage) */}
          {status !== 'failed' && (
            <div
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-30 pointer-events-auto"
              style={{
                top: 'calc(0.5rem + var(--sat))',
                right: 'calc(0.5rem + var(--sar))',
              }}
            >
              <button
                onClick={handleComplete}
                className="inline-flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-slate-700/80 shadow-lg backdrop-blur-md transition cursor-pointer active:scale-95"
                title="Skip introduction video"
              >
                <span>Skip Intro</span>
                <FastForward className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          )}
        </div>
      </SceneCanvas>

      {/* Developer Mode Debug Information & Controls */}
      {isDevMode && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 text-slate-200 p-2.5 sm:p-3.5 rounded-2xl border border-emerald-500/40 shadow-2xl max-w-lg w-[calc(100%-1.5rem)] font-mono text-[11px] backdrop-blur-md">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
            <span className="text-emerald-400 font-bold">[Dev Mode] Video Debug</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
              {status}
            </span>
          </div>

          <p className="text-slate-400 truncate mb-2">
            Src: <span className="text-emerald-300">{videoSrc}</span>
            {streamFallback ? (
              <span className="text-amber-400"> (streaming)</span>
            ) : cached ? (
              <span className="text-teal-400"> (cached)</span>
            ) : null}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800">
            <button
              onClick={handleComplete}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Simulate End</span>
            </button>
            <button
              onClick={() => setStatus('failed')}
              className="inline-flex items-center gap-1 bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-sans text-xs px-2.5 py-1 rounded-lg transition cursor-pointer border border-rose-700/50"
            >
              <AlertCircle className="w-3 h-3" />
              <span>Simulate Error</span>
            </button>
            <button
              onClick={attemptPlay}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans text-xs px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
