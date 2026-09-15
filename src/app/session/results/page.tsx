"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AnswerRecord = {
  wordId: string;
  answer: string;
  isCorrect: boolean;
  correctAnswer: { kyrgyz: string; russian: string };
};

type Results = {
  correct: number;
  total: number;
  xpEarned: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </main>
      }
    >
      <ResultsPageInner />
    </Suspense>
  );
}

function ResultsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("sessionId");
  const mode = searchParams.get("mode") ?? "random";
  const topic = searchParams.get("topic") ?? undefined;
  const direction = searchParams.get("direction") ?? "ky-ru";

  const [results, setResults] = useState<Results | null>(null);
  const [mistakes, setMistakes] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/dashboard");
      return;
    }

    const raw = sessionStorage.getItem("session_answers");
    const answers: AnswerRecord[] = raw ? JSON.parse(raw) : [];
    sessionStorage.removeItem("session_answers");

    setMistakes(answers.filter((a) => !a.isCorrect));

    async function finish() {
      try {
        const res = await fetch("/api/session/finish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            answers: answers.map((a) => ({ wordId: a.wordId, isCorrect: a.isCorrect })),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Ошибка при сохранении результатов");
          return;
        }
        setResults(data);
      } catch {
        setError("Ошибка соединения с сервером");
      } finally {
        setLoading(false);
      }
    }

    finish();
  }, [sessionId, router]);

  function handleRetry() {
    const params = new URLSearchParams({
      mode,
      direction,
      ...(topic ? { topic } : {}),
    });
    router.push(`/session?${params}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error}</p>
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

  if (!results) return null;

  const pct = results.total > 0 ? Math.round((results.correct / results.total) * 100) : 0;
  const xpToNextLevel = 100 - (results.totalXp % 100);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-md mx-auto space-y-6">

        {/* Level up banner */}
        {results.leveledUp && (
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 text-center text-white shadow-lg">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-bold">Новый уровень!</p>
            <p className="text-2xl font-extrabold">Уровень {results.level}</p>
          </div>
        )}

        {/* Score card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-3 shadow-sm">
          <div className="text-5xl font-extrabold text-gray-900">{pct}%</div>
          <p className="text-gray-500 text-sm">
            {results.correct} из {results.total} правильных ответов
          </p>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* XP card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Уровень {results.level}</span>
            <span className="text-sm text-blue-600 font-semibold">+{results.xpEarned} XP</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${100 - xpToNextLevel}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            До следующего уровня: {xpToNextLevel} XP
          </p>
        </div>

        {/* Mistakes */}
        {mistakes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h2 className="font-semibold text-gray-800">Ошибки ({mistakes.length})</h2>
            <div className="divide-y divide-gray-100">
              {mistakes.map((m, i) => (
                <div key={i} className="py-2.5 flex justify-between text-sm">
                  <span className="font-medium text-gray-900">{m.correctAnswer.kyrgyz}</span>
                  <span className="text-gray-500">{m.correctAnswer.russian}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pb-4">
          <button
            onClick={handleRetry}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-colors"
          >
            Ещё раз
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-4 border border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    </main>
  );
}
