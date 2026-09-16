import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, username: true, role: true, xp: true, level: true, createdAt: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const [totalSessions, wordStats, topicSessions, completedTopics] = await Promise.all([
    prisma.session.count({ where: { userId: auth.userId } }),
    prisma.userWordStat.findMany({
      where: { userId: auth.userId },
      select: { shown: true, incorrect: true },
    }),
    prisma.session.groupBy({
      by: ["topic"],
      where: { userId: auth.userId, topic: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 1,
    }),
    prisma.userTopicProgress.findMany({
      where: { userId: auth.userId, completed: true },
      select: { topic: true, bestScore: true, completedAt: true },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  const wordsLearned = wordStats.filter(
    (s) => s.shown > 5 && s.incorrect / s.shown < 0.2
  ).length;

  return NextResponse.json({
    user,
    stats: {
      totalSessions,
      wordsSeen: wordStats.length,
      wordsLearned,
      favoriteTopic: topicSessions[0]?.topic ?? null,
    },
    completedTopics,
  });
}
