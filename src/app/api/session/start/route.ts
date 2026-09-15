import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api";
import { getWordsForSession, SessionMode } from "@/lib/algorithm";
import { prisma } from "@/lib/prisma";

const VALID_MODES: SessionMode[] = ["random", "repeat", "weak", "topic"];

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });

  const mode: SessionMode = body.mode;
  if (!VALID_MODES.includes(mode)) {
    return NextResponse.json(
      { error: `Неверный режим. Допустимые: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  if (mode === "topic" && !body.topic) {
    return NextResponse.json({ error: "Для режима 'topic' необходимо указать topic" }, { status: 400 });
  }

  const count = Math.min(Math.max(Number(body.count ?? 10), 1), 50);

  const words = await getWordsForSession(auth.userId, mode, body.topic ?? undefined, count);

  if (words.length === 0) {
    return NextResponse.json({ error: "Нет слов для этого режима" }, { status: 404 });
  }

  // Create a session record
  const session = await prisma.session.create({
    data: {
      userId: auth.userId,
      mode,
      topic: mode === "topic" ? body.topic : undefined,
      totalQuestions: words.length,
    },
  });

  return NextResponse.json({ sessionId: session.id, words });
}
