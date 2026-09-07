import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const weeklyBudgets = await db.weeklyBudget.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });
  return ok({ weeklyBudgets });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return bad("amount must be a positive number");

  const weeklyBudget = await db.weeklyBudget.create({
    data: { userId: session.userId, name: body.name, amount },
  });
  return ok(weeklyBudget);
}
