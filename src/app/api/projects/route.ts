import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const projects = await db.project.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    include: { tasks: { orderBy: { createdAt: "asc" } } },
  });
  return ok({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  if (!body.area) return bad("area is required");

  const project = await db.project.create({
    data: {
      userId: session.userId,
      name: body.name,
      area: body.area,
      statusNote: body.statusNote || null,
      needsDecision: !!body.needsDecision,
      hasAlert: !!body.hasAlert,
    },
  });
  return ok(project);
}
