import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}) as Record<string, string>);
  if (!email || !password) return NextResponse.json({ error: "missing" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
  if (!user) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });

  const token = await createSessionToken({ sub: user.id, email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true, user: { email: user.email, name: user.name, role: user.role } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
