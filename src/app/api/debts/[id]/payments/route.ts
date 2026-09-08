import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: debtId } = await params;

  const debt = await db.debt.findFirst({ where: { id: debtId, userId: session.userId } });
  if (!debt) return bad("Not found", 404);

  const body = await parseBody(req);
  const valor = Number(body.valor);
  if (!valor || valor <= 0) return bad("valor must be a positive number");
  const metodo = body.metodo === "permuta" ? "permuta" : "dinheiro";

  const payment = await db.debtPayment.create({
    data: { debtId, valor, metodo, nota: body.nota || null },
  });

  const novoSaldo = Math.max(0, debt.saldo - valor);
  await db.debt.update({ where: { id: debtId }, data: { saldo: novoSaldo } });

  // Pagar em dinheiro é dinheiro real saindo da conta; permuta não mexe no
  // saldo bancário (foi trocado por mercadoria/serviço, não por dinheiro).
  if (metodo === "dinheiro") {
    await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: -valor },
      update: { currentBalance: { decrement: valor } },
    });
  }

  return ok({ payment, saldo: novoSaldo });
}
