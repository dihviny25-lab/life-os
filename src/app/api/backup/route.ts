import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;
  const [domains, projects, items, tags, reviews] = await Promise.all([
    db.domain.findMany({ where: { userId } }),
    db.project.findMany({ where: { userId } }),
    db.item.findMany({ where: { userId }, include: { tags: { include: { tag: true } } } }),
    db.tag.findMany({ where: { userId } }),
    db.review.findMany({ where: { userId } }),
  ]);
  const itemIds = items.map((i) => i.id);
  const [links, habitLogs] = await Promise.all([
    itemIds.length ? db.link.findMany({ where: { fromId: { in: itemIds }, toId: { in: itemIds } } }) : [],
    itemIds.length ? db.habitLog.findMany({ where: { itemId: { in: itemIds } } }) : [],
  ]);
  return ok({ version: 2, exportedAt: new Date().toISOString(), domains, projects, items, links, tags, reviews, habitLogs });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  if (!body || !body.version) return bad("Invalid backup file");
  if (body.version !== 2) return bad("Unsupported backup version. Export a fresh version 2 backup before restoring.", 400);

  // Destructive restore is disabled during P0 until IDs and relationships
  // can be remapped transactionally without touching another user's data.
  return bad("Backup restore is temporarily disabled while user-isolated restore is being implemented. Export remains available.", 503);
}
