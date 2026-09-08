import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logBalanceHistory } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const type = req.nextUrl.searchParams.get("type");
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 100, 500);

  const transactions = await db.transaction.findMany({
    where: { userId: session.userId, ...(type ? { type } : {}) },
    orderBy: { date: "desc" },
    take: limit,
  });
  return ok({ transactions });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (body.type !== "income" && body.type !== "expense") return bad("type must be income or expense");
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return bad("amount must be a positive number");

  const transaction = await db.transaction.create({
    data: {
      userId: session.userId,
      type: body.type,
      title: body.title,
      amount,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  // O saldo atual precisa andar junto com a transação, senão "disponível de
  // verdade" fica errado por dinheiro que ainda não "chegou". Dízimo não é
  // separado (sem envelope) — é uma dívida que só cresce até o dia que você
  // manda pra igreja e marca como pago (ver /api/finance/dizimo/pay).
  const balanceDelta = body.type === "income" ? amount : -amount;
  const dizimoDelta = body.type === "income" ? Math.round(amount * 0.1 * 100) / 100 : 0;
  const finance = await db.finance.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, currentBalance: balanceDelta, dizimoPendente: dizimoDelta },
    update: { currentBalance: { increment: balanceDelta }, dizimoPendente: { increment: dizimoDelta } },
  });
  await logBalanceHistory(session.userId, finance.currentBalance);

  return ok(transaction);
}
