// ============================================
// QUIZ IMAGES
// ============================================

// Question 1
import q1A from './images/quiz/q1_A.png';
import q1B from './images/quiz/q1_B.png';
import q1C from './images/quiz/q1_C.png';

// Question 2
import q2A from './images/quiz/q2_A.png';
import q2B from './images/quiz/q2_B.png';
import q2C from './images/quiz/q2_C.png';

// Question 3
import q3A from './images/quiz/q3_A.png';
import q3B from './images/quiz/q3_B.png';
import q3C from './images/quiz/q3_C.png';

// Question 4
import q4A from './images/quiz/q4_A.png';
import q4B from './images/quiz/q4_B.png';
import q4C from './images/quiz/q4_C.png';

// Question 5
import q5A from './images/quiz/q5_A.png';
import q5B from './images/quiz/q5_B.png';
import q5C from './images/quiz/q5_C.png';


// ============================================
// QUIZ AUDIO
// ============================================

// ============================================
// QUESTION AUDIO - ENGLISH
// ============================================

import q1QuestionAudioEn from './audio/quiz/q1_question_en.mp3';
import q2QuestionAudioEn from './audio/quiz/q2_question_en.mp3';
import q3QuestionAudioEn from './audio/quiz/q3_question_en.mp3';
import q4QuestionAudioEn from './audio/quiz/q4_question_en.mp3';
import q5QuestionAudioEn from './audio/quiz/q5_question_en.mp3';


// ============================================
// QUESTION AUDIO - MALAY
// ============================================

import q1QuestionAudioMs from './audio/quiz/q1_question_ms.mp3';
import q2QuestionAudioMs from './audio/quiz/q2_question_ms.mp3';
import q3QuestionAudioMs from './audio/quiz/q3_question_ms.mp3';
import q4QuestionAudioMs from './audio/quiz/q4_question_ms.mp3';
import q5QuestionAudioMs from './audio/quiz/q5_question_ms.mp3';


// ============================================
// Q1 OPTION AUDIO
// ============================================

// English
import q1AAudioEn from './audio/quiz/q1_A_en.mp3';
import q1BAudioEn from './audio/quiz/q1_B_en.mp3';
import q1CAudioEn from './audio/quiz/q1_C_en.mp3';

// Malay
import q1AAudioMs from './audio/quiz/q1_A_ms.mp3';
import q1BAudioMs from './audio/quiz/q1_B_ms.mp3';
import q1CAudioMs from './audio/quiz/q1_C_ms.mp3';


// ============================================
// Q2 OPTION AUDIO
// ============================================

// English
import q2AAudioEn from './audio/quiz/q2_A_en.mp3';
import q2BAudioEn from './audio/quiz/q2_B_en.mp3';
import q2CAudioEn from './audio/quiz/q2_C_en.mp3';

// Malay
import q2AAudioMs from './audio/quiz/q2_A_ms.mp3';
import q2BAudioMs from './audio/quiz/q2_B_ms.mp3';
import q2CAudioMs from './audio/quiz/q2_C_ms.mp3';


// ============================================
// Q3 OPTION AUDIO
// ============================================

// English
import q3AAudioEn from './audio/quiz/q3_A_en.mp3';
import q3BAudioEn from './audio/quiz/q3_B_en.mp3';
import q3CAudioEn from './audio/quiz/q3_C_en.mp3';

// Malay
import q3AAudioMs from './audio/quiz/q3_A_ms.mp3';
import q3BAudioMs from './audio/quiz/q3_B_ms.mp3';
import q3CAudioMs from './audio/quiz/q3_C_ms.mp3';


// ============================================
// Q4 OPTION AUDIO
// ============================================

// English
import q4AAudioEn from './audio/quiz/q4_A_en.mp3';
import q4BAudioEn from './audio/quiz/q4_B_en.mp3';
import q4CAudioEn from './audio/quiz/q4_C_en.mp3';

// Malay
import q4AAudioMs from './audio/quiz/q4_A_ms.mp3';
import q4BAudioMs from './audio/quiz/q4_B_ms.mp3';
import q4CAudioMs from './audio/quiz/q4_C_ms.mp3';


