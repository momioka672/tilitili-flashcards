import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Требуются username и password" }, { status: 400 });
  }

  const { username, password } = body;

  if (username.length < 3) {
    return NextResponse.json({ error: "Username минимум 3 символа" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Пароль минимум 6 символов" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Этот username уже занят" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return NextResponse.json({ token }, { status: 201 });
}
