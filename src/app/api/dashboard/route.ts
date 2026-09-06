import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
// The nearest Sunday on or after `from` (today counts if it's already Sunday)
function upcomingSunday(from: Date) {
  const d = endOfDay(from);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const sunday = upcomingSunday(now);

  const [todayCommitments, upcomingCommitments, billsToday, billsUntilSunday, finance, projects] = await Promise.all([
    db.commitment.findMany({ where: { userId, startAt: { gte: todayStart, lte: todayEnd } }, orderBy: { startAt: "asc" } }),
    db.commitment.findMany({ where: { userId, startAt: { gt: todayEnd } }, orderBy: { startAt: "asc" }, take: 10 }),
    db.bill.findMany({ where: { userId, paid: false, dueDate: { gte: todayStart, lte: todayEnd } } }),
    db.bill.findMany({ where: { userId, paid: false, dueDate: { gte: todayStart, lte: sunday } } }),
    db.finance.findUnique({ where: { userId } }),
    db.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
  ]);

  const availableBalance = finance?.availableBalance ?? 0;
  const billsUntilSundayTotal = billsUntilSunday.reduce((sum, b) => sum + b.amount, 0);
  const projectedAfterCommitments = availableBalance - billsUntilSundayTotal;

  const churchProjects = projects.filter((p) => p.area === "igreja_ministerio");
  const devProjects = projects.filter((p) => p.area === "desenvolvimento");
  const devNeedsDecision = devProjects.filter((p) => p.needsDecision).length;
  const devAlerts = devProjects.filter((p) => p.hasAlert).length;

  return ok({
    today: { commitments: todayCommitments, bills: billsToday },
    upcomingCommitments,
    finance: {
      availableBalance,
      billsUntilSunday: billsUntilSundayTotal,
      projectedAfterCommitments,
    },
    projects: projects.filter((p) => p.area !== "igreja_ministerio"),
    church: churchProjects,
    dev: { needsDecision: devNeedsDecision, alerts: devAlerts },
  });
}
