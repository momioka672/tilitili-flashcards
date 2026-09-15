import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api";

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const payload = auth;
  if (!payload) {
    return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as string },
    select: { id: true, username: true, role: true, xp: true, level: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
