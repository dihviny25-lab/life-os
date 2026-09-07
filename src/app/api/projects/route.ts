import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { computeProjectProgress } from "@/lib/projects";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const includeArchived = req.nextUrl.searchParams.get("archived") === "true";
  const status = req.nextUrl.searchParams.get("status");
  const area = req.nextUrl.searchParams.get("area");

  const projects = await db.project.findMany({
    where: {
      userId: session.userId,
      archived: includeArchived,
      ...(status ? { status } : {}),
      ...(area ? { area } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { tasks: true, stages: true },
  });

  const withProgress = projects.map((p) => {
    const { tasks, stages, ...rest } = p;
    return { ...rest, progress: computeProjectProgress(tasks, stages) };
  });

  return ok({ projects: withProgress });
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
      objetivo: body.objetivo || null,
      statusNote: body.statusNote || null,
      status: body.status || "planejado",
      prioridade: body.prioridade || "media",
      prazo: body.prazo ? new Date(body.prazo) : null,
      orcamento: typeof body.orcamento === "number" ? body.orcamento : null,
      hasAlert: !!body.hasAlert,
    },
  });
  return ok(project);
}
