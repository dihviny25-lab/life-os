import { db } from "@/lib/db";
import { ok, bad, notFound } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;
  const sp = req.nextUrl.searchParams;
  const centerId = sp.get("center");
  const depth = Math.max(1, Math.min(Number(sp.get("depth") || 2), 3));
  const limit = Math.min(Number(sp.get("limit") || 100), 200);
  let itemIds = new Set<string>();
  const projectIds = new Set<string>();

  if (centerId) {
    const center = await db.item.findFirst({ where: { id: centerId, userId }, select: { id: true } });
    if (!center) return notFound();
    const visited = new Set<string>([centerId]);
    let frontier = [centerId];
    for (let d = 0; d < depth && frontier.length; d++) {
      const ownedFrontier = await db.item.findMany({ where: { userId, id: { in: frontier } }, select: { id: true } });
      const ownedIds = ownedFrontier.map((i) => i.id);
      if (!ownedIds.length) break;
      const links = await db.link.findMany({ where: { OR: [{ fromId: { in: ownedIds } }, { toId: { in: ownedIds } }] } });
      const candidates = [...new Set(links.flatMap((l) => [l.fromId, l.toId]))];
      const ownedCandidates = await db.item.findMany({ where: { userId, id: { in: candidates } }, select: { id: true } });
      const next = ownedCandidates.map((i) => i.id).filter((id) => !visited.has(id));
      next.forEach((id) => visited.add(id));
      frontier = next;
    }
    itemIds = visited;
  }

  const items = await db.item.findMany({
    where: centerId ? { userId, id: { in: Array.from(itemIds) } } : { userId, status: { not: "archived" } },
    take: limit,
    include: { domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  for (const it of items) if (it.projectId) projectIds.add(it.projectId);
  const ids = items.map((i) => i.id);
  const links = ids.length ? await db.link.findMany({ where: { AND: [{ fromId: { in: ids } }, { toId: { in: ids } }] } }) : [];
  const projects = await db.project.findMany({ where: projectIds.size ? { userId, id: { in: Array.from(projectIds) } } : { userId, status: "active" }, take: 30 });

  const nodes = [
    ...items.map((it) => ({ id: it.id, kind: "item" as const, type: it.type, title: it.title, status: it.status, color: TYPE_COLORS[it.type] || "#71717a", domainId: it.domainId, projectId: it.projectId, projectName: it.project?.name, projectColor: it.project?.color, priority: it.priority })),
    ...projects.map((p) => ({ id: p.id, kind: "project" as const, type: "project", title: p.name, status: p.status, color: p.color, progress: p.progress, domainId: p.domainId })),
  ];
  const edges = [
    ...links.map((l) => ({ id: l.id, source: l.fromId, target: l.toId, type: l.type, kind: "link" as const })),
    ...items.filter((it) => it.projectId).map((it) => ({ id: `proj-${it.id}-${it.projectId}`, source: it.id, target: it.projectId!, type: "belongs", kind: "project" as const })),
  ];
  return ok({ nodes, edges });
}

const TYPE_COLORS: Record<string, string> = { task: "#f59e0b", note: "#eab308", journal: "#a78bfa", habit: "#10b981", event: "#06b6d4", finance: "#10b981", contact: "#06b6d4", idea: "#ec4899", goal: "#f43f5e", document: "#71717a", bookmark: "#3b82f6", milestone: "#f59e0b", routine: "#eab308", symptom: "#f43f5e", medication: "#f43f5e", affirmation: "#a78bfa", vision: "#a78bfa" };
