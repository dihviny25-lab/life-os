import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.weeklyBudget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
  if (body.kind === "fixed" || body.kind === "ceiling") data.kind = body.kind;
  if (body.actualThisWeek !== undefined) {
    data.actualThisWeek = Number(body.actualThisWeek) || 0;
    data.weekOf = new Date();
  }

  const weeklyBudget = await db.weeklyBudget.update({ where: { id }, data });
  return ok(weeklyBudget);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.weeklyBudget.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.weeklyBudget.delete({ where: { id } });
  return ok({ deleted: true });
}
