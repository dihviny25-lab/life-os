import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { materializeDueCreditCardInvoices } from "@/lib/creditCard";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  await materializeDueCreditCardInvoices(session.userId);

  const cards = await db.creditCard.findMany({
    where: { userId: session.userId, archived: false },
    orderBy: { createdAt: "asc" },
    include: {
      purchases: { where: { billId: null }, orderBy: { date: "desc" } },
      bills: { where: { paid: false }, orderBy: { dueDate: "asc" } },
    },
  });

  const withFatura = cards.map((c) => ({
    id: c.id,
    name: c.name,
    closingDay: c.closingDay,
    dueDay: c.dueDay,
    faturaAtual: Math.round(c.purchases.reduce((sum, p) => sum + p.amount, 0) * 100) / 100,
    purchases: c.purchases,
    // Already closed (materialized into a Bill) but not paid yet — the
    // actual amount due, unlike faturaAtual which is still accumulating.
    faturasPendentes: c.bills.map((b) => ({ id: b.id, title: b.title, amount: b.amount, dueDate: b.dueDate })),
    limite: c.limite,
    disponivel:
      c.limite != null
        ? Math.round(
            (c.limite - c.purchases.reduce((s, p) => s + p.amount, 0) - c.bills.reduce((s, b) => s + b.amount, 0)) *
              100
          ) / 100
        : null,
  }));

  return ok({ cards: withFatura });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  const closingDay = Number(body.closingDay);
  const dueDay = Number(body.dueDay);
  if (!closingDay || closingDay < 1 || closingDay > 28) return bad("closingDay must be between 1 and 28");
  if (!dueDay || dueDay < 1 || dueDay > 28) return bad("dueDay must be between 1 and 28");

  const card = await db.creditCard.create({
    data: {
      userId: session.userId,
      name: body.name,
      closingDay,
      dueDay,
      limite: Number(body.limite) || null,
    },
  });
  return ok(card);
}
