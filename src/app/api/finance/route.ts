import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const finance = await db.finance.findUnique({ where: { userId: session.userId } });
  return ok({ availableBalance: finance?.availableBalance ?? 0 });
}

export async function PUT(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  const availableBalance = Number(body.availableBalance);
  if (Number.isNaN(availableBalance)) return bad("availableBalance must be a number");

  const finance = await db.finance.upsert({
    where: { userId: session.userId },
    update: { availableBalance },
    create: { userId: session.userId, availableBalance },
  });
  return ok(finance);
}
