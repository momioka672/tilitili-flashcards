import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.wordId || !body?.sessionId || body.answer === undefined) {
    return NextResponse.json({ error: "Обязательные поля: wordId, sessionId, answer" }, { status: 400 });
  }

  const { wordId, sessionId, answer } = body;

  // Verify session belongs to user
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: auth.userId },
  });
  if (!session) {
    return NextResponse.json({ error: "Сессия не найдена" }, { status: 404 });
  }

  // Get the word to check correct answer
  const word = await prisma.word.findUnique({ where: { id: wordId } });
  if (!word) {
    return NextResponse.json({ error: "Слово не найдено" }, { status: 404 });
  }

  // Determine correctness — answer can be the russian or kyrgyz translation
  const isCorrect =
    answer.trim().toLowerCase() === word.russian.trim().toLowerCase() ||
    answer.trim().toLowerCase() === word.kyrgyz.trim().toLowerCase();

  // Upsert UserWordStat
  const stat = await prisma.userWordStat.upsert({
    where: { userId_wordId: { userId: auth.userId, wordId } },
    create: {
      userId: auth.userId,
      wordId,
      shown: 1,
      correct: isCorrect ? 1 : 0,
      incorrect: isCorrect ? 0 : 1,
      lastShownAt: new Date(),
    },
    update: {
      shown: { increment: 1 },
      correct: isCorrect ? { increment: 1 } : undefined,
      incorrect: isCorrect ? undefined : { increment: 1 },
      lastShownAt: new Date(),
    },
  });

  return NextResponse.json({
    isCorrect,
    correctAnswer: {
      kyrgyz: word.kyrgyz,
      russian: word.russian,
    },
    stat: {
      shown: stat.shown,
      correct: stat.correct,
      incorrect: stat.incorrect,
    },
  });
}
