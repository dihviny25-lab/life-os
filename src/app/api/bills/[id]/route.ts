import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.bill.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.paid === "boolean") data.paid = body.paid;
  if (typeof body.title === "string") data.title = body.title;
  if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
  if (body.dueDate) data.dueDate = new Date(body.dueDate);

  const bill = await db.bill.update({ where: { id }, data });
  return ok(bill);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.bill.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.bill.delete({ where: { id } });
  return ok({ deleted: true });
}
