import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.decision.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  if (typeof body.body !== "string" || !body.body.trim()) return bad("body is required");

  const decision = await db.decision.update({ where: { id }, data: { body: body.body } });
  return ok(decision);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.decision.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  await db.decision.delete({ where: { id } });
  return ok({ deleted: true });
}
