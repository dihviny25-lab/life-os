import { db } from "@/lib/db";
import { ok, bad, parseBody, parseListMeta, parseMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const sp = req.nextUrl.searchParams;
  const where: any = { userId: session.userId };

  const type = sp.get("type");
  if (type) where.type = type.split(",").length > 1 ? { in: type.split(",") } : type;
  const status = sp.get("status");
  if (status) where.status = status.split(",").length > 1 ? { in: status.split(",") } : status;
  const domain = sp.get("domain");
  if (domain) where.domainId = domain;
  const project = sp.get("project");
  if (project) where.projectId = project;
  const q = sp.get("q");
  if (q) where.OR = [{ title: { contains: q } }, { content: { contains: q } }];
  const tag = sp.get("tag");
  if (tag) where.tags = { some: { tag: { userId: session.userId, name: tag } } };
  const hasDate = sp.get("hasDate");
  if (hasDate === "true") where.OR = [{ dueDate: { not: null } }, { scheduledAt: { not: null } }, { startDate: { not: null } }];

  const orderBy = sp.get("orderBy") || "createdAt";
  const order = sp.get("order") === "asc" ? "asc" : "desc";
  const limit = Math.min(Number(sp.get("limit") || 200), 500);

  const items = await db.item.findMany({
    where,
    orderBy: { [orderBy]: order },
    take: limit,
    include: { tags: { include: { tag: true } }, domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok({ items: parseListMeta(items as any[]) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (!body.type) return bad("type is required");

  if (body.domainId) {
    const domain = await db.domain.findFirst({ where: { id: body.domainId, userId: session.userId }, select: { id: true } });
    if (!domain) return bad("Invalid domain", 400);
  }
  if (body.projectId) {
    const project = await db.project.findFirst({ where: { id: body.projectId, userId: session.userId }, select: { id: true } });
    if (!project) return bad("Invalid project", 400);
  }

  const { metadata, tagNames, userId: _ignoredUserId, ...rest } = body;
  const item = await db.item.create({
    data: {
      ...rest,
      userId: session.userId,
      ...(metadata ? { metadata: JSON.stringify(metadata) } : {}),
      ...(tagNames?.length ? {
        tags: {
          create: await Promise.all((tagNames as string[]).map(async (name) => ({
            tag: {
              connectOrCreate: {
                where: { userId_name: { userId: session.userId, name } },
                create: { userId: session.userId, name },
              },
            },
          }))),
        },
      } : {}),
    },
    include: { tags: { include: { tag: true } }, domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok(parseMeta(item as any));
}
