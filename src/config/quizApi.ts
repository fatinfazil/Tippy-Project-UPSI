// ============================================
// QUIZ ANSWER
// ============================================

export interface QuizAnswerPayload {
  questionId: number;
  selectedOptionId: 'A' | 'B' | 'C';
  isCorrect: boolean;
}

// ============================================
// SAVED QUIZ RESULT
// ============================================

export interface SavedQuizResult {
  id: string;
  user_id: string;
  scene: string;
  score: number;
  total_questions: number;
  stars: number;
  answers: QuizAnswerPayload[];
  completed_at: string;
}

// ============================================
// API RESPONSE
// ============================================

interface SaveQuizResultResponse {
  ok: boolean;
  result: SavedQuizResult;
}

// ============================================
// SAVE QUIZ RESULT
// ============================================

export async function saveQuizResult(
  accessCode: string,
  answers: QuizAnswerPayload[]
): Promise<SavedQuizResult> {
  const normalizedAccessCode =
    accessCode.trim().toUpperCase();

  if (!normalizedAccessCode) {
    throw new Error(
      'A child access code is required.'
    );
  }

  if (answers.length === 0) {
    throw new Error(
      'At least one quiz answer is required.'
    );
  }

  const response = await fetch(
    '/api/quiz-results',
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        accessCode:
          normalizedAccessCode,

        answers,
      }),
    }
  );

  const contentType =
    response.headers.get(
      'content-type'
    ) ?? '';

  if (
    !contentType.includes(
      'application/json'
    )
  ) {
    throw new Error(
      'Quiz API returned an invalid response.'
    );
  }

  const data = await response.json() as
    | SaveQuizResultResponse
    | { error?: string };

  if (!response.ok) {
    const message =
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : 'Could not save quiz result.';

    throw new Error(message);
  }

  if (
    !('result' in data) ||
    !data.result
  ) {
    throw new Error(
      'The saved quiz result is missing.'
    );
  }

  return data.result;
}