"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XP_PER_LEVEL, getRank } from "@/lib/levels";
import ProfileLoading from "./loading";

type Profile = {
  user: {
    id: string;
    username: string;
    role: string;
    xp: number;
    level: number;
    createdAt: string;
  };
  stats: {
    totalSessions: number;
    wordsSeen: number;
    wordsLearned: number;
    favoriteTopic: string | null;
  };
  completedTopics: { topic: string; bestScore: number; completedAt: string | null }[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      setProfile(await res.json());
      setLoading(false);
    }
    load();
  }, [router]);

  function handleLogout() {
    document.cookie = "token=; path=/; max-age=0";
    window.location.href = "/login";
  }

  if (loading) return <ProfileLoading />;

  if (!profile) return null;

  const { user, stats, completedTopics } = profile;
  const xpInLevel = user.xp % XP_PER_LEVEL;
  const xpProgress = (xpInLevel / XP_PER_LEVEL) * 100;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Назад"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">Профиль</h1>
        </div>

        {/* Avatar + rank */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{user.username}</p>
            <p className="text-sm text-blue-600 font-medium">{getRank(user.level)}</p>
          </div>
        </div>

        {/* Level / XP */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Уровень</p>
              <p className="text-2xl font-extrabold text-gray-900">{user.level}</p>
            </div>
            <p className="text-xs text-gray-500">{xpInLevel} / {XP_PER_LEVEL} XP</p>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            ["Сессий", stats.totalSessions],
            ["Слов встречено", stats.wordsSeen],
            ["Хорошо усвоено", stats.wordsLearned],
            ["Любимый топик", stats.favoriteTopic ?? "—"],
          ].map(([label, value]) => (
            <div key={label as string} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
            </div>
          ))}
        </div>

        {/* Completed topics */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Пройденные топики
          </h2>
          {completedTopics.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-2xl border border-gray-200 p-4">
              Пока ни одного пройденного топика
            </p>
          ) : (
            <div className="space-y-2">
              {completedTopics.map((t) => (
                <div
                  key={t.topic}
                  className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4 shadow-sm"
                >
                  <span className="font-medium text-sm text-gray-900">{t.topic}</span>
                  <span className="text-green-600 text-sm font-bold">✅ {t.bestScore}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-4 border border-red-200 text-red-600 font-semibold rounded-2xl hover:bg-red-50 transition-colors"
        >
          Выйти
        </button>
      </div>
    </main>
  );
}
