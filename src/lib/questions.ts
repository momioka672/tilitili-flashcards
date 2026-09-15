export type Direction = "ky-ru" | "ru-ky";

export type QuestionTypeA = {
  type: "A";
  wordId: string;
  questionNumber: number;
  direction: Direction;
  prompt: string;       // word to translate
  options: string[];    // 4 shuffled options
  correctAnswer: string;
};

export type QuestionTypeB = {
  type: "B";
  wordId: string;
  questionNumber: number;
  direction: Direction;
  prompt: string;
  options: string[];    // 2 options
  correctAnswer: string;
};

export type Question = QuestionTypeA | QuestionTypeB;

export type WordLike = {
  id: string;
  kyrgyz: string;
  russian: string;
  topic: string;
  shown?: number; // from UserWordStat
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Find words similar by first letter and similar length for Type B distractors
function findSimilar(word: string, pool: string[], count: number): string[] {
  const firstChar = word[0]?.toLowerCase() ?? "";
  const len = word.length;

  const scored = pool
    .filter((w) => w !== word)
    .map((w) => {
      let score = 0;
      if (w[0]?.toLowerCase() === firstChar) score += 2;
      score -= Math.abs(w.length - len);
      return { w, score };
    })
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, count).map((s) => s.w);
}

export function generateQuestion(
  word: WordLike,
  allWords: WordLike[],
  direction: Direction,
  questionNumber: number,
  shownCount = 0
): Question {
  const isTypeB = shownCount > 0;

  const [prompt, correctAnswer, answerPool] =
    direction === "ky-ru"
      ? [word.kyrgyz, word.russian, allWords.map((w) => w.russian)]
      : [word.russian, word.kyrgyz, allWords.map((w) => w.kyrgyz)];

  if (isTypeB) {
    // Type B: 2 options — correct + 1 similar distractor
    const distractors = findSimilar(correctAnswer, answerPool, 1);
    const fallback =
      answerPool.find((a) => a !== correctAnswer) ?? correctAnswer + "?";
    const options = shuffle([correctAnswer, distractors[0] ?? fallback]);

    return {
      type: "B",
      wordId: word.id,
      questionNumber,
      direction,
      prompt,
      options,
      correctAnswer,
    };
  }

  // Type A: 4 options — correct + 3 from same topic
  const sameTopic = allWords
    .filter((w) => w.id !== word.id && w.topic === word.topic)
    .map((w) => (direction === "ky-ru" ? w.russian : w.kyrgyz));

  const otherPool = answerPool.filter((a) => a !== correctAnswer);

  // Prefer same-topic distractors, fill from rest if needed
  const distractorPool = [
    ...sameTopic.filter((a) => a !== correctAnswer),
    ...otherPool.filter((a) => !sameTopic.includes(a)),
  ];

  const distractors = distractorPool.slice(0, 3);
  while (distractors.length < 3) {
    distractors.push(correctAnswer + "?".repeat(distractors.length));
  }

  const options = shuffle([correctAnswer, ...distractors]);

  return {
    type: "A",
    wordId: word.id,
    questionNumber,
    direction,
    prompt,
    options,
    correctAnswer,
  };
}
