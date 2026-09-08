import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logBalanceHistory } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// A payment reduces the debt's saldo and, if paid in cash, the bank balance
// too — editing or deleting one has to unwind and redo both effects, not
// just the payment row itself.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: debtId, paymentId } = await params;

  const payment = await db.debtPayment.findFirst({ where: { id: paymentId, debtId, debt: { userId: session.userId } }, include: { debt: true } });
  if (!payment) return bad("Not found", 404);

  const body = await parseBody(req);
  const newValor = body.valor !== undefined ? Number(body.valor) : payment.valor;
  if (!newValor || newValor <= 0) return bad("valor must be a positive number");
  const newMetodo = body.metodo === "permuta" ? "permuta" : body.metodo === "dinheiro" ? "dinheiro" : payment.metodo;
  const newNota = body.nota !== undefined ? body.nota || null : payment.nota;
  const newDate = body.date ? new Date(body.date) : payment.date;

  const novoSaldoDebt = Math.max(0, payment.debt.saldo + payment.valor - newValor);
  await db.debt.update({ where: { id: debtId }, data: { saldo: novoSaldoDebt } });

  const oldEffect = payment.metodo === "dinheiro" ? payment.valor : 0;
  const newEffect = newMetodo === "dinheiro" ? newValor : 0;
  const balanceDelta = oldEffect - newEffect;
  if (balanceDelta !== 0) {
    const finance = await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: balanceDelta },
      update: { currentBalance: { increment: balanceDelta } },
    });
    await logBalanceHistory(session.userId, finance.currentBalance);
  }

  const updated = await db.debtPayment.update({
    where: { id: paymentId },
    data: { valor: newValor, metodo: newMetodo, nota: newNota, date: newDate },
  });
  return ok({ payment: updated, saldo: novoSaldoDebt });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; paymentId: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: debtId, paymentId } = await params;

  const payment = await db.debtPayment.findFirst({ where: { id: paymentId, debtId, debt: { userId: session.userId } }, include: { debt: true } });
  if (!payment) return bad("Not found", 404);

  const novoSaldoDebt = payment.debt.saldo + payment.valor;
  await db.debt.update({ where: { id: debtId }, data: { saldo: novoSaldoDebt } });

  if (payment.metodo === "dinheiro") {
    const finance = await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: payment.valor },
      update: { currentBalance: { increment: payment.valor } },
    });
    await logBalanceHistory(session.userId, finance.currentBalance);
  }

  await db.debtPayment.delete({ where: { id: paymentId } });
  return ok({ deleted: true, saldo: novoSaldoDebt });
}
