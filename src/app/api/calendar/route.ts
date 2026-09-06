import { db } from "@/lib/db";
import { ok, bad, parseMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ? new Date(sp.get("from")!) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = sp.get("to") ? new Date(sp.get("to")!) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return bad("Invalid date range", 400);
  const layers = sp.get("layers");
  const layerMode = (sp.get("layerMode") || "type") as "type" | "domain";

  const where: any = {
    userId: session.userId,
    AND: [{ OR: [{ dueDate: { gte: from, lte: to } }, { scheduledAt: { gte: from, lte: to } }, { startDate: { gte: from, lte: to } }] }, { status: { not: "archived" } }],
  };
  if (layers) {
    const vals = layers.split(",").filter(Boolean);
    if (layerMode === "type") where.type = { in: vals };
    else where.domainId = { in: vals };
  }

  const items = await db.item.findMany({
    where,
    include: { domain: true, project: { select: { id: true, name: true, color: true } } },
    orderBy: [{ dueDate: "asc" }, { scheduledAt: "asc" }],
  });
  const days: Record<string, any[]> = {};
  for (const it of items) {
    const dates = [it.dueDate, it.scheduledAt, it.startDate].filter(Boolean);
    for (const d of dates) {
      const key = new Date(d!).toISOString().slice(0, 10);
      (days[key] ||= []).push({ ...parseMeta(it as any), _dateField: it.dueDate === d ? "due" : it.scheduledAt === d ? "scheduled" : "start" });
    }
  }
  return ok({ from: from.toISOString(), to: to.toISOString(), days, items: items.map((i) => parseMeta(i as any)) });
}
