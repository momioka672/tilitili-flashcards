import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_ROUTES = ["/dashboard", "/session", "/profile"];
const ADMIN_ROUTES = ["/admin"];
const AUTH_ROUTES = ["/login", "/register"];

function getToken(req: NextRequest): string | null {
  const cookie = req.cookies.get("token")?.value;
  if (cookie) return cookie;
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAdmin = ADMIN_ROUTES.some((r) => pathname.startsWith(r));
  const isAuth = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (!isProtected && !isAdmin && !isAuth) return NextResponse.next();

  const token = getToken(req);
  let payload: { userId: string; role: string } | null = null;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
      const { payload: p } = await jwtVerify(token, secret);
      payload = { userId: p.userId as string, role: p.role as string };
    } catch {
      // invalid or expired token
    }
  }

  if ((isProtected || isAdmin) && !payload) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAdmin && payload && payload.role !== "EDITOR" && payload.role !== "ADMIN") {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  if (isAuth && payload) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*", "/profile/:path*", "/admin/:path*", "/login", "/register"],
};
