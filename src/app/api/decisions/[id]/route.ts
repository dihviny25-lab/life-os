import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.decision.findFirst({ where: { id, project: { userId: session.userId } } });
  if (!existing) return bad("Not found", 404);

  await db.decision.delete({ where: { id } });
  return ok({ deleted: true });
}
