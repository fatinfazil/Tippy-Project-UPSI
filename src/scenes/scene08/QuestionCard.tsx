import React from 'react';
import { QuizOption } from './scene08.config';

interface QuestionCardProps {
  option: QuizOption;
  isSelected: boolean;
  isDisabled: boolean;
  language: 'en' | 'ms';
  isScrollable?: boolean;
  onSelect: (option: QuizOption) => void;
  onPlayAudio: (audioPath: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  option,
  isSelected,
  isDisabled,
  language,
  onSelect,
  onPlayAudio,
}) => {

  // ============================================
  // SPEAKER CLICK
  // ============================================

  const handleSpeakerClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (!isDisabled && option.audio) {
      onPlayAudio(option.audio[language]);
    }
  };


  // ============================================
  // CARD CLICK
  // ============================================

  const handleCardClick = () => {
    if (!isDisabled) {
      onSelect(option);
    }
  };


  // ============================================
  // BORDER STYLE
  // ============================================

  let borderStyle =
    'border-4 border-transparent hover:border-yellow-400';

  if (isSelected) {
    borderStyle = option.isCorrect
      ? 'border-4 border-green-500 bg-green-50'
      : 'border-4 border-red-500 bg-red-50';
  }


  // ============================================
  // CARD
  // ============================================

  return (
    <div
      onClick={handleCardClick}
      className={`
        relative

        flex
        flex-col
        items-center

        w-full

        h-[400px]
        min-h-[400px]
        max-h-[400px]

        box-border

        p-4

        bg-white

        rounded-2xl

        shadow-lg

        transition-all
        duration-200

        overflow-visible

        ${borderStyle}

        ${
          isDisabled
            ? 'cursor-not-allowed'
            : 'cursor-pointer'
        }
      `}
    >

      {/* ====================================== */}
      {/* OPTION LETTER */}
      {/* ====================================== */}

      <div
        className="
          absolute

          top-2
          left-2

          z-50

          flex
          items-center
          justify-center

          w-[68px]
          h-[68px]

          rounded-full

          border-4
          border-white

          bg-green-500

          text-white
          text-3xl
          font-black

          shadow-lg

          pointer-events-none
        "
        aria-hidden="true"
      >
        {option.id}
      </div>


      {/* ====================================== */}
      {/* AUDIO BUTTON */}
      {/* ====================================== */}

      <button
        type="button"
        onClick={handleSpeakerClick}
        disabled={isDisabled}
        className="
          absolute

          top-3
          right-3

          z-50

          flex
          items-center
          justify-center

          w-11
          h-11

          rounded-full

          bg-yellow-400

          shadow

          transition-transform

          hover:bg-yellow-500
          hover:scale-110

          active:scale-95

          disabled:opacity-50
          disabled:cursor-not-allowed
        "
        title={
          language === 'ms'
            ? 'Dengar jawapan'
            : 'Listen to option'
        }
        aria-label={
          language === 'ms'
            ? `Dengar ${option.text[language]}`
            : `Listen to ${option.text[language]}`
        }
      >
        🔊
      </button>


      {/* ====================================== */}
      {/* CARD CONTENT */}
      {/* ====================================== */}

      <div
        className="
          flex
          flex-col
          items-center

          w-full
          h-full

          min-h-0

          overflow-visible
        "
      >


        {/* ==================================== */}
        {/* IMAGE */}
        {/* ==================================== */}

        <div
          className="
            w-full

            h-[210px]
            min-h-[210px]
            max-h-[210px]

            mb-3

            flex-shrink-0

            overflow-hidden

            rounded-xl

            bg-gray-50
          "
        >
          <img
            src={option.image}
            alt={option.text[language]}
            className="
              block

              w-full
              h-full

              object-contain
              object-center
            "
          />
        </div>


        {/* ==================================== */}
        {/* OPTION TEXT */}
        {/* ==================================== */}

        <div
          className="
            flex-1

            flex
            items-center
            justify-center

            w-full

            min-h-0

            px-2
            pb-2

            text-center

            overflow-visible
          "
        >

          <span
            className="
              block

              w-full

              px-2

              text-[28px]

              font-bold

              leading-tight

              text-center

              text-gray-800

              break-words

              whitespace-normal
            "
          >
            {option.text[language]}
          </span>

        </div>


      </div>

    </div>
  );
};

export default QuestionCard;