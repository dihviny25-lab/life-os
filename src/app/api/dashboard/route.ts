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

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [todayCommitments, upcomingCommitments, billsToday, finance, envelopes, weeklyBudgets, projects] = await Promise.all([
    db.commitment.findMany({ where: { userId, archived: false, startAt: { gte: todayStart, lte: todayEnd } }, orderBy: { startAt: "asc" } }),
    db.commitment.findMany({ where: { userId, archived: false, startAt: { gt: todayEnd } }, orderBy: { startAt: "asc" }, take: 10 }),
    db.bill.findMany({ where: { userId, paid: false, dueDate: { gte: todayStart, lte: todayEnd } } }),
    db.finance.findUnique({ where: { userId } }),
    db.envelope.findMany({ where: { userId } }),
    db.weeklyBudget.findMany({ where: { userId } }),
    db.project.findMany({ where: { userId, archived: false }, orderBy: { createdAt: "asc" }, include: { tasks: { orderBy: { createdAt: "asc" } } } }),
  ]);

  const currentBalance = finance?.currentBalance ?? 0;
  const committed =
    envelopes.reduce((sum, e) => sum + e.allocated, 0) + weeklyBudgets.reduce((sum, w) => sum + w.amount, 0);
  const free = currentBalance - committed;

  const churchProjects = projects.filter((p) => p.area === "igreja_ministerio");
  const devProjects = projects.filter((p) => p.area === "desenvolvimento");
  const devNeedsDecision = devProjects.filter((p) => p.status === "aguardando_decisao").length;
  const devAlerts = devProjects.filter((p) => p.hasAlert).length;

  return ok({
    today: { commitments: todayCommitments, bills: billsToday },
    upcomingCommitments,
    finance: { currentBalance, committed, free },
    projects: projects.filter((p) => p.area !== "igreja_ministerio"),
    church: churchProjects,
    dev: { needsDecision: devNeedsDecision, alerts: devAlerts },
  });
}
