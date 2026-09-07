import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.area === "string") data.area = body.area;
  if (body.statusNote !== undefined) data.statusNote = body.statusNote || null;
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.hasAlert === "boolean") data.hasAlert = body.hasAlert;
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const project = await db.project.update({ where: { id }, data });
  return ok(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.project.delete({ where: { id } });
  return ok({ deleted: true });
}
