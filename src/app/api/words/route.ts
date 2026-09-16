import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/api";
import { WordType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const auth = requireEditor(req);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = req.nextUrl;
  const topic = searchParams.get("topic") ?? undefined;
  const type = searchParams.get("type") as WordType | null;
  const difficulty = searchParams.get("difficulty");
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const PAGE_SIZE = 50;

  const SORTABLE = ["kyrgyz", "russian", "type", "topic", "difficulty", "createdAt"] as const;
  const sortParam = searchParams.get("sort");
  const sortBy = SORTABLE.includes(sortParam as (typeof SORTABLE)[number])
    ? (sortParam as (typeof SORTABLE)[number])
    : "createdAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const where = {
    ...(topic ? { topic } : {}),
    ...(type ? { type } : {}),
    ...(difficulty ? { difficulty: Number(difficulty) } : {}),
    ...(search
      ? {
          OR: [
            { kyrgyz: { contains: search, mode: "insensitive" as const } },
            { russian: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [words, total] = await Promise.all([
    prisma.word.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.word.count({ where }),
  ]);

  return NextResponse.json({ words, total, page, pageSize: PAGE_SIZE });
}

export async function POST(req: NextRequest) {
  const auth = requireEditor(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => null);
  if (!body?.kyrgyz || !body?.russian || !body?.topic) {
    return NextResponse.json({ error: "Обязательные поля: kyrgyz, russian, topic" }, { status: 400 });
  }

  const existing = await prisma.word.findUnique({ where: { kyrgyz: body.kyrgyz } });
  if (existing) {
    return NextResponse.json({ error: "Слово с таким кыргызским написанием уже существует" }, { status: 409 });
  }

  const word = await prisma.word.create({
    data: {
      kyrgyz: body.kyrgyz,
      russian: body.russian,
      type: body.type ?? WordType.WORD,
      topic: body.topic,
      pos: body.pos ?? null,
      difficulty: Number(body.difficulty ?? 1),
    },
  });

  return NextResponse.json({ word }, { status: 201 });
}
