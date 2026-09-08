import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logBalanceHistory } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Sending the tithe to church is real money leaving the account — decrement
// currentBalance same as any other payment, zero the running total, and
// stamp when it happened.
export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const existing = await db.finance.findUnique({ where: { userId: session.userId } });
  const pendente = existing?.dizimoPendente ?? 0;
  if (pendente <= 0) return bad("Nada pendente");

  const finance = await db.finance.update({
    where: { userId: session.userId },
    data: {
      currentBalance: { decrement: pendente },
      dizimoPendente: 0,
      dizimoPagoEm: new Date(),
    },
  });
  await logBalanceHistory(session.userId, finance.currentBalance);

  return ok({ pago: pendente, dizimoPagoEm: finance.dizimoPagoEm });
}
