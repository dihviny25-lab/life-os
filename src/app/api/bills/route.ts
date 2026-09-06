import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const bills = await db.bill.findMany({
    where: { userId: session.userId },
    orderBy: { dueDate: "asc" },
  });
  return ok({ bills });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (!body.dueDate) return bad("dueDate is required");

  const bill = await db.bill.create({
    data: {
      userId: session.userId,
      title: body.title,
      amount: Number(body.amount) || 0,
      dueDate: new Date(body.dueDate),
    },
  });
  return ok(bill);
}
