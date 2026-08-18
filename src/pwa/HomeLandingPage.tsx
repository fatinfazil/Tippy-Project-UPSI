import React, { useMemo } from 'react';
import { readActiveAccessCode } from './identity';
import { PARENT_HOME_PATH } from './routes';
import { installPathFor, isValidAccessCode, normalizeAccessCode } from './userId';

export const HomeLandingPage: React.FC = () => {
  const savedCode = useMemo(() => readActiveAccessCode(), []);

  const onPlay = () => {
    if (savedCode) {
      window.location.assign(installPathFor(savedCode));
      return;
    }
    const entered = window.prompt('Enter the child access code:');
    if (entered == null) return;
    const code = normalizeAccessCode(entered);
    if (!isValidAccessCode(code)) {
      window.alert('That access code is not valid.');
      return;
    }
    window.location.assign(installPathFor(code));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <p className="text-emerald-400 text-sm font-semibold tracking-wide">
          Tippy Wira Hijau
        </p>
        <h1 className="mt-2 text-4xl font-bold text-white tracking-tight">
          Tippy
        </h1>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">
          Climate story adventures for little explorers in Johor.
        </p>

        <div className="mt-10 space-y-4">
          <a
            href={PARENT_HOME_PATH}
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Enter Parent Dashboard
          </a>
          <button
            type="button"
            onClick={onPlay}
            className="flex w-full items-center justify-center rounded-2xl border border-slate-600 bg-slate-900 px-5 py-4 text-lg font-semibold text-white hover:border-emerald-400"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
};
