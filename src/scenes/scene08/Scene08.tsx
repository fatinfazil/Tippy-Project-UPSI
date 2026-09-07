import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  QUIZ_QUESTIONS,
  QuizOption,
} from './scene08.config';

import QuestionCard from './QuestionCard';
import QuizHeader from './QuizHeader';
import ScoreBoard from './ScoreBoard';

import {
  saveQuizResult,
  type QuizAnswerPayload,
} from '../../config/quizApi';

import correctSound from './audio/quiz/correct.mp3';
import wrongSound from './audio/quiz/wrong.wav';

import {
  SCENE08_DESIGN_WIDTH,
  SCENE08_DESIGN_HEIGHT,
  getScene08StageSize,
} from './scene08Responsive.config';


// ============================================
// PROPS
// ============================================

interface Scene08Props {
  accessCode: string;
  onComplete?: () => void;
}


// ============================================
// COMPONENT
// ============================================

const Scene08: React.FC<Scene08Props> = ({
  accessCode,
  onComplete,
}) => {

  // ==========================================
  // QUIZ STATE
  // ==========================================

  const [currentIndex, setCurrentIndex] =
    useState(0);

  const [selectedOption, setSelectedOption] =
    useState<QuizOption | null>(null);

  const [score, setScore] =
    useState(0);

  const [streak, setStreak] =
    useState(0);

  const [language, setLanguage] =
    useState<'en' | 'ms'>('en');

  const [isFinished, setIsFinished] =
    useState(false);

  const [isSaving, setIsSaving] =
    useState(false);

  const [bestScore, setBestScore] =
    useState<number | undefined>(undefined);

  const bestScoreRef =
    useRef<number | undefined>(undefined);


  // ==========================================
  // ACTUAL SCENE08 CONTAINER
  // ==========================================
  //
  // Measure the actual space given to Scene08.
  // This keeps the 16:9 design proportional on
  // desktop, tablet and phone.
  //
  const sceneContainerRef =
    useRef<HTMLDivElement | null>(null);


  // ==========================================
  // 16:9 STAGE SIZE
  // ==========================================

  const [stageSize, setStageSize] =
    useState({
      width: 0,
      height: 0,
    });


  // ==========================================
  // AUDIO
  // ==========================================

  const audioRef =
    useRef<HTMLAudioElement | null>(null);


  // ==========================================
  // ANSWERS
  // ==========================================

  const answersRef =
    useRef<QuizAnswerPayload[]>([]);


  // ==========================================
  // SAVE PROTECTION
  // ==========================================

  const hasSavedResultRef =
    useRef(false);


  // ==========================================
  // CURRENT QUESTION
  // ==========================================

  const currentQuestion =
    QUIZ_QUESTIONS[currentIndex];


  // ==========================================
  // BACKGROUND
  // ==========================================

  const backgroundImage =
    '/bg/bg_scene2_gadern.png';


  // ==========================================
  // UPDATE STAGE ON RESIZE
  // ==========================================
  //
  // Measure the actual Scene08 container instead
  // of using the whole browser viewport.
  //
  useEffect(() => {

    const container =
      sceneContainerRef.current;

    if (!container) {
      return;
    }


    const updateStage =
      () => {

        const rect =
          container.getBoundingClientRect();


        if (
          rect.width <= 0 ||
          rect.height <= 0
        ) {
          return;
        }


        setStageSize(
          getScene08StageSize(
            rect.width,
            rect.height
          )
        );

      };


    updateStage();


    const resizeObserver =
      new ResizeObserver(
        updateStage
      );


    resizeObserver.observe(
      container
    );


    return () => {

      resizeObserver.disconnect();

    };

  }, []);


  // ==========================================
  // STOP AUDIO
  // ==========================================

  const stopAudio = () => {

    if (audioRef.current) {

      audioRef.current.pause();

      audioRef.current.currentTime = 0;

      audioRef.current = null;

    }

  };


  // ==========================================
  // PLAY AUDIO
  // ==========================================

  const playAudio = (
    audioPath: string
  ) => {

    if (!audioPath) {
      return;
    }


    stopAudio();


    const audio =
      new Audio(audioPath);


    audioRef.current =
      audio;


    audio.play().catch(
      (error) => {

        console.error(
          'Audio playback error:',
          error
        );

      }
    );


    audio.onended = () => {

      if (
        audioRef.current === audio
      ) {

        audioRef.current = null;

      }

    };

  };


  // ==========================================
  // PLAY QUESTION AUDIO
  // ==========================================

  useEffect(() => {

    if (
      isFinished ||
      !currentQuestion
    ) {

      return;

    }


    const timer =
      window.setTimeout(() => {

        playAudio(
          currentQuestion
            .questionAudio[
              language
            ]
        );

      }, 200);


    return () => {

      window.clearTimeout(timer);

    };

  }, [
    currentIndex,
    language,
    isFinished,
  ]);


  // ==========================================
  // CLEANUP AUDIO
  // ==========================================

  useEffect(() => {

    return () => {

      stopAudio();

    };

  }, []);


  // ==========================================
  // LANGUAGE CHANGE
  // ==========================================

  const handleLanguageChange = (
    newLanguage: 'en' | 'ms'
  ) => {

    stopAudio();

    setLanguage(
      newLanguage
    );

  };


  // ==========================================
  // SELECT ANSWER
  // ==========================================

  const handleSelectOption = (
    option: QuizOption
  ) => {

    if (
      selectedOption !== null
    ) {

      return;

    }


    setSelectedOption(
      option
    );


    stopAudio();


    // ========================================
    // RECORD ANSWER
    // ========================================

    const answer: QuizAnswerPayload = {

      questionId:
        currentQuestion.id,

      selectedOptionId:
        option.id,

      isCorrect:
        option.isCorrect,

    };


    answersRef.current = [
      ...answersRef.current,
      answer,
    ];


    // ========================================
    // FEEDBACK SOUND
    // ========================================

    const feedback =
      new Audio(
        option.isCorrect
          ? correctSound
          : wrongSound
      );


    feedback.play().catch(
      (error) => {

        console.error(
          'Feedback audio error:',
          error
        );

      }
    );


    // ========================================
    // SCORE
    // ========================================

    if (
      option.isCorrect
    ) {

      setScore(
        previous =>
          previous + 10
      );


      setStreak(
        previous =>
          previous + 1
      );

    } else {

      setStreak(0);

    }

  };


  // ==========================================
  // NEXT / FINISH
  // ==========================================

  const handleNextQuestion =
    async () => {

      if (
        !selectedOption ||
        isSaving
      ) {

        return;

      }


      stopAudio();


      // ========================================
      // NEXT QUESTION
      // ========================================

      if (
        currentIndex <
        QUIZ_QUESTIONS.length - 1
      ) {

        setCurrentIndex(
          previous =>
            previous + 1
        );


        setSelectedOption(
          null
        );


        return;

      }


      // ========================================
      // ALREADY SAVED
      // ========================================

      if (
        hasSavedResultRef.current
      ) {

        setIsFinished(true);

        return;

      }


      hasSavedResultRef.current =
        true;


      // ========================================
      // SAVE RESULT
      // ========================================

      setIsSaving(true);


      try {

        console.log(
          'Saving Scene08 result:',
          {
            accessCode,
            answers:
              answersRef.current,
          }
        );


        const result =
          await saveQuizResult(
            accessCode,
            answersRef.current
          );


        const latestBest =
          Math.max(
            score,
            result.best_score ?? 0,
            bestScoreRef.current ?? 0
          );


        setBestScore(
          latestBest
        );


        bestScoreRef.current =
          latestBest;


        console.log(
          'Scene08 result saved successfully.'
        );


      } catch (error) {

        console.error(
          'Failed to save quiz result:',
          error
        );

      } finally {

        setIsSaving(false);

        setIsFinished(true);

      }

    };


  // ==========================================
  // PLAY AGAIN
  // ==========================================

  const handlePlayAgain = () => {

    stopAudio();


    setCurrentIndex(0);

    setSelectedOption(null);

    setScore(0);

    setStreak(0);

    setIsSaving(false);

    setIsFinished(false);

    answersRef.current = [];

    hasSavedResultRef.current =
      false;

  };


  // ==========================================
  // ==========================================
  // SCOREBOARD
  // ==========================================
  // ==========================================

  if (isFinished) {

    return (

      <div
        ref={sceneContainerRef}

      className="
          w-full
          h-full
          flex
          items-center
          justify-center
          overflow-hidden
          bg-slate-950
        "
      >

        {/* ================================== */}
        {/* 16:9 SCOREBOARD STAGE */}
        {/* ================================== */}

        <div
          className="
            relative
            shrink-0
            overflow-hidden
            bg-black
          "
          style={{
            width:
              `${stageSize.width}px`,

            height:
              `${stageSize.height}px`,

            aspectRatio:
              '16 / 9',
          }}
        >

          {/* ================================= */}
          {/* FIXED DESIGN SPACE */}
          {/* ================================= */}

          <div
            className="
              absolute
              left-0
              top-0
              overflow-hidden
            "
            style={{
              width:
                `${SCENE08_DESIGN_WIDTH}px`,

              height:
                `${SCENE08_DESIGN_HEIGHT}px`,

              transform:
                `scale(${
                  stageSize.width /
                  SCENE08_DESIGN_WIDTH
                })`,

              transformOrigin:
                'top left',

              backgroundImage:
                `url("${backgroundImage}")`,

              backgroundSize:
                'cover',

              backgroundPosition:
                'center',

              backgroundRepeat:
                'no-repeat',
            }}
          >

            <ScoreBoard
              score={
                score
              }

              bestScore={
                bestScore
              }

              totalQuestions={
                QUIZ_QUESTIONS.length
              }

              language={
                language
              }

              onPlayAgain={
                handlePlayAgain
              }

              onFinish={() => {

                if (onComplete) {

                  onComplete();

                }

              }}
            />

          </div>

        </div>

      </div>

    );

  }


  // ==========================================
  // ==========================================
  // MAIN QUIZ
  // ==========================================
  // ==========================================

  return (

    <div
      ref={sceneContainerRef}

      className="
        w-full
        h-full
        flex
        items-center
        justify-center
        overflow-hidden
        bg-slate-950
      "
    >

      {/* ====================================== */}
      {/* 16:9 GAME STAGE */}
      {/* ====================================== */}

      <div
        className="
          relative
          shrink-0
          overflow-hidden
          bg-black
        "
        style={{
          width:
            `${stageSize.width}px`,

          height:
            `${stageSize.height}px`,

          aspectRatio:
            '16 / 9',
        }}
      >

        {/* ==================================== */}
        {/* FIXED 1600 × 900 DESIGN SPACE */}
        {/* ==================================== */}

        <div
          className="
            absolute
            left-0
            top-0
            flex
            flex-col
            overflow-hidden
            bg-cover
            bg-center
            bg-no-repeat
          "
          style={{
            width:
              `${SCENE08_DESIGN_WIDTH}px`,

            height:
              `${SCENE08_DESIGN_HEIGHT}px`,

            transform:
              `scale(${
                stageSize.width /
                SCENE08_DESIGN_WIDTH
              })`,

            transformOrigin:
              'top left',

            backgroundImage:
              `url("${backgroundImage}")`,
          }}
        >

          {/* ================================= */}
          {/* HEADER */}
          {/* ================================= */}

          <div
            className="
              w-full
              shrink-0
              flex
              justify-center
            "
          >

            <QuizHeader

              currentStep={
                currentIndex + 1
              }

              totalSteps={
                QUIZ_QUESTIONS.length
              }

              score={
                score
              }

              streak={
                streak
              }

              language={
                language
              }

              onLanguageChange={
                handleLanguageChange
              }

            />

          </div>


          {/* ================================= */}
          {/* MAIN */}
          {/* ================================= */}

          <main
            className="
              relative
              flex
              flex-1
              flex-col
              items-center
              w-full
              min-h-0
              pt-2
              overflow-visible
              px-5
            "
          >

            {/* =============================== */}
            {/* QUESTION PANEL */}
            {/* =============================== */}

            <div
              className="
                absolute
                left-1/2
                bottom-5
                -translate-x-1/2
                flex
                flex-col
                w-[calc(100%_-_40px)]
                max-w-[1100px]
                h-[740px]
                max-h-[calc(100%_-_5px)]
                min-h-0
                rounded-3xl
                border-4
                border-green-600
                bg-yellow-50/90
                shadow-2xl
                overflow-hidden
              "
            >

              {/* ============================= */}
              {/* SCROLL AREA */}
              {/* ============================= */}

              <div
                className="
                  flex-1
                  w-full
                  min-h-0

                  ${
                    currentQuestion.id === 5
                      ? 'overflow-y-auto'
                      : 'overflow-hidden'
                  }

                  overflow-x-hidden
                  px-6
                  py-5
                  pr-4
                  pb-8
                  scroll-smooth
                  overscroll-contain
                "
              >

                {/* =========================== */}
                {/* QUESTION NUMBER */}
                {/* =========================== */}

                <div
                  className="
                    flex
                    justify-center
                    w-full
                    mb-5
                  "
                >

                  <div
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      px-7
                      py-2.5
                      rounded-full
                      bg-green-600
                      text-white
                      text-xl
                      font-extrabold
                      shadow-md
                    "
                  >

                    <span>
                      🌱
                    </span>

                    <span>

                      {
                        language === 'ms'
                          ? `Soalan ${currentQuestion.id}`
                          : `Question ${currentQuestion.id}`
                      }

                    </span>

                  </div>

                </div>


                {/* =========================== */}
                {/* QUESTION */}
                {/* =========================== */}

                <div
                  className="
                    flex
                    items-center
                    justify-center
                    gap-3
                    w-full
                    mb-6
                    px-2
                  "
                >

                  <h2
                    className="
                      w-full
                      max-w-[950px]
                      text-3xl
                      md:text-4xl
                      font-extrabold
                      leading-tight
                      text-center
                      break-words
                      text-green-950
                    "
                  >

                    {
                      currentQuestion
                        .questionText[
                          language
                        ]
                    }

                  </h2>


                  {/* QUESTION AUDIO */}

                  <button
                    type="button"

                    onClick={() =>
                      playAudio(
                        currentQuestion
                          .questionAudio[
                            language
                          ]
                      )
                    }

                    className="
                      shrink-0
                      flex
                      items-center
                      justify-center
                      text-3xl
                      hover:scale-110
                      active:scale-95
                      transition-transform
                    "

                    aria-label={
                      language === 'ms'
                        ? 'Dengar soalan'
                        : 'Listen to question'
                    }
                  >

                    🔊

                  </button>

                </div>


                {/* =========================== */}
                {/* OPTIONS */}
                {/* =========================== */}

                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    gap-6
                    w-full
                    mb-6
                    items-stretch
                  "
                >

                  {
                    currentQuestion.options.map(
                      (option) => (

                        <QuestionCard

                          key={
                            option.id
                          }

                          option={
                            option
                          }

                          isSelected={
                            selectedOption?.id ===
                            option.id
                          }

                          isDisabled={
                            selectedOption !== null
                          }

                          language={
                            language
                          }

                          isScrollable={
                            false
                          }

                          onSelect={
                            handleSelectOption
                          }

                          onPlayAudio={
                            playAudio
                          }

                        />

                      )
                    )
                  }

                </div>


                {/* =========================== */}
                {/* TIP */}
                {/* =========================== */}

                <div
                  className="
                    flex
                    items-center
                    gap-3
                    w-full
                    min-h-[76px]
                    p-4
                    rounded-3xl
                    border
                    border-amber-300
                    bg-amber-100
                  "
                >

                  <span
                    className="
                      flex-shrink-0
                      text-3xl
                    "
                  >
                    💡
                  </span>


                  <p
                    className="
                      text-[22px]
                      font-medium
                      leading-snug
                      text-amber-900
                      break-words
                    "
                  >

                    {
                      currentQuestion
                        .hintText[
                          language
                        ]
                    }

                  </p>

                </div>

              </div>

            </div>


            {/* =============================== */}
            {/* NEXT */}
            {/* =============================== */}

            <button
              type="button"

              disabled={
                !selectedOption ||
                isSaving
              }

              onClick={() => {
                void handleNextQuestion();
              }}

              className={`
                absolute
                right-5
                bottom-5
                z-[100]
                flex
                items-center
                justify-center
                gap-2
                w-[180px]
                h-[68px]
                px-4
                rounded-full
                border-2
                border-white/70
                shadow-xl
                text-white
                text-[20px]
                font-extrabold
                whitespace-nowrap
                leading-none
                transition-all

                ${
                  selectedOption &&
                  !isSaving

                    ? `
                      bg-gradient-to-r
                      from-[#00b77f]
                      to-[#0797b5]
                      hover:scale-105
                      hover:shadow-2xl
                      cursor-pointer
                    `

                    : `
                      bg-gradient-to-r
                      from-gray-400
                      to-gray-500
                      opacity-60
                      cursor-not-allowed
                    `
                }
              `}
            >

              <span
                className="
                  flex
                  items-center
                  justify-center
                  whitespace-nowrap
                  leading-none
                  text-center
                "
              >

                {
                  isSaving

                    ? language === 'ms'
                      ? 'Menyimpan...'
                      : 'Saving...'

                    : currentIndex ===
                        QUIZ_QUESTIONS.length - 1

                      ? language === 'ms'
                        ? 'Tamat'
                        : 'Finish'

                      : language === 'ms'
                        ? 'Seterusnya'
                        : 'Next'
                }

              </span>


              <span
                className="
                  flex
                  items-center
                  justify-center
                  w-9
                  h-9
                  min-w-[36px]
                  rounded-full
                  bg-white/15
                  text-[22px]
                  leading-none
                  font-light
                  shrink-0
                "
              >

                →

              </span>

            </button>

          </main>

        </div>

      </div>

    </div>

  );

};


export default Scene08;