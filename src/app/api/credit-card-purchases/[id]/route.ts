import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Only while a purchase is still unbilled (billId null) — once its cycle
// closes it's already folded into a Bill's total, so correcting it here
// would silently desync that Bill's amount. Fix the Bill directly instead.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.creditCardPurchase.findFirst({ where: { id, card: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);
  if (existing.billId) return bad("Já entrou numa fatura fechada — edite a conta gerada, não a compra");

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (body.amount !== undefined) {
    const v = Number(body.amount);
    if (!v || v <= 0) return bad("amount must be a positive number");
    data.amount = v;
  }
  if (body.date) data.date = new Date(body.date);

  const purchase = await db.creditCardPurchase.update({ where: { id }, data });
  return ok(purchase);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.creditCardPurchase.findFirst({ where: { id, card: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);
  if (existing.billId) return bad("Já entrou numa fatura fechada — não dá pra excluir, só editar a conta gerada");

  await db.creditCardPurchase.delete({ where: { id } });
  return ok({ deleted: true });
}
