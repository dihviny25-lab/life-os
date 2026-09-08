import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logBalanceHistory } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// A transaction's amount feeds directly into currentBalance (see POST
// /api/transactions) — editing or deleting one has to unwind and redo that
// effect too, not just the row itself, or the balance silently drifts from
// what the transactions actually say. Type (income/expense) is intentionally
// not editable here — flipping it would need a full sign-reversal that's
// easy to get wrong; delete and recreate instead.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.transaction.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.date) data.date = new Date(body.date);
  if (body.categoria !== undefined) data.categoria = body.categoria || null;
  let newAmount = existing.amount;
  if (body.amount !== undefined) {
    newAmount = Number(body.amount) || 0;
    if (newAmount <= 0) return bad("amount must be a positive number");
    data.amount = newAmount;
  }

  const updated = await db.transaction.update({ where: { id }, data });

  if (newAmount !== existing.amount) {
    const amountDelta = newAmount - existing.amount;
    const balanceDelta = existing.type === "income" ? amountDelta : -amountDelta;
    // Dízimo is 10% of income, so correcting an income transaction's amount
    // has to correct the running dízimo total by the same proportion.
    const dizimoDelta = existing.type === "income" ? Math.round(amountDelta * 0.1 * 100) / 100 : 0;
    const currentFinance = await db.finance.findUnique({ where: { userId: session.userId } });
    const newDizimoPendente = Math.max(0, (currentFinance?.dizimoPendente ?? 0) + dizimoDelta);
    const finance = await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: balanceDelta, dizimoPendente: Math.max(0, dizimoDelta) },
      update: { currentBalance: { increment: balanceDelta }, dizimoPendente: newDizimoPendente },
    });
    await logBalanceHistory(session.userId, finance.currentBalance);
  }

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.transaction.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const balanceDelta = existing.type === "income" ? -existing.amount : existing.amount;
  const dizimoDelta = existing.type === "income" ? -Math.round(existing.amount * 0.1 * 100) / 100 : 0;
  const currentFinance = await db.finance.findUnique({ where: { userId: session.userId } });
  const newDizimoPendente = Math.max(0, (currentFinance?.dizimoPendente ?? 0) + dizimoDelta);
  const finance = await db.finance.upsert({
    where: { userId: session.userId },
    create: { userId: session.userId, currentBalance: balanceDelta, dizimoPendente: 0 },
    update: { currentBalance: { increment: balanceDelta }, dizimoPendente: newDizimoPendente },
  });
  await logBalanceHistory(session.userId, finance.currentBalance);

  await db.transaction.delete({ where: { id } });
  return ok({ deleted: true });
}
