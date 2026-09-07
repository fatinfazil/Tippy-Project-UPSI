import React from 'react';

import {
  QuizOption,
} from './scene08.config';


interface QuestionCardProps {

  option: QuizOption;

  isSelected: boolean;

  isDisabled: boolean;

  language: 'en' | 'ms';

  isScrollable?: boolean;

  onSelect: (
    option: QuizOption
  ) => void;

  onPlayAudio: (
    audioPath: string
  ) => void;

}


const QuestionCard: React.FC<
  QuestionCardProps
> = ({
  option,
  isSelected,
  isDisabled,
  language,
  onSelect,
  onPlayAudio,
}) => {


 // ============================================
// IMAGE AUDIO CLICK
// ============================================

const handleImageClick = (
  event: React.MouseEvent<HTMLDivElement>
) => {

  event.stopPropagation();

  if (
    !isDisabled &&
    option.audio
  ) {

    onPlayAudio(
      option.audio[language]
    );

  }

};


  // ============================================
  // BORDER
  // ============================================

  let borderStyle =
    'border-4 border-transparent hover:border-yellow-400';


  if (isSelected) {

    borderStyle =
      option.isCorrect

        ? 'border-4 border-green-500 bg-green-50'

        : 'border-4 border-red-500 bg-red-50';

  }


  // ============================================
  // CARD
  // ============================================

  return (

    <div

onClick={() => {

  if (
    !isDisabled &&
    option.audio
  ) {

    onPlayAudio(
      option.audio[language]
    );

  }

}}

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
      {/* CONTENT */}
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

  onClick={
    handleImageClick
  }

  className="
    w-full

            h-[180px]
min-h-[180px]
max-h-[180px]

            mb-3

            flex-shrink-0

            overflow-hidden

            rounded-xl

            bg-gray-50
          "
        >

          <img

            src={
              option.image
            }

            alt={
              option.text[language]
            }

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
{/* ANSWER BUTTON */}
{/* ==================================== */}

<button

  onClick={(event) => {

    event.stopPropagation();


    if (!isDisabled) {

      onSelect(option);

    }

  }}

  disabled={isDisabled}

  className="
    mt-2

    w-[80px]
    h-[80px]

    rounded-full

    bg-green-500

    text-white

    text-4xl

    font-black

    shadow-lg

    hover:scale-110

    transition-transform
  "

>

  {option.id}

</button>


        {/* ==================================== */}
        {/* TEXT */}
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

              text-[22px]

              font-bold

              leading-tight

              text-center

              text-gray-800

              break-words

              whitespace-normal
            "
          >

            {
              option.text[
                language
              ]
            }

          </span>

        </div>

      </div>

    </div>

  );

};


export default QuestionCard;
