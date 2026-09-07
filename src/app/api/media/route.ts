import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const items = await db.mediaItem.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: "desc" },
  });
  return ok({ items });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (body.kind !== "livro" && body.kind !== "filme_serie") return bad("kind must be livro or filme_serie");
  const status = ["proximo", "andamento", "concluido"].includes(body.status) ? body.status : "proximo";

  const item = await db.mediaItem.create({
    data: { userId: session.userId, kind: body.kind, title: body.title, status },
  });
  return ok(item);
}
