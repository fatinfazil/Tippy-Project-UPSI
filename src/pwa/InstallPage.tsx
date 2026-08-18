import React, { useCallback, useEffect, useState } from 'react';
import { BookOpen, Download, Play } from 'lucide-react';
import { fetchChild, saveChildSession } from '../config/childApi';
import {
  applyDynamicManifestLink,
  rememberLaunch,
  rememberPendingAccessCode,
} from './identity';
import { playPathFor } from './userId';

/** Chromium-only event that lets us raise the native install prompt ourselves. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPageProps {
  /** null when the link is malformed or the id fails validation. */
  userId: string | null;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ presents itself as a desktop Mac, so also look for touch.
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  );
}

const IOS_STEPS = [
  // Naming Safari matters: the in-app browsers in WhatsApp and similar apps
  // create a plain shortcut instead of a real PWA.
  'In Safari, tap the Share button (square with an up arrow).',
  'Scroll down and tap "Add to Home Screen".',
  'Tap "Add".',
  'Open Tippy from the new Home Screen icon.',
];

const OTHER_BROWSER_STEPS = [
  'Open your browser menu.',
  'Choose "Install app" or "Add to Home screen".',
  'Confirm, then open Tippy from the new icon.',
];

export const InstallPage: React.FC<InstallPageProps> = ({ userId }) => {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [steps, setSteps] = useState<string[] | null>(null);
  const [lookup, setLookup] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    applyDynamicManifestLink(userId);
  }, [userId]);

  // A link is only usable once the database confirms the child behind it.
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    setLookup('loading');

    void fetchChild(userId).then((child) => {
      if (cancelled) return;
      if (child?.nickname) {
        setNickname(child.nickname);
        setLookup('ready');
        // Only park ids that resolve, so /play never recovers a dead one.
        rememberPendingAccessCode(userId);
      } else {
        setNickname(null);
        setLookup('failed');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      // Suppress Chrome's own banner so the Install button owns the moment.
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setSteps(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handlePlay = useCallback(() => {
    if (!userId) return;
    rememberLaunch(userId);
    // Cache the nickname so /play greets the child without a second lookup.
    if (nickname) saveChildSession(userId, nickname);
    window.location.assign(playPathFor(userId));
  }, [userId, nickname]);

  const handleInstall = useCallback(async () => {
    // Safari has no install API, and Chromium only offers one once it has
    // fired beforeinstallprompt. Fall back to telling the parent what to tap.
    if (!installPrompt) {
      setSteps(isIosDevice() ? IOS_STEPS : OTHER_BROWSER_STEPS);
      return;
    }

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    // The event is single-use whatever the answer.
    setInstallPrompt(null);
    if (outcome !== 'accepted') {
      setSteps(isIosDevice() ? IOS_STEPS : OTHER_BROWSER_STEPS);
    }
  }, [installPrompt]);

  if (!userId) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-2xl font-extrabold text-amber-400 mb-3">
            This link looks incomplete
          </h1>
          <p className="text-base text-slate-300 leading-relaxed">
            Please reopen the full Tippy link from the school. It ends with a
            short code, for example{' '}
            <code className="font-mono text-sm bg-slate-800 px-1.5 py-0.5 rounded">
              /u/AB7K2
            </code>
            .
          </p>
        </div>
      </div>
    );
  }

  // Nothing is actionable until the child behind this link is confirmed.
  const ready = lookup === 'ready';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg mb-4">
          <BookOpen className="w-9 h-9" />
        </div>

        {lookup === 'loading' ? (
          <h1 className="text-2xl font-extrabold text-slate-400 leading-tight">
            Just a moment…
          </h1>
        ) : lookup === 'failed' ? (
          <h1 className="text-2xl font-extrabold text-amber-400 leading-tight">
            Oops, please contact support
          </h1>
        ) : (
          <h1 className="text-2xl font-extrabold text-white leading-tight">
            Hello {nickname}, welcome.
          </h1>
        )}

        <p className="text-sm text-slate-400 mt-2 mb-8">Tippy Wira Hijau</p>

        <button
          onClick={handlePlay}
          disabled={!ready}
          className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 enabled:hover:from-emerald-600 enabled:hover:to-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xl px-6 py-4 rounded-2xl shadow-lg transition-all enabled:active:translate-y-0.5 cursor-pointer border-b-4 border-emerald-700"
        >
          <Play className="w-6 h-6 fill-current" />
          Play
        </button>

        <button
          onClick={handleInstall}
          disabled={!ready || installed}
          className="w-full mt-3 inline-flex items-center justify-center gap-3 bg-slate-800 enabled:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-lg px-6 py-4 rounded-2xl border border-slate-700 transition-all enabled:active:translate-y-0.5 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          {installed ? 'Installed' : 'Install'}
        </button>

        {steps && (
          <ol className="w-full mt-6 text-left bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </span>
                <span className="leading-relaxed pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};
