import { db } from "@/lib/db";
import { ok, bad, parseBody, parseMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const sp = req.nextUrl.searchParams;
  const where: any = { userId: session.userId };
  const status = sp.get("status");
  if (status) where.status = status.split(",").length > 1 ? { in: status.split(",") } : status;
  const domain = sp.get("domain");
  if (domain) where.domainId = domain;

  const projects = await db.project.findMany({ where, orderBy: { updatedAt: "desc" }, include: { domain: true, _count: { select: { items: true } } } });
  const withStats = await Promise.all(projects.map(async (p) => {
    const items = await db.item.findMany({
      where: { userId: session.userId, projectId: p.id, status: { in: ["active", "done", "inbox"] } },
      select: { type: true, status: true, dueDate: true },
    });
    const tasks = items.filter((i) => i.type === "task");
    return { ...p, itemCount: items.length, taskTotal: tasks.length, taskDone: tasks.filter((t) => t.status === "done").length, taskActive: tasks.filter((t) => t.status === "active").length, upcomingDue: items.filter((i) => i.dueDate && new Date(i.dueDate) >= new Date()).length };
  }));
  return ok({ projects: withStats });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  if (body.domainId) {
    const domain = await db.domain.findFirst({ where: { id: body.domainId, userId: session.userId }, select: { id: true } });
    if (!domain) return bad("Invalid domain", 400);
  }
  const { userId: _ignoredUserId, ...data } = body;
  const project = await db.project.create({ data: { ...data, userId: session.userId }, include: { domain: true } });
  return ok(parseMeta(project as any));
}
