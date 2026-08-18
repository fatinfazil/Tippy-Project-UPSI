import React from 'react';

interface MaintenancePageProps {
  message: string;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ message }) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <p className="text-emerald-400 text-sm font-semibold tracking-wide">
          Tippy Wira Hijau
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">Tippy is resting</h1>
        <p className="mt-3 text-slate-400 text-base leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-5 py-4 text-lg font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Try again
        </button>
      </div>
    </div>
  );
};
