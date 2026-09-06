import { db } from "@/lib/db";
import { ok, bad, notFound, parseBody, parseMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const item = await db.item.findFirst({
    where: { id, userId: session.userId },
    include: {
      tags: { include: { tag: true } }, domain: true, project: true,
      linksFrom: { include: { to: { include: { domain: true, project: { select: { id: true, name: true, color: true } } } } } },
      linksTo: { include: { from: { include: { domain: true, project: { select: { id: true, name: true, color: true } } } } } },
      habitLogs: { orderBy: { date: "desc" }, take: 60 },
    },
  });
  if (!item) return notFound();
  return ok(parseMeta(item as any));
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const existing = await db.item.findFirst({ where: { id, userId: session.userId }, select: { id: true } });
  if (!existing) return notFound();

  const body = await parseBody(req);
  if (body.domainId) {
    const domain = await db.domain.findFirst({ where: { id: body.domainId, userId: session.userId }, select: { id: true } });
    if (!domain) return bad("Invalid domain", 400);
  }
  if (body.projectId) {
    const project = await db.project.findFirst({ where: { id: body.projectId, userId: session.userId }, select: { id: true } });
    if (!project) return bad("Invalid project", 400);
  }

  const { metadata, tagNames, userId: _ignoredUserId, ...rest } = body;
  if (rest.status === "done" && !rest.completedAt) rest.completedAt = new Date().toISOString();
  if (rest.status && rest.status !== "done") rest.completedAt = null;

  const item = await db.item.update({
    where: { id },
    data: { ...rest, ...(metadata ? { metadata: JSON.stringify(metadata) } : {}) },
    include: { tags: { include: { tag: true } }, domain: true, project: { select: { id: true, name: true, color: true } } },
  });

  if (tagNames) {
    await db.tagOnItem.deleteMany({ where: { itemId: id } });
    if (tagNames.length) {
      const data = [];
      for (const name of tagNames as string[]) {
        const tag = await db.tag.upsert({
          where: { userId_name: { userId: session.userId, name } },
          update: {},
          create: { userId: session.userId, name },
        });
        data.push({ itemId: id, tagId: tag.id });
      }
      await db.tagOnItem.createMany({ data });
    }
  }
  return ok(parseMeta(item as any));
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await ctx.params;
  const result = await db.item.deleteMany({ where: { id, userId: session.userId } });
  if (result.count === 0) return notFound();
  return ok({ deleted: true });
}
