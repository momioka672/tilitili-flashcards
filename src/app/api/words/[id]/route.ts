import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEditor } from "@/lib/api";
import { WordType } from "@prisma/client";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireEditor(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Неверный запрос" }, { status: 400 });

  const existing = await prisma.word.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Слово не найдено" }, { status: 404 });

  if (body.kyrgyz && body.kyrgyz !== existing.kyrgyz) {
    const duplicate = await prisma.word.findUnique({ where: { kyrgyz: body.kyrgyz } });
    if (duplicate) {
      return NextResponse.json({ error: "Слово с таким кыргызским написанием уже существует" }, { status: 409 });
    }
  }

  const word = await prisma.word.update({
    where: { id },
    data: {
      ...(body.kyrgyz ? { kyrgyz: body.kyrgyz } : {}),
      ...(body.russian ? { russian: body.russian } : {}),
      ...(body.type ? { type: body.type as WordType } : {}),
      ...(body.topic ? { topic: body.topic } : {}),
      ...(body.pos !== undefined ? { pos: body.pos } : {}),
      ...(body.difficulty ? { difficulty: Number(body.difficulty) } : {}),
    },
  });

  return NextResponse.json({ word });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireEditor(req);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const existing = await prisma.word.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Слово не найдено" }, { status: 404 });

  await prisma.word.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
