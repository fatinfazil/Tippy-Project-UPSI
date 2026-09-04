import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import tippyGif from './tippy-talking.gif';

import victorySound from './audio/quiz/victory.mp3';
import starSound from './audio/quiz/star.mp3';

// ============================================
// TIPPY VOICE AUDIO
// ============================================

// 1 STAR
import tippy1En from './audio/quiz/tippy_1_en.mp3';
import tippy1Ms from './audio/quiz/tippy_1_ms.mp3';

// 2 STARS
import tippy2En from './audio/quiz/tippy_2_en.mp3';
import tippy2Ms from './audio/quiz/tippy_2_ms.mp3';

// 3 STARS
import tippy3En from './audio/quiz/tippy_3_en.mp3';
import tippy3Ms from './audio/quiz/tippy_3_ms.mp3';

// 4 STARS
import tippy4En from './audio/quiz/tippy_4_en.mp3';
import tippy4Ms from './audio/quiz/tippy_4_ms.mp3';

// 5 STARS
import tippy5En from './audio/quiz/tippy_5_en.mp3';
import tippy5Ms from './audio/quiz/tippy_5_ms.mp3';


// ============================================
// PROPS
// ============================================

interface ScoreBoardProps {
  score: number;
  bestScore?: number;
  totalQuestions: number;
  language: 'en' | 'ms';
  onPlayAgain: () => void;
  onFinish: () => void;
}


// ============================================
// SCORE BOARD
// ============================================

export const ScoreBoard: React.FC<
  ScoreBoardProps
