import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.commitment.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.title === "string") data.title = body.title;
  if (body.startAt) data.startAt = new Date(body.startAt);
  if (body.location !== undefined) data.location = body.location || null;
  if (body.area !== undefined) data.area = body.area || null;
  if (body.recurring !== undefined) data.recurring = body.recurring || null;
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const commitment = await db.commitment.update({ where: { id }, data });
  return ok(commitment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.commitment.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.commitment.delete({ where: { id } });
  return ok({ deleted: true });
}
