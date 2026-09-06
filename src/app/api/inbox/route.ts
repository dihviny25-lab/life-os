import { db } from "@/lib/db";
import { ok, bad, parseBody, parseMeta, parseListMeta } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const items = await db.item.findMany({
    where: { userId: session.userId, status: "inbox" },
    orderBy: { createdAt: "desc" },
    include: { tags: { include: { tag: true } }, domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok({ items: parseListMeta(items as any[]) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  const title = (body.title || body.text || "").trim();
  if (!title) return bad("title required");

  if (body.domainId && !(await db.domain.findFirst({ where: { id: body.domainId, userId: session.userId }, select: { id: true } }))) return bad("Invalid domain", 400);
  if (body.projectId && !(await db.project.findFirst({ where: { id: body.projectId, userId: session.userId }, select: { id: true } }))) return bad("Invalid project", 400);

  const item = await db.item.create({
    data: {
      userId: session.userId,
      title,
      type: body.type || "note",
      status: "inbox",
      content: body.content,
      domainId: body.domainId,
      projectId: body.projectId,
      ...(body.metadata ? { metadata: JSON.stringify(body.metadata) } : {}),
    },
    include: { domain: true, project: { select: { id: true, name: true, color: true } } },
  });
  return ok(parseMeta(item as any));
}
