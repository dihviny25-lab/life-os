import { db } from "@/lib/db";
import { ok, bad, notFound, parseBody, parseMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const project = await db.project.findFirst({ where: { id, userId: session.userId }, include: { domain: true } });
  if (!project) return notFound();
  const items = await db.item.findMany({ where: { userId: session.userId, projectId: id }, include: { tags: { include: { tag: true } }, domain: true } });
  const byType: Record<string, any[]> = {};
  for (const it of items) (byType[it.type] ||= []).push(parseMeta(it as any));
  const tasks = items.filter((i) => i.type === "task");
  const finances = items.filter((i) => i.type === "finance").map((f) => parseMeta(f as any));
  const income = finances.filter((f) => f.metadata?.kind === "income").reduce((s, f) => s + (f.metadata?.amount || 0), 0);
  const expense = finances.filter((f) => f.metadata?.kind === "expense").reduce((s, f) => s + (f.metadata?.amount || 0), 0);
  return ok({ project, items: items.map((i) => parseMeta(i as any)), byType, stats: { total: items.length, tasksDone: tasks.filter((t) => t.status === "done").length, tasksActive: tasks.filter((t) => t.status === "active").length, income, expense, net: income - expense } });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await db.project.findFirst({ where: { id, userId: session.userId }, select: { id: true } });
  if (!existing) return notFound();
  const body = await parseBody(req);
  if (body.domainId) {
    const domain = await db.domain.findFirst({ where: { id: body.domainId, userId: session.userId }, select: { id: true } });
    if (!domain) return bad("Invalid domain", 400);
  }
  const { userId: _ignoredUserId, ...data } = body;
  const project = await db.project.update({ where: { id }, data, include: { domain: true } });
  return ok(parseMeta(project as any));
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await db.project.findFirst({ where: { id, userId: session.userId }, select: { id: true } });
  if (!existing) return notFound();
  await db.item.updateMany({ where: { userId: session.userId, projectId: id }, data: { projectId: null } });
  await db.project.delete({ where: { id } });
  return ok({ deleted: true });
}
