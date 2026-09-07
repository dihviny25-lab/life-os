import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const [finance, envelopes] = await Promise.all([
    db.finance.findUnique({ where: { userId: session.userId } }),
    db.envelope.findMany({ where: { userId: session.userId } }),
  ]);

  const currentBalance = finance?.currentBalance ?? 0;
  const committed = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const free = currentBalance - committed;

  return ok({ currentBalance, committed, free });
}

export async function PUT(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (body.currentBalance !== undefined) {
    const currentBalance = Number(body.currentBalance);
    if (Number.isNaN(currentBalance)) return bad("currentBalance must be a number");
    data.currentBalance = currentBalance;
  }
  if (body.weeklyBaseIncome !== undefined) {
    const weeklyBaseIncome = Number(body.weeklyBaseIncome);
    if (Number.isNaN(weeklyBaseIncome)) return bad("weeklyBaseIncome must be a number");
    data.weeklyBaseIncome = weeklyBaseIncome;
  }

  const finance = await db.finance.upsert({
    where: { userId: session.userId },
    update: data,
    create: { userId: session.userId, currentBalance: data.currentBalance ?? 0, weeklyBaseIncome: data.weeklyBaseIncome ?? 1500 },
  });
  return ok(finance);
}
