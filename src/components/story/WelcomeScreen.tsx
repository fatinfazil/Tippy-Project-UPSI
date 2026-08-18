import React from 'react';
import { Play, Sparkles, Trees, Leaf } from 'lucide-react';

interface WelcomeScreenProps {
  childName: string;
  isLoadingChild?: boolean;
  childError?: boolean;
  /** No access_code stored yet — this device has never opened a setup link. */
  setupNeeded?: boolean;
  onStartStory: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  childName,
  isLoadingChild = false,
  childError = false,
  setupNeeded = false,
  onStartStory,
}) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-4 text-center overflow-hidden">
      <div className="max-w-xl w-full bg-white/95 backdrop-blur-md p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-emerald-300 shadow-xl flex flex-col items-center relative overflow-hidden my-auto">
        {/* Decorative background icons */}
        <div className="absolute -top-6 -left-6 text-emerald-100 opacity-80 pointer-events-none">
          <Trees size={90} />
        </div>
        <div className="absolute -bottom-6 -right-6 text-emerald-100 opacity-80 pointer-events-none">
          <Leaf size={90} />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-2 sm:mb-4 shadow-sm border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-bounce" />
          <span>For Little Explorers (Ages 4–8)</span>
        </div>

        {isLoadingChild ? (
          <p className="text-base sm:text-xl font-bold text-emerald-700 mb-4 sm:mb-8">
            Looking up your Tippy link…
          </p>
        ) : setupNeeded ? (
          <div className="mb-2 sm:mb-4 max-w-md">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-900 tracking-tight mb-3 sm:mb-4 drop-shadow-sm font-sans leading-tight">
              Tippy setup needed
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold text-emerald-700 leading-snug">
              Please open the setup link from your parent or teacher.
            </p>
          </div>
        ) : childError ? (
          <div className="mb-2 sm:mb-4 max-w-md">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-900 tracking-tight mb-3 sm:mb-4 drop-shadow-sm font-sans leading-tight">
              Oopsy!
            </h1>
            <p className="text-base sm:text-lg md:text-xl font-bold text-amber-800 leading-snug">
              We ran into a problem. Please contact support.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-emerald-900 tracking-tight mb-2 sm:mb-4 drop-shadow-sm font-sans leading-tight">
              Hello {childName},
            </h1>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-emerald-700 mb-4 sm:mb-8 max-w-lg">
              welcome to Tippy app.
            </p>

            <button
              onClick={onStartStory}
              className="group relative inline-flex items-center justify-center gap-3 sm:gap-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-lg sm:text-2xl px-6 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border-b-4 border-emerald-700"
            >
              <span>Continue</span>
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-white ml-0.5" />
              </div>
            </button>

            <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-3 sm:mt-6 font-medium">
              Press the button to begin your eco-adventure!
            </p>
          </>
        )}
      </div>
    </div>
  );
};
