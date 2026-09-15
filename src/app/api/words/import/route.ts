import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/api";
import { WordType } from "@prisma/client";

type WordInput = {
  kyrgyz: string;
  russian: string;
  topic: string;
  type?: WordType;
  pos?: string;
  difficulty?: number;
};

export async function POST(req: NextRequest) {
  const auth = requireEditor(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const confirm = searchParams.get("confirm") === "true";

  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.words)) {
    return NextResponse.json({ error: "Ожидается { words: [...] }" }, { status: 400 });
  }

  const inputs: WordInput[] = body.words;

  const invalid = inputs.filter((w) => !w.kyrgyz || !w.russian || !w.topic);
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `${invalid.length} записей не имеют обязательных полей (kyrgyz, russian, topic)` },
      { status: 400 }
    );
  }

  const kyrgyzList = inputs.map((w) => w.kyrgyz);
  const existingWords = await prisma.word.findMany({
    where: { kyrgyz: { in: kyrgyzList } },
    select: { kyrgyz: true },
  });
  const existingSet = new Set(existingWords.map((w) => w.kyrgyz));

  const newWords = inputs.filter((w) => !existingSet.has(w.kyrgyz));
  const duplicates = inputs.filter((w) => existingSet.has(w.kyrgyz));

  if (!confirm) {
    return NextResponse.json({
      preview: true,
      total: inputs.length,
      new: newWords.length,
      duplicates: duplicates.length,
      duplicateWords: duplicates.map((w) => w.kyrgyz),
    });
  }

  if (newWords.length > 0) {
    await prisma.word.createMany({
      data: newWords.map((w) => ({
        kyrgyz: w.kyrgyz,
        russian: w.russian,
        topic: w.topic,
        type: w.type ?? WordType.WORD,
        pos: w.pos ?? null,
        difficulty: Number(w.difficulty ?? 1),
      })),
    });
  }

  return NextResponse.json({ imported: newWords.length, skipped: duplicates.length });
}
