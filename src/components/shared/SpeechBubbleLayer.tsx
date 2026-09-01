import React from 'react';

export interface ActiveSpeech {
  characterId: string;
  characterName: string;
  text: string;
  characterX: number;
  characterY: number;
  characterHeight: number;
}

interface SpeechBubbleLayerProps {
  speech: ActiveSpeech | null;
}

export const SpeechBubbleLayer: React.FC<SpeechBubbleLayerProps> = ({ speech }) => {
  if (!speech) return null;

  if (speech.characterId === 'narrator') {
    return (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-[90%] max-w-lg">
        <div className="bg-amber-950/95 text-amber-50 border-2 border-amber-400/80 shadow-2xl rounded-2xl px-4 py-3 text-xs sm:text-sm md:text-base font-semibold text-center pointer-events-auto backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="text-[10px] sm:text-[11px] font-mono font-extrabold uppercase tracking-widest text-amber-300 mb-0.5">
            Narrator
          </div>
          <p className="leading-snug italic font-serif text-amber-100">"{speech.text}"</p>
        </div>
      </div>
    );
  }

  // Calculate top percentage above character head
  const rawTop = speech.characterY - speech.characterHeight - 10;
  const topPercent = Math.max(3, Math.min(65, rawTop));

  // Determine left alignment and transform to keep inside stage
  let leftPercent = speech.characterX;
  let transformX = '-50%';

  if (speech.characterX < 25) {
    leftPercent = Math.max(12, speech.characterX);
    transformX = '-15%';
  } else if (speech.characterX > 75) {
    leftPercent = Math.min(88, speech.characterX);
    transformX = '-85%';
  }

  return (
    <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
      <div
        className="absolute transition-all duration-300 ease-out flex flex-col items-center"
        style={{
          left: `${leftPercent}%`,
          top: `${topPercent}%`,
          transform: `translateX(${transformX})`,
        }}
      >
        <div className="bg-white/95 text-slate-900 border-2 border-slate-800 shadow-2xl rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 max-w-[200px] sm:max-w-[280px] md:max-w-[340px] text-xs sm:text-sm font-bold tracking-tight text-center relative pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="text-[10px] sm:text-[11px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 mb-0.5">
            {speech.characterName}
          </div>
          <p className="leading-snug text-slate-900 font-sans font-medium">"{speech.text}"</p>

          {/* Speech bubble tail pointer pointing down toward character */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-slate-800" />
          <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      </div>
    </div>
  );
};
