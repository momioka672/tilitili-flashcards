import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type AnswerInput = {
  wordId: string;
  isCorrect: boolean;
};

// XP: 10 per correct answer + streak bonus (every 3 in a row = +5)
function calcXP(answers: AnswerInput[]): number {
  let xp = 0;
  let streak = 0;
  for (const a of answers) {
    if (a.isCorrect) {
      xp += 10;
      streak++;
      if (streak % 3 === 0) xp += 5;
    } else {
      streak = 0;
    }
  }
  return xp;
}

// Level = floor(xp / 100) + 1, capped at 99
function calcLevel(xp: number): number {
  return Math.min(Math.floor(xp / 100) + 1, 99);
}

const TOPIC_COMPLETION_THRESHOLD = 75; // percent

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.sessionId || !Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Обязательные поля: sessionId, answers[]" }, { status: 400 });
  }

  const session = await prisma.session.findFirst({
    where: { id: body.sessionId, userId: auth.userId },
  });
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  const answers: AnswerInput[] = body.answers;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const xpEarned = calcXP(answers);

  // Update session record
  await prisma.session.update({
    where: { id: body.sessionId },
    data: {
      score: correctCount,
      totalQuestions: answers.length,
      xpEarned,
    },
  });

  // Update user xp and level
  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { xp: { increment: xpEarned } },
  });

  const newLevel = calcLevel(user.xp);
  const leveledUp = newLevel > user.level;
  if (leveledUp) {
    await prisma.user.update({
      where: { id: auth.userId },
      data: { level: newLevel },
    });
  }

  // Update topic progress if this was a topic-mode session
  let topicCompleted = false;
  if (session.topic && answers.length > 0) {
    const scorePct = Math.round((correctCount / answers.length) * 100);
    const existing = await prisma.userTopicProgress.findUnique({
      where: { userId_topic: { userId: auth.userId, topic: session.topic } },
    });
    const bestScore = Math.max(existing?.bestScore ?? 0, scorePct);
    const completed = existing?.completed || scorePct >= TOPIC_COMPLETION_THRESHOLD;
    topicCompleted = completed && !existing?.completed;

    await prisma.userTopicProgress.upsert({
      where: { userId_topic: { userId: auth.userId, topic: session.topic } },
      create: {
        userId: auth.userId,
        topic: session.topic,
        bestScore: scorePct,
        completed: scorePct >= TOPIC_COMPLETION_THRESHOLD,
        completedAt: scorePct >= TOPIC_COMPLETION_THRESHOLD ? new Date() : null,
      },
      update: {
        bestScore,
        completed,
        completedAt: completed && !existing?.completed ? new Date() : existing?.completedAt,
      },
    });
  }

  return NextResponse.json({
    correct: correctCount,
    total: answers.length,
    xpEarned,
    totalXp: user.xp,
    level: leveledUp ? newLevel : user.level,
    leveledUp,
    topic: session.topic,
    topicCompleted,
  });
}
