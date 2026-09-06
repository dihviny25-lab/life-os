import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: projectId } = await params;

  const project = await db.project.findFirst({ where: { id: projectId, userId: session.userId } });
  if (!project) return bad("Not found", 404);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");

  const task = await db.task.create({ data: { projectId, title: body.title } });
  return ok(task);
}
