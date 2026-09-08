import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const area = req.nextUrl.searchParams.get("area");

  const bills = await db.bill.findMany({
    where: { userId: session.userId, ...(area ? { area } : {}) },
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

  const installments = body.recurring && Number(body.installments) > 0 ? Number(body.installments) : null;

  const bill = await db.bill.create({
    data: {
      userId: session.userId,
      title: body.title,
      amount: Number(body.amount) || 0,
      dueDate: new Date(body.dueDate),
      area: body.area || null,
      priority: body.priority || "normal",
      recurring: body.recurring || null,
      installments,
      installmentNumber: installments ? 1 : null,
      projectId: body.projectId || null,
    },
  });
  return ok(bill);
}
