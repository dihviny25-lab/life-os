import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const [finance, envelopes, weeklyBudgets] = await Promise.all([
    db.finance.findUnique({ where: { userId: session.userId } }),
    db.envelope.findMany({ where: { userId: session.userId } }),
    db.weeklyBudget.findMany({ where: { userId: session.userId } }),
  ]);

  const currentBalance = finance?.currentBalance ?? 0;
  const committed =
    envelopes.reduce((sum, e) => sum + e.allocated, 0) + weeklyBudgets.reduce((sum, w) => sum + w.amount, 0);
  const free = currentBalance - committed;

  return ok({ currentBalance, committed, free });
}

export async function PUT(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  const currentBalance = Number(body.currentBalance);
  if (Number.isNaN(currentBalance)) return bad("currentBalance must be a number");

  const finance = await db.finance.upsert({
    where: { userId: session.userId },
    update: { currentBalance },
    create: { userId: session.userId, currentBalance },
  });
  return ok(finance);
}
