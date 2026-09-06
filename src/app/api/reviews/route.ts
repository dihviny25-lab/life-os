import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const where: any = { userId: session.userId };
  const type = req.nextUrl.searchParams.get("type");
  if (type) where.type = type;
  const reviews = await db.review.findMany({ where, orderBy: { date: "desc" }, take: 50 });
  return ok({ reviews: reviews.map((r) => ({ ...r, priorities: r.priorities ? safeParse(r.priorities) : null })) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  if (!body.type) return bad("type is required");
  const review = await db.review.create({
    data: {
      userId: session.userId,
      type: body.type,
      date: body.date ? new Date(body.date) : new Date(),
      status: body.status || "completed",
      weekStart: body.weekStart ? new Date(body.weekStart) : null,
      weekEnd: body.weekEnd ? new Date(body.weekEnd) : null,
      wins: body.wins,
      challenges: body.challenges,
      learnings: body.learnings,
      gratitude: body.gratitude,
      priorities: body.priorities ? (typeof body.priorities === "string" ? body.priorities : JSON.stringify(body.priorities)) : null,
      mood: body.mood,
      energy: body.energy,
      notes: body.notes,
    },
  });
  return ok(review);
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return []; } }
