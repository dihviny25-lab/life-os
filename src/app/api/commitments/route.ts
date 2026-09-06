import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const commitments = await db.commitment.findMany({
    where: { userId: session.userId },
    orderBy: { startAt: "asc" },
  });
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
    },
  });
  return ok(commitment);
}
