import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { startOfWeekMonday } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const raw = await db.weeklyBudget.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  const weekStart = startOfWeekMonday(new Date());
  const weeklyBudgets = await Promise.all(
    raw.map(async (w) => {
      if (w.kind === "ceiling" && w.weekOf < weekStart) {
        return db.weeklyBudget.update({ where: { id: w.id }, data: { actualThisWeek: 0, weekOf: weekStart } });
      }
      return w;
    }),
  );

  return ok({ weeklyBudgets });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return bad("amount must be a positive number");

  const kind = body.kind === "fixed" ? "fixed" : "ceiling";
  const weeklyBudget = await db.weeklyBudget.create({
    data: { userId: session.userId, name: body.name, amount, kind },
  });
  return ok(weeklyBudget);
}
