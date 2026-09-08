import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.debt.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.pessoa === "string") data.pessoa = body.pessoa;
  if (body.nota !== undefined) data.nota = body.nota || null;
  if (body.saldo !== undefined) data.saldo = Number(body.saldo) || 0;
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const debt = await db.debt.update({ where: { id }, data });
  return ok(debt);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.debt.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.debt.delete({ where: { id } });
  return ok({ deleted: true });
}
