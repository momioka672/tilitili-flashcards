import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export type AuthPayload = { userId: string; role: string };

export function requireAuth(req: NextRequest): AuthPayload | NextResponse {
  const token =
    req.cookies.get("token")?.value ??
    (req.headers.get("authorization")?.startsWith("Bearer ")
      ? req.headers.get("authorization")!.slice(7)
      : null);

  if (!token) return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Недействительный токен" }, { status: 401 });

  return payload;
}

export function requireEditor(req: NextRequest): AuthPayload | NextResponse {
  const result = requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "EDITOR" && result.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }
  return result;
}
