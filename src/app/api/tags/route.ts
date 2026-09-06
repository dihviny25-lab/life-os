import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const tags = await db.tag.findMany({
    where: { userId: session.userId },
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
  return ok({ tags });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return bad("name required");
  const tag = await db.tag.upsert({
    where: { userId_name: { userId: session.userId, name } },
    update: { color: body.color },
    create: { userId: session.userId, name, color: body.color || "#71717a" },
  });
  return ok(tag);
}
