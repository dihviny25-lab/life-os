import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const debts = await db.debt.findMany({
    where: { userId: session.userId, archived: false },
    orderBy: { createdAt: "asc" },
    include: { pagamentos: { orderBy: { date: "desc" } } },
  });
  return ok({ debts });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.pessoa) return bad("pessoa is required");
  const saldo = Number(body.saldo);
  if (!saldo || saldo <= 0) return bad("saldo must be a positive number");

  const debt = await db.debt.create({
    data: { userId: session.userId, pessoa: body.pessoa, nota: body.nota || null, saldo },
  });
  return ok(debt);
}
