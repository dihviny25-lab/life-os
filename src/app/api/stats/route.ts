import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);

  const [inboxCount, tasksToday, tasksOverdue, tasksWeek, activeProjects, habits, reviews, itemsByDomain, itemsByType, completedToday, upcomingFinance, domains] = await Promise.all([
    db.item.count({ where: { userId, status: "inbox" } }),
    db.item.count({ where: { userId, type: "task", status: "active", dueDate: { gte: startOfToday, lte: endOfToday } } }),
    db.item.count({ where: { userId, type: "task", status: "active", dueDate: { lt: startOfToday } } }),
    db.item.count({ where: { userId, type: "task", status: "active", dueDate: { gte: startOfWeek, lte: endOfWeek } } }),
    db.project.count({ where: { userId, status: "active" } }),
    db.item.findMany({ where: { userId, type: "habit", status: "active" }, include: { habitLogs: { where: { date: { gte: startOfWeek } } } } }),
    db.review.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 7 }),
    db.item.groupBy({ by: ["domainId"], where: { userId, status: { not: "archived" } }, _count: true }),
    db.item.groupBy({ by: ["type"], where: { userId, status: { not: "archived" } }, _count: true }),
    db.item.count({ where: { userId, status: "done", completedAt: { gte: startOfToday, lte: endOfToday } } }),
    db.item.findMany({ where: { userId, type: "finance", status: "active", dueDate: { gte: startOfWeek, lte: endOfWeek } } }),
    db.domain.findMany({ where: { userId } }),
  ]);

  const habitStats = habits.map((h) => {
    const meta = h.metadata ? safeParse(h.metadata) : {};
    return { id: h.id, title: h.title, target: meta.target, unit: meta.unit, doneThisWeek: h.habitLogs.length, streak: meta.streak || 0 };
  });
  const domainMap = Object.fromEntries(domains.map((d) => [d.id, d]));
  const byDomain = itemsByDomain.map((g) => ({ domain: domainMap[g.domainId || ""]?.key, name: domainMap[g.domainId || ""]?.name, color: domainMap[g.domainId || ""]?.color, count: g._count }));
  const byType = itemsByType.map((g) => ({ type: g.type, count: g._count }));
  const weekFinance = upcomingFinance.map((f) => safeParseItem(f));
  const weekExpense = weekFinance.filter((f) => f.metadata?.kind === "expense").reduce((s, f) => s + (f.metadata?.amount || 0), 0);
  const weekIncome = weekFinance.filter((f) => f.metadata?.kind === "income").reduce((s, f) => s + (f.metadata?.amount || 0), 0);

  return ok({ inboxCount, tasksToday, tasksOverdue, tasksWeek, activeProjects, completedToday, byDomain, byType, habitStats, lastReview: reviews[0] || null, reviewCount: reviews.length, week: { income: weekIncome, expense: weekExpense } });
}

function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }
function safeParseItem(i: any) { return { ...i, metadata: i.metadata ? safeParse(i.metadata) : null }; }
