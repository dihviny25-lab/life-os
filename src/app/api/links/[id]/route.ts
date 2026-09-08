import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.link.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.url === "string" && body.url.trim()) data.url = body.url.trim();
  if (body.label !== undefined) data.label = body.label || null;

  const link = await db.link.update({ where: { id }, data });
  return ok(link);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.link.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  await db.link.delete({ where: { id } });
  return ok({ deleted: true });
}
