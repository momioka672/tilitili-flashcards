"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { generateQuestion } from "@/lib/questions";
import type { Question, Direction } from "@/lib/questions";

type Word = {
  id: string;
  kyrgyz: string;
  russian: string;
  topic: string;
  pos: string | null;
  difficulty: number;
};

type AnswerRecord = {
  wordId: string;
  answer: string;
  isCorrect: boolean;
  correctAnswer: { kyrgyz: string; russian: string };
};

type Phase = "loading" | "question" | "feedback" | "exit-confirm" | "error";

export default function SessionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get("mode") ?? "random";
  const topic = searchParams.get("topic") ?? undefined;
  const direction = (searchParams.get("direction") ?? "ky-ru") as Direction;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const startSession = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, topic, direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Не удалось начать сессию");
        setPhase("error");
        return;
      }

      const sessionWords: Word[] = data.words;
      const qs = sessionWords.map((w, i) =>
        generateQuestion(w, sessionWords, direction, i + 1)
      );

      setSessionId(data.sessionId);
      setWords(sessionWords);
      setQuestions(qs);
      setCurrentIndex(0);
      setAnswers([]);
      setSelected(null);
      setIsCorrect(null);
      setPhase("question");
    } catch {
      setErrorMsg("Ошибка соединения с сервером");
      setPhase("error");
    }
  }, [mode, topic, direction]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  async function handleAnswer(option: string) {
    if (selected !== null || !sessionId) return;

    const q = questions[currentIndex];
    setSelected(option);

    const correct = option === q.correctAnswer;
    setIsCorrect(correct);

    // Call answer API
    let correctAnswer = { kyrgyz: words[currentIndex].kyrgyz, russian: words[currentIndex].russian };
    try {
      const res = await fetch("/api/session/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordId: q.wordId, sessionId, answer: option }),
      });
      if (res.ok) {
        const data = await res.json();
        correctAnswer = data.correctAnswer;
      }
    } catch {
      // Non-critical — still show feedback
    }

    setAnswers((prev) => [
      ...prev,
      { wordId: q.wordId, answer: option, isCorrect: correct, correctAnswer },
    ]);
    setPhase("feedback");
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      // Persist answers for results page
      sessionStorage.setItem("session_answers", JSON.stringify(answers));
      const params = new URLSearchParams({
        sessionId: sessionId!,
        mode,
        ...(topic ? { topic } : {}),
        direction,
      });
      router.push(`/session/results?${params}`);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setIsCorrect(null);
    setPhase("question");
  }

  function handleExitConfirm() {
    setPhase("exit-confirm");
  }

  function handleExitCancel() {
    setPhase(selected !== null ? "feedback" : "question");
  }

  if (phase === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Подбираем слова...</p>
        </div>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <p className="text-red-600">{errorMsg}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold"
          >
            На главную
          </button>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + (phase === "feedback" ? 1 : 0)) / questions.length) * 100;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={handleExitConfirm}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Выйти из сессии"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Вопрос {currentIndex + 1} из {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exit confirm overlay */}
      {phase === "exit-confirm" && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Выйти из сессии?</h2>
            <p className="text-sm text-gray-500">Прогресс этой сессии не сохранится.</p>
            <div className="flex gap-3">
              <button
                onClick={handleExitCancel}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium"
              >
                Продолжить
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-semibold"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          {/* Type badge */}
          <div className="text-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {q.direction === "ky-ru" ? "Кыргызский → Русский" : "Русский → Кыргызский"}
            </span>
          </div>

          {/* Prompt word */}
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 leading-tight">{q.prompt}</p>
          </div>

          {/* Options */}
          <div className={`grid gap-3 ${q.type === "B" ? "grid-cols-1" : "grid-cols-1"}`}>
            {q.options.map((option) => {
              let btnClass =
                "w-full py-4 px-5 rounded-2xl text-left text-base font-medium border-2 transition-all duration-200 ";

              if (phase === "feedback") {
                if (option === q.correctAnswer) {
                  btnClass += "bg-green-50 border-green-500 text-green-800";
                } else if (option === selected) {
                  btnClass += "bg-red-50 border-red-400 text-red-700";
                } else {
                  btnClass += "bg-white border-gray-200 text-gray-400";
                }
              } else {
                btnClass +=
                  "bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]";
              }

              return (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={phase === "feedback"}
                  className={btnClass}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {phase === "feedback" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  isCorrect
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {isCorrect ? "Правильно!" : `Неверно. Правильный ответ: ${q.correctAnswer}`}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
              >
                {currentIndex + 1 >= questions.length ? "Завершить" : "Далее →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
