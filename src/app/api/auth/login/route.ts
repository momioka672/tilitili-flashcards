import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: "Требуются username и password" }, { status: 400 });
  }

  const { username, password } = body;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "Неверный username или пароль" }, { status: 401 });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Неверный username или пароль" }, { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role });
  return NextResponse.json({ token });
}
