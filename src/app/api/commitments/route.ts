import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { projectCommitment } from "@/lib/recurrence";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const area = req.nextUrl.searchParams.get("area");

  const raw = await db.commitment.findMany({
    where: { userId: session.userId, archived: false, ...(area ? { area } : {}) },
  });
  const now = new Date();
  const commitments = raw.map((c) => projectCommitment(c, now)).sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return ok({ commitments });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (!body.startAt) return bad("startAt is required");

  const commitment = await db.commitment.create({
    data: {
      userId: session.userId,
      title: body.title,
      startAt: new Date(body.startAt),
      location: body.location || null,
      area: body.area || null,
      recurring: body.recurring || null,
      projectId: body.projectId || null,
    },
  });
  return ok(commitment);
}
