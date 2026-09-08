import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: cardId } = await params;

  const card = await db.creditCard.findFirst({ where: { id: cardId, userId: session.userId } });
  if (!card) return bad("Not found", 404);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return bad("amount must be a positive number");

  const purchase = await db.creditCardPurchase.create({
    data: {
      cardId,
      title: body.title,
      amount,
      date: body.date ? new Date(body.date) : new Date(),
      recurring: typeof body.recurring === "boolean" ? body.recurring : false,
    },
  });
  return ok(purchase);
}
