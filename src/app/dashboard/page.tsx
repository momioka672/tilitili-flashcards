"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  xp: number;
  level: number;
};

type TopicInfo = {
  topic: string;
  wordCount: number;
  status: "available" | "locked" | "completed";
  bestScore: number;
};

type Mode = "random" | "repeat" | "weak";
type Direction = "ky-ru" | "ru-ky";

const TOPIC_ICONS: Record<string, string> = {
  "Природа": "🌿", "Семья": "👨‍👩‍👧", "Еда": "🍎", "Животные": "🐾", "Цвета": "🎨",
  "Дом": "🏠", "Школа": "📚", "Время": "⏰", "Погода": "🌤", "Город": "🏙",
  "Транспорт": "🚌", "Одежда": "👕", "Здоровье": "💊", "Работа": "💼", "Язык": "💬",
  "Эмоции": "😊", "Спорт": "⚽", "Праздник": "🎉", "Путешествия": "✈️", "Общее": "📖",
};

const MODE_LABELS: Record<Mode, string> = {
  random: "Случайные слова",
  repeat: "Повторение",
  weak: "Слабые места",
};

const XP_PER_LEVEL = 100;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [mode, setMode] = useState<Mode>("random");
  const [direction, setDirection] = useState<Direction>("ky-ru");

  useEffect(() => {
    async function load() {
      const [userRes, topicsRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/topics"),
      ]);
      if (!userRes.ok) {
        router.push("/login");
        return;
      }
      const { user } = await userRes.json();
      const { topics } = await topicsRes.json();
      setUser(user);
      setTopics(topics);
      setLoading(false);
    }
    load();
  }, [router]);

  function startQuickSession() {
    setShowQuickModal(false);
    router.push(`/session?mode=${mode}&direction=${direction}`);
  }

  function startTopicSession(topic: string) {
    router.push(`/session?mode=topic&topic=${encodeURIComponent(topic)}&direction=${direction}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const xpInLevel = user.xp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;
  const completedCount = topics.filter((t) => t.status === "completed").length;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Quick session bottomsheet */}
      {showQuickModal && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowQuickModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />
            <h2 className="text-lg font-bold text-gray-900">Быстрая сессия</h2>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Режим</p>
              <div className="grid grid-cols-3 gap-2">
                {(["random", "repeat", "weak"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      mode === m
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {MODE_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Направление</p>
              <div className="grid grid-cols-2 gap-2">
                {([["ky-ru", "КЫР → РУС"], ["ru-ky", "РУС → КЫР"]] as [Direction, string][]).map(([d, label]) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                      direction === d
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={startQuickSession}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors"
            >
              Начать
            </button>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Привет,</p>
            <h1 className="text-xl font-bold text-gray-900">{user.username}</h1>
          </div>
          <button
            onClick={() => router.push("/profile")}
            className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm"
          >
            {user.username[0].toUpperCase()}
          </button>
        </div>

        {/* XP / Level card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Уровень</p>
              <p className="text-2xl font-extrabold text-gray-900">{user.level}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{xpInLevel} / {XP_PER_LEVEL} XP</p>
              <p className="text-xs text-gray-400">{completedCount} топиков пройдено</p>
            </div>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Quick session button */}
        <button
          onClick={() => setShowQuickModal(true)}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-base transition-colors shadow-sm"
        >
          ⚡ Быстрая сессия
        </button>

        {/* Topics */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Уровни</h2>
          <div className="space-y-2">
            {topics.map((t) => {
              const icon = TOPIC_ICONS[t.topic] ?? "📖";
              const isLocked = t.status === "locked";
              const isCompleted = t.status === "completed";

              return (
                <button
                  key={t.topic}
                  disabled={isLocked}
                  onClick={() => !isLocked && startTopicSession(t.topic)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    isLocked
                      ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                      : isCompleted
                      ? "border-green-200 bg-green-50 hover:border-green-300"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-2xl">{isLocked ? "🔒" : icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isLocked ? "text-gray-400" : "text-gray-900"}`}>
                      {t.topic}
                    </p>
                    <p className="text-xs text-gray-400">{t.wordCount} слов</p>
                  </div>
                  <div className="text-right shrink-0">
                    {isCompleted ? (
                      <span className="text-green-600 text-sm font-bold">✅ {t.bestScore}%</span>
                    ) : isLocked ? null : (
                      <span className="text-gray-300 text-lg">›</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
