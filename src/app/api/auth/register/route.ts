import { db } from "@/lib/db";
import { ok, bad, parseBody, hashPassword, createSession } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function sessionCookie(session: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `lifeos-session=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800${secure}`;
}

export async function POST(req: NextRequest) {
  const body = await parseBody(req);
  const { email, password, name } = body;
  if (!email || !password) return bad("Email and password are required");
  if (password.length < 8) return bad("Password must be at least 8 characters");

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return bad("An account with this email already exists", 409);

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({ data: { email: normalizedEmail, name: name || null, passwordHash, totpVerified: false } });
  const session = createSession(user.id, user.email, true);
  const res = ok({ authenticated: true, email: user.email, name: user.name });
  res.headers.set("Set-Cookie", sessionCookie(session));
  return res;
}
