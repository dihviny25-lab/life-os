import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function todayDateOnly() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const checkin = await db.checkin.findUnique({
    where: { userId_date: { userId: session.userId, date: todayDateOnly() } },
  });
  return ok({ checkin });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.mood) return bad("mood is required");

  const date = todayDateOnly();
  const checkin = await db.checkin.upsert({
    where: { userId_date: { userId: session.userId, date } },
    create: { userId: session.userId, date, mood: body.mood, note: body.note || null },
    update: { mood: body.mood, note: body.note || null },
  });
  return ok({ checkin });
}
