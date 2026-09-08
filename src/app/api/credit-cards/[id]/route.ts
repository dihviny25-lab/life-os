import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.creditCard.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.closingDay !== undefined) {
    const v = Number(body.closingDay);
    if (!v || v < 1 || v > 28) return bad("closingDay must be between 1 and 28");
    data.closingDay = v;
  }
  if (body.dueDay !== undefined) {
    const v = Number(body.dueDay);
    if (!v || v < 1 || v > 28) return bad("dueDay must be between 1 and 28");
    data.dueDay = v;
  }
  if (body.limite !== undefined) data.limite = body.limite ? Number(body.limite) || null : null;

  const card = await db.creditCard.update({ where: { id }, data });
  return ok(card);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.creditCard.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.creditCard.delete({ where: { id } });
  return ok({ deleted: true });
}
