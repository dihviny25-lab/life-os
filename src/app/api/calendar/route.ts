import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { occurrencesInRange } from "@/lib/recurrence";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;

  const startParam = req.nextUrl.searchParams.get("start");
  const endParam = req.nextUrl.searchParams.get("end");
  if (!startParam || !endParam) return bad("start and end are required");
  const rangeStart = new Date(startParam);
  const rangeEnd = new Date(endParam);

  const [commitments, bills] = await Promise.all([
    db.commitment.findMany({ where: { userId, archived: false } }),
    db.bill.findMany({ where: { userId, dueDate: { gte: rangeStart, lte: rangeEnd } } }),
  ]);

  const events: { id: string; title: string; date: string; type: "commitment" | "bill"; area: string | null; location?: string | null; recurring?: string | null; amount?: number; paid?: boolean }[] = [];

  for (const c of commitments) {
    for (const date of occurrencesInRange(c, rangeStart, rangeEnd)) {
      events.push({
        id: c.id,
        title: c.title,
        date: date.toISOString(),
        type: "commitment",
        area: c.area,
        location: c.location,
        recurring: c.recurring,
      });
    }
  }

  for (const b of bills) {
    events.push({
      id: b.id,
      title: b.title,
      date: b.dueDate.toISOString(),
      type: "bill",
      area: b.area,
      amount: b.amount,
      paid: b.paid,
    });
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return ok({ events });
}