> = ({
  score,
  bestScore,
  totalQuestions,
  language,
  onPlayAgain,
  onFinish,
}) => {

  // ============================================
  // AUDIO REFS
  // ============================================

  const victoryAudioRef =
    useRef<HTMLAudioElement | null>(null);

  const tippyAudioRef =
    useRef<HTMLAudioElement | null>(null);


  // ============================================
  // PLAY STAR SOUND
  // ============================================

  const playStarSound = () => {
    const audio =
      new Audio(starSound);

    audio.volume = 0.7;

    audio.play().catch((error) => {
      console.error(
        'Star sound could not play:',
        error
      );
    });
  };


  // ============================================
  // CALCULATE STARS
  // ============================================

  const maxScore =
    totalQuestions * 10;

  const percentage =
    maxScore > 0
      ? Math.round(
          (score / maxScore) * 100
        )
      : 0;

  let earnedStars = 1;

  if (percentage >= 90) {
    earnedStars = 5;
  } else if (percentage >= 70) {
    earnedStars = 4;
  } else if (percentage >= 50) {
    earnedStars = 3;
  } else if (percentage >= 30) {
    earnedStars = 2;
  }


  // ============================================
  // TIPPY MESSAGE
  // ============================================

  const getTippyMessage = () => {

    if (language === 'ms') {

      if (earnedStars === 5) {
        return 'Anda ialah Wira Bumi yang hebat!';
      }

      if (earnedStars === 4) {
        return 'Hebat! Anda sangat mengambil berat tentang Bumi!';
      }

      if (earnedStars === 3) {
        return 'Syabas! Teruskan membantu planet kita!';
      }

      if (earnedStars === 2) {
        return 'Cuba lagi! Mari belajar bersama Tippy!';
      }

      return 'Jangan berputus asa! Cuba lagi bersama Tippy!';
    }


    if (earnedStars === 5) {
      return 'You are a Super Earth Hero!';
    }

    if (earnedStars === 4) {
      return 'Amazing! You really care about our Earth!';
    }

    if (earnedStars === 3) {
      return 'Great job! Keep helping our planet!';
    }

    if (earnedStars === 2) {
      return 'Good try! Let’s learn more with Tippy!';
    }

    return 'Don’t give up! Try again with Tippy!';
  };


  const tippyMessage =
    getTippyMessage();


  const displayTippyMessage =
    typeof tippyMessage === 'string'
      ? tippyMessage
      : tippyMessage[language];

  // Prevent TypeScript undefined error
  // First-time players will have no best score
  const safeBestScore =
    bestScore ?? 0;


  // ============================================
  // TIPPY AUDIO
  // ============================================

  const getTippyAudio = () => {

    // ==========================================
    // 5 STARS
    // ==========================================

    if (earnedStars === 5) {
      return language === 'ms'
        ? tippy5Ms
        : tippy5En;
    }


    // ==========================================
    // 4 STARS
    // ==========================================

    if (earnedStars === 4) {
      return language === 'ms'
        ? tippy4Ms
        : tippy4En;
    }


    // ==========================================
    // 3 STARS
    // ==========================================

    if (earnedStars === 3) {
      return language === 'ms'
        ? tippy3Ms
        : tippy3En;
    }


    // ==========================================
    // 2 STARS
    // ==========================================

    if (earnedStars === 2) {
      return language === 'ms'
        ? tippy2Ms
        : tippy2En;
    }


    // ==========================================
    // 1 STAR
    // ==========================================

    return language === 'ms'
      ? tippy1Ms
      : tippy1En;
  };


  // ============================================
  // ANIMATION STATE
  // ============================================

  const [visibleStars, setVisibleStars] =
    useState(0);

  const [showBubble, setShowBubble] =
    useState(false);

  const [showTippy, setShowTippy] =
    useState(false);

  const [showButtons, setShowButtons] =
    useState(false);




  // ============================================
  // PLAY TIPPY VOICE
  // ============================================

  const playTippyAudio = () => {

    // Stop previous Tippy audio
    if (tippyAudioRef.current) {

      tippyAudioRef.current.pause();

      tippyAudioRef.current.currentTime = 0;

      tippyAudioRef.current = null;
    }


    const audio =
      new Audio(
        getTippyAudio()
      );

    tippyAudioRef.current =
      audio;

    audio.currentTime = 0;

    audio.volume = 0.9;

    audio.play().catch((error) => {

      console.error(
        'Tippy voice could not play:',
        error
      );

    });


    audio.onended = () => {

      if (
        tippyAudioRef.current ===
        audio
      ) {

        tippyAudioRef.current =
          null;

      }
    };
  };




  // ============================================
  // PLAY VICTORY SOUND
  // ============================================

  useEffect(() => {

    const victoryAudio =
      new Audio(victorySound);

    victoryAudioRef.current =
      victoryAudio;

    victoryAudio.currentTime = 0;

    victoryAudio.volume = 0.8;

    victoryAudio.play().catch((error) => {

      console.error(
        'Victory sound could not play:',
        error
      );

    });


    return () => {

      victoryAudio.pause();

      victoryAudio.currentTime = 0;


      if (
        victoryAudioRef.current ===
        victoryAudio
      ) {

        victoryAudioRef.current =
          null;

      }

    };

  }, []);


  // ============================================
  // SCOREBOARD ANIMATIONS
  // ============================================

  useEffect(() => {

    // Reset animation
    setVisibleStars(0);

    setShowBubble(false);

    setShowTippy(false);

    setShowButtons(false);


    const timers: number[] = [];


    // ==========================================
    // STARS APPEAR ONE BY ONE
    // ==========================================

    for (
      let index = 1;
      index <= earnedStars;
      index++
    ) {

      const timer =
        window.setTimeout(
          () => {

            setVisibleStars(index);

            playStarSound();

          },
          150 + index * 160
        );

      timers.push(timer);
    }


    // ==========================================
    // SPEECH BUBBLE
    // ==========================================

    const bubbleTimer =
      window.setTimeout(
        () => {

          setShowBubble(true);

        },
        150 +
          earnedStars * 160 +
          500
      );


    // ==========================================
    // TIPPY APPEARS
    // ==========================================

    const tippyTimer =
      window.setTimeout(
        () => {

          setShowTippy(true);

        },
        150 +
          earnedStars * 160 +
          650
      );


    // ==========================================
    // TIPPY SPEAKS
    // ==========================================

    const tippyAudioTimer =
      window.setTimeout(
        () => {

          playTippyAudio();

        },
        150 +
          earnedStars * 160 +
          850
      );


    // ==========================================
    // BUTTONS
    // ==========================================

    const buttonTimer =
      window.setTimeout(
        () => {

          setShowButtons(true);

        },
        150 +
          earnedStars * 160 +
          1200
      );


    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {

      timers.forEach((timer) => {

        window.clearTimeout(
          timer
        );

      });


      window.clearTimeout(
        bubbleTimer
      );


      window.clearTimeout(
        tippyTimer
      );


      window.clearTimeout(
        tippyAudioTimer
      );


      window.clearTimeout(
        buttonTimer
      );


      // Stop Tippy voice
      if (tippyAudioRef.current) {

        tippyAudioRef.current.pause();

        tippyAudioRef.current.currentTime = 0;

        tippyAudioRef.current = null;

      }

    };

  }, [earnedStars, language]);


  // ============================================
  // CURVED STAR POSITIONS
  // ============================================

  const starPositions = [
    {
      left: '12%',
      top: '28px',
      rotate: '-12deg',
      size: 'text-5xl sm:text-6xl',
    },

    {
      left: '28%',
      top: '0px',
      rotate: '-7deg',
      size: 'text-6xl sm:text-7xl',
    },

    {
      left: '50%',
      top: '-8px',
      rotate: '0deg',
      size: 'text-6xl sm:text-7xl',
    },

    {
      left: '72%',
      top: '0px',
      rotate: '7deg',
      size: 'text-6xl sm:text-7xl',
    },

    {
      left: '88%',
      top: '28px',
      rotate: '12deg',
      size: 'text-5xl sm:text-6xl',
    },
  ];


  // ============================================
  // SCOREBOARD
  // ============================================

  return (
    <div
      className="
        flex
        items-center
        justify-center
        w-full
        h-full
        min-h-0
        px-4
        py-3
        overflow-visible
      "
    >

      {/* ====================================== */}
      {/* SCOREBOARD WRAPPER */}
      {/* ====================================== */}

      <div
        className="
          relative
          w-full
          max-w-[680px]
          pt-[45px]
          scale-[0.84]
          origin-center
        "
      >

        {/* ==================================== */}
        {/* CURVED STARS */}
        {/* ==================================== */}

        <div
          className="
            absolute
            top-[-10px]
            left-1/2
            z-40
            w-[500px]
            sm:w-[620px]
            h-[120px]
            -translate-x-1/2
            pointer-events-none
          "
        >

          {starPositions.map(
            (position, index) => {

              const isVisible =
                index < visibleStars;


              return (
                <span
                  key={index}
                  className={`
                    absolute
                    ${position.size}
                    leading-none
                    transition-all
                    duration-500
                    ease-out
                    ${
                      isVisible
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-50'
                    }
                  `}
                  style={{
                    left:
                      position.left,

                    top:
                      position.top,

                    transform: `
                      translateX(-50%)
                      rotate(${position.rotate})
                    `,
                  }}
                >
                  ⭐
                </span>
              );

            }
          )}

        </div>


        {/* ==================================== */}
        {/* MAIN SCOREBOARD CARD */}
        {/* ==================================== */}

        <div
          className="
            relative
            w-full
            px-6
            sm:px-7
            pt-5
            pb-3
            overflow-visible
            rounded-[38px]
            border-[5px]
            border-green-600
            bg-gradient-to-b
            from-[#fffef5]
            to-[#efffea]
            text-center
            shadow-[0_14px_35px_rgba(0,0,0,0.22)]
          "
        >

          {/* ================================= */}
          {/* TITLE */}
          {/* ================================= */}

          <div
            className="
              inline-flex
              items-center
              justify-center
              px-8
              py-2.5
              mb-6
              rounded-full
              bg-green-600
              text-white
              text-base
              sm:text-lg
              font-black
              shadow-[0_4px_0_#08783b]
            "
          >
            🌿 TIPPY'S QUIZ 🌿
          </div>


          {/* ================================= */}
          {/* TOTAL SCORE */}
          {/* ================================= */}

          <div
            className="
              flex
              flex-col
              items-center
              justify-center
              mb-16
            "
          >

            <div
              className="
                text-green-700
                text-3xl
                sm:text-4xl
                font-black
                tracking-wide
                mb-3
              "
            >
              TOTAL SCORE
            </div>


            <div
              className="
                text-6xl
                sm:text-7xl
                font-black
                text-green-700
                drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]
              "
            >
              {earnedStars} / 5
            </div>

            {
              safeBestScore > 0 &&
              (
                <div
                  className="
                    mt-12
                    mx-auto
                    w-[280px]
                    px-10
                    py-4
                    rounded-3xl
                    bg-yellow-100
                    border-4
                    border-yellow-400
                    shadow-md
                  "
                >

                  <div
                    className="
                      text-2xl
                      font-black
                      text-yellow-700
                    "
                  >
                    🏆 {language === 'ms'
                      ? 'SKOR TERBAIK'
                      : 'BEST SCORE'}
                  </div>

                  <div
                    className="
                      text-4xl
                      font-black
                      text-green-700
                    "
                  >
                    {Math.floor(safeBestScore / 10)} / {totalQuestions}
                  </div>

                </div>
              )
            }

          </div>


          {/* ================================= */}
          {/* TIPPY SPEECH BUBBLE */}
          {/* ================================= */}

          <div
            className={`
              relative
              z-20
              mt-8
              transition-all
              duration-700
              ${
                showBubble
                  ? `
                    opacity-100
                    translate-y-0
                    scale-100
                  `
                  : `
                    opacity-0
                    translate-y-4
                    scale-90
                  `
              }
            `}
          >

            <div
              className="
                relative
                w-full
                max-w-[520px]
                mx-auto
                px-5
                sm:px-6
                pt-3
                pb-4
                rounded-[28px]
                border-[4px]
                border-gray-800
                bg-white
                shadow-[0_6px_14px_rgba(0,0,0,0.14)]
              "
            >

              {/* TIPPY LABEL */}

              <div
                className="
                  mb-1
                  text-xs
                  sm:text-sm
                  font-black
                  tracking-[3px]
                  text-green-700
                "
              >
                TIPPY
              </div>


              {/* MESSAGE */}

              <p
                className="
                  text-lg
                  sm:text-xl
                  md:text-2xl
                  font-bold
                  leading-tight
                  text-gray-900
                "
              >
                "{displayTippyMessage}"
              </p>


              {/* SPEECH BUBBLE OUTER TAIL */}

              <div
                className="
                  absolute
                  -bottom-[22px]
                  left-1/2
                  w-0
                  h-0
                  -translate-x-1/2
                  border-l-[22px]
                  border-r-[22px]
                  border-t-[24px]
                  border-l-transparent
                  border-r-transparent
                  border-t-gray-800
                "
              />


              {/* SPEECH BUBBLE INNER TAIL */}

              <div
                className="
                  absolute
                  -bottom-[17px]
                  left-1/2
                  w-0
                  h-0
                  -translate-x-1/2
                  border-l-[18px]
                  border-r-[18px]
                  border-t-[19px]
                  border-l-transparent
                  border-r-transparent
                  border-t-white
                "
              />

            </div>

          </div>


          {/* ================================= */}
          {/* TIPPY GIF */}
          {/* ================================= */}

          <div
            className={`
              relative
              z-10
              flex
              items-center
              justify-center
              mt-[-8px]
              mb-0
              transition-all
              duration-700
              ${
                showTippy
                  ? `
                    opacity-100
                    translate-y-0
                    scale-100
                  `
                  : `
                    opacity-0
                    translate-y-5
                    scale-90
                  `
              }
            `}
          >

            <img
              src={tippyGif}
              alt="Tippy"
              className="
                w-[220px]
                h-[220px]
                sm:w-[240px]
                sm:h-[240px]
                md:w-[260px]
                md:h-[260px]
                object-contain
                drop-shadow-[0_8px_8px_rgba(0,0,0,0.18)]
              "
            />

          </div>


          {/* ================================= */}
          {/* BUTTONS */}
          {/* ================================= */}

          <div
            className={`
              relative
              z-20
              flex
              gap-3
              sm:gap-4
              mt-1
              transition-all
              duration-500
              ${
                showButtons
                  ? `
                    opacity-100
                    translate-y-0
                  `
                  : `
                    opacity-0
                    translate-y-4
                  `
              }
            `}
          >

            {/* ================================= */}
            {/* PLAY AGAIN */}
            {/* ================================= */}

            <button
              type="button"
              onClick={onPlayAgain}
              className="
                flex
                flex-1
                items-center
                justify-center
                h-[68px]
                rounded-[50px]
                border-2
                border-white/70
                bg-gradient-to-r
                from-[#00b77f]
                via-[#00a99d]
                to-[#0797b5]
                text-white
                shadow-[0_4px_10px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.2)]
                transition-all
                hover:-translate-y-0.5
                hover:shadow-[0_7px_15px_rgba(0,0,0,0.16),inset_0_1px_2px_rgba(255,255,255,0.25)]
                active:scale-95
              "
              title="Play Again"
              aria-label="Play Again"
            >

              <span
                className="
                  flex
                  items-center
                  justify-center
                  w-16
                  h-16
                  rounded-full
                  bg-white/20
                  text-[50px]
                  font-bold
                  leading-none
                "
                aria-hidden="true"
              >
                ↻
              </span>

            </button>


            {/* ================================= */}
            {/* HOME */}
            {/* ================================= */}

            <button
              type="button"
              onClick={onFinish}
              className="
                flex
                flex-1
                items-center
                justify-center
                h-[68px]
                rounded-[50px]
                border-2
                border-white/70
                bg-gradient-to-r
                from-[#00b77f]
                via-[#00a99d]
                to-[#0797b5]
                text-white
                shadow-[0_4px_10px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.2)]
                transition-all
                hover:-translate-y-0.5
                hover:shadow-[0_7px_15px_rgba(0,0,0,0.16),inset_0_1px_2px_rgba(255,255,255,0.25)]
                active:scale-95
              "
              title="Return to Home"
              aria-label="Return to Home"
            >

              <span
                className="
                  flex
                  items-center
                  justify-center
                  w-14
                  h-14
                  rounded-full
                  bg-white/20
                  text-white
                "
                aria-hidden="true"
              >

                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-12 h-12"
                >
                  <path d="M12 2.5 1.8 10.9a1 1 0 0 0 .6 1.8h1.5v7.1c0 .9.7 1.7 1.7 1.7h4.2v-6.3h4.4v6.3h4.2c.9 0 1.7-.7 1.7-1.7v-7.1h1.5a1 1 0 0 0 .6-1.8L12 2.5Z" />
                </svg>

              </span>

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};

export default ScoreBoard;