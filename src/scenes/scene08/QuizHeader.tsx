import React from 'react';

interface QuizHeaderProps {
  currentStep: number;
  totalSteps: number;
  score: number;
  streak: number;
  language: 'en' | 'ms';
  onLanguageChange: (language: 'en' | 'ms') => void;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentStep,
  totalSteps,
  score,
  streak,
  language,
  onLanguageChange,
}) => {
  return (
    <div
      className="
        w-full
        max-w-7xl
        flex
        items-center
        justify-between
        gap-6
        mb-6
        px-4
      "
    >

      {/* STREAK */}
      <div
        className="
          flex
          items-center
          gap-3
          min-w-[180px]
          px-6
          py-4
          rounded-full
          bg-green-700
          text-white
          text-xl
          font-extrabold
          shadow-md
          whitespace-nowrap
        "
      >
        <span className="text-2xl">
          ⭐
        </span>

        <span>
          {streak} Streak!
        </span>
      </div>


      {/* QUESTION PROGRESS */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-3
          px-7
          py-4
          rounded-full
          bg-green-800/20
        "
      >

        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;

          const isActive = stepNumber === currentStep;
          const isPassed = stepNumber < currentStep;

          return (
            <React.Fragment key={stepNumber}>

              <div
                className={`
                  flex
                  items-center
                  justify-center
                  w-12
                  h-12
                  rounded-full
                  text-xl
                  font-extrabold
                  transition-all
                  duration-200

                  ${
                    isActive
                      ? 'bg-yellow-400 text-black scale-110 ring-2 ring-yellow-200'
                      : isPassed
                        ? 'bg-green-600 text-white'
                        : 'bg-white/70 text-gray-600'
                  }
                `}
              >
                {stepNumber}
              </div>


              {index < totalSteps - 1 && (
                <div
                  className={`
                    w-6
                    h-1
                    rounded-full

                    ${
                      stepNumber < currentStep
                        ? 'bg-green-600'
                        : 'bg-white/60'
                    }
                  `}
                />
              )}

            </React.Fragment>
          );
        })}

      </div>


      {/* SCORE */}
      <div
        className="
          flex
          items-center
          justify-center
          gap-3
          min-w-[180px]
          px-6
          py-4
          rounded-full
          bg-green-900
          text-white
          text-xl
          font-extrabold
          shadow-md
          whitespace-nowrap
        "
      >

        <span className="text-2xl">
          🌱
        </span>

        <span>
          Score: {score}
        </span>

      </div>


      {/* LANGUAGE TOGGLE SWITCH */}
      <div
        className="
          relative
          flex
          items-center
          w-[190px]
          h-[64px]
          rounded-full
          bg-green-900
          p-1
          shadow-md
          cursor-pointer
          overflow-hidden
        "
        onClick={() =>
          onLanguageChange(
            language === 'en' ? 'ms' : 'en'
          )
        }
      >

        {/* Yellow moving slider */}
        <div
          className={`
            absolute
            top-1
            left-1
            w-[92px]
            h-[56px]
            rounded-full
            bg-yellow-400
            shadow-lg
            transition-transform
            duration-300
            ease-in-out

            ${
              language === 'ms'
                ? 'translate-x-[94px]'
                : 'translate-x-0'
            }
          `}
        />


        {/* ENG */}
        <div
          className={`
            relative
            z-10
            flex-1
            text-center
            text-xl
            font-extrabold
            transition-colors
            duration-300

            ${
              language === 'en'
                ? 'text-black'
                : 'text-white'
            }
          `}
        >
          ENG
        </div>


        {/* BM */}
        <div
          className={`
            relative
            z-10
            flex-1
            text-center
            text-xl
            font-extrabold
            transition-colors
            duration-300

            ${
              language === 'ms'
                ? 'text-black'
                : 'text-white'
            }
          `}
        >
          BM
        </div>

      </div>

    </div>
  );
};

export default QuizHeader;