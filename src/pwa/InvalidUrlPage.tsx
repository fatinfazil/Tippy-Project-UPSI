import React from 'react';
import { HOME_PATH } from './routes';

export const InvalidUrlPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <p className="text-emerald-400 text-sm font-semibold tracking-wide">
          Tippy Wira Hijau
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Invalid URL</h1>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">
          This address is not a valid Tippy page.
        </p>
        <p className="mt-4 text-sm text-slate-500">
          Valid links look like{' '}
          <span className="text-slate-300">/</span>,{' '}
          <span className="text-slate-300">/dashboard</span>, or{' '}
          <span className="text-slate-300">/u/&lt;access_code&gt;</span>.
        </p>
        <a
          href={HOME_PATH}
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Go to home
        </a>
      </div>
    </div>
  );
};
