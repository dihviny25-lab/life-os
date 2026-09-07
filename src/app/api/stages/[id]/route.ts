import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.stage.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.order === "number") data.order = body.order;

  const stage = await db.stage.update({ where: { id }, data });
  return ok(stage);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.stage.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  await db.stage.delete({ where: { id } });
  return ok({ deleted: true });
}
