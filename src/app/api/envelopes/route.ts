import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const envelopes = await db.envelope.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });
  return ok({ envelopes });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");

  if (body.billId) {
    const bill = await db.bill.findFirst({ where: { id: body.billId, userId: session.userId } });
    if (!bill) return bad("Invalid bill", 400);
  }

  const envelope = await db.envelope.create({
    data: {
      userId: session.userId,
      name: body.name,
      allocated: Number(body.allocated) || 0,
      billId: body.billId || null,
    },
  });
  return ok(envelope);
}