// ============================================
// Q5 OPTION AUDIO
// ============================================

// English
import q5AAudioEn from './audio/quiz/q5_A_en.mp3';
import q5BAudioEn from './audio/quiz/q5_B_en.mp3';
import q5CAudioEn from './audio/quiz/q5_C_en.mp3';

// Malay
import q5AAudioMs from './audio/quiz/q5_A_ms.mp3';
import q5BAudioMs from './audio/quiz/q5_B_ms.mp3';
import q5CAudioMs from './audio/quiz/q5_C_ms.mp3';


// ============================================
// TYPES
// ============================================

export interface QuizText {
  en: string;
  ms: string;
}


export interface QuizAudio {
  en: string;
  ms: string;
}


export interface QuizOption {
  id: 'A' | 'B' | 'C';

  text: QuizText;

  image: string;

  isCorrect: boolean;

  audio: QuizAudio;
}


export interface Question {
  id: number;

  questionText: QuizText;

  questionAudio: QuizAudio;

  hintText: QuizText;

  options: QuizOption[];
}


// ============================================
// QUIZ QUESTIONS
// ============================================

export const QUIZ_QUESTIONS: Question[] = [

  // ==========================================
  // QUESTION 1
  // ==========================================

  {
    id: 1,

    questionText: {
      en: 'What can make flooding worse?',
      ms: 'Apakah yang boleh menyebabkan banjir menjadi lebih teruk?',
    },

    questionAudio: {
      en: q1QuestionAudioEn,
      ms: q1QuestionAudioMs,
    },

    hintText: {
      en: 'Tip: Think about what blocks water flow!',
      ms: 'Tip: Fikirkan apa yang menghalang aliran air!',
    },

    options: [

      {
        id: 'A',

        text: {
          en: 'Rubbish in the drain',
          ms: 'Sampah di dalam longkang',
        },

        image: q1A,

        isCorrect: true,

        audio: {
          en: q1AAudioEn,
          ms: q1AAudioMs,
        },
      },

      {
        id: 'B',

        text: {
          en: 'A tree',
          ms: 'Sebatang pokok',
        },

        image: q1B,

        isCorrect: false,

        audio: {
          en: q1BAudioEn,
          ms: q1BAudioMs,
        },
      },

      {
        id: 'C',

        text: {
          en: 'A clean bin',
          ms: 'Tong sampah yang bersih',
        },

        image: q1C,

        isCorrect: false,

        audio: {
          en: q1CAudioEn,
          ms: q1CAudioMs,
        },
      },

    ],
  },


  // ==========================================
  // QUESTION 2
  // ==========================================

  {
    id: 2,

    questionText: {
      en: 'What helps the ground absorb rainwater?',
      ms: 'Apakah yang membantu tanah menyerap air hujan?',
    },

    questionAudio: {
      en: q2QuestionAudioEn,
      ms: q2QuestionAudioMs,
    },

    hintText: {
      en: 'Tip: Natural plants soak up lots of water!',
      ms: 'Tip: Tumbuhan semula jadi menyerap banyak air!',
    },

    options: [

      {
        id: 'A',

        text: {
          en: 'Grass and trees',
          ms: 'Rumput dan pokok',
        },

        image: q2A,

        isCorrect: true,

        audio: {
          en: q2AAudioEn,
          ms: q2AAudioMs,
        },
      },

      {
        id: 'B',

        text: {
          en: 'Plastic bottles',
          ms: 'Botol plastik',
        },

        image: q2B,

        isCorrect: false,

        audio: {
          en: q2BAudioEn,
          ms: q2BAudioMs,
        },
      },

      {
        id: 'C',

        text: {
          en: 'Concrete only',
          ms: 'Permukaan konkrit yang keras',
        },

        image: q2C,

        isCorrect: false,

        audio: {
          en: q2CAudioEn,
          ms: q2CAudioMs,
        },
      },

    ],
  },


  // ==========================================
  // QUESTION 3
  // ==========================================

  {
    id: 3,

    questionText: {
      en: 'When the Earth gets warmer, rain can become…',
      ms: 'Apabila Bumi menjadi lebih panas, hujan boleh menjadi…',
    },

    questionAudio: {
      en: q3QuestionAudioEn,
      ms: q3QuestionAudioMs,
    },

    hintText: {
      en: 'Tip: Warmer air holds more moisture!',
      ms: 'Tip: Udara yang lebih panas menyimpan lebih banyak wap air!',
    },

    options: [

      {
        id: 'A',

        text: {
          en: 'Heavier',
          ms: 'Lebih lebat',
        },

        image: q3A,

        isCorrect: true,

        audio: {
          en: q3AAudioEn,
          ms: q3AAudioMs,
        },
      },

      {
        id: 'B',

        text: {
          en: 'Invisible',
          ms: 'Tidak kelihatan',
        },

        image: q3B,

        isCorrect: false,

        audio: {
          en: q3BAudioEn,
          ms: q3BAudioMs,
        },
      },

      {
        id: 'C',

        text: {
          en: 'Full of toys',
          ms: 'Penuh dengan mainan',
        },

        image: q3C,

        isCorrect: false,

        audio: {
          en: q3CAudioEn,
          ms: q3CAudioMs,
        },
      },

    ],
  },


  // ==========================================
  // QUESTION 4
  // ==========================================

  {
    id: 4,

    questionText: {
      en: 'What should we do with rubbish?',
      ms: 'Apakah yang patut kita lakukan dengan sampah?',
    },

    questionAudio: {
      en: q4QuestionAudioEn,
      ms: q4QuestionAudioMs,
    },

    hintText: {
      en: 'Tip: Keep our environment safe and tidy!',
      ms: 'Tip: Pastikan persekitaran kita selamat dan bersih!',
    },

    options: [

      {
        id: 'A',

        text: {
          en: 'Put it in the correct bin',
          ms: 'Letakkan dalam tong sampah yang betul',
        },

        image: q4A,

        isCorrect: true,

        audio: {
          en: q4AAudioEn,
          ms: q4AAudioMs,
        },
      },

      {
        id: 'B',

        text: {
          en: 'Throw it into the drain',
          ms: 'Buang ke dalam longkang',
        },

        image: q4B,

        isCorrect: false,

        audio: {
          en: q4BAudioEn,
          ms: q4BAudioMs,
        },
      },

      {
        id: 'C',

        text: {
          en: 'Leave it on the road',
          ms: 'Biarkan di atas jalan',
        },

        image: q4C,

        isCorrect: false,

        audio: {
          en: q4CAudioEn,
          ms: q4CAudioMs,
        },
      },

    ],
  },


  // ==========================================
  // QUESTION 5
  // ==========================================

  {
    id: 5,

    questionText: {
      en: 'What can happen when rainwater cannot flow away?',
      ms: 'Apakah yang akan berlaku apabila air hujan tidak dapat mengalir?',
    },

    questionAudio: {
      en: q5QuestionAudioEn,
      ms: q5QuestionAudioMs,
    },

    hintText: {
      en: 'Tip: Think about where the trapped water will go!',
      ms: 'Tip: Fikirkan ke mana air yang terperangkap akan pergi!',
    },

    options: [

      {
        id: 'A',

        text: {
          en: 'The water can rise and cause a flood',
          ms: 'Air boleh naik dan menyebabkan banjir',
        },

        image: q5A,

        isCorrect: true,

        audio: {
          en: q5AAudioEn,
          ms: q5AAudioMs,
        },
      },

      {
        id: 'B',

        text: {
          en: 'The clouds become heavier',
          ms: 'Awan menjadi lebih berat',
        },

        image: q5B,

        isCorrect: false,

        audio: {
          en: q5BAudioEn,
          ms: q5BAudioMs,
        },
      },

      {
        id: 'C',

        text: {
          en: 'The road becomes dry',
          ms: 'Jalan menjadi kering',
        },

        image: q5C,

        isCorrect: false,

        audio: {
          en: q5CAudioEn,
          ms: q5CAudioMs,
        },
      },

    ],
  },

];