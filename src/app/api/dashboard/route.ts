import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { projectCommitment } from "@/lib/recurrence";
import { verseOfDayIndex } from "@/lib/verse";
import { computeProjectProgress } from "@/lib/projects";
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

  const [allCommitments, billsToday, finance, envelopes, projects, verses, checkin] = await Promise.all([
    db.commitment.findMany({ where: { userId, archived: false } }),
    db.bill.findMany({ where: { userId, paid: false, dueDate: { gte: todayStart, lte: todayEnd } } }),
    db.finance.findUnique({ where: { userId } }),
    db.envelope.findMany({ where: { userId } }),
    db.project.findMany({ where: { userId, archived: false }, orderBy: { createdAt: "asc" }, include: { tasks: true, stages: true } }),
    db.verse.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.checkin.findUnique({ where: { userId_date: { userId, date: todayStart } } }),
  ]);

  const verseOfDay = verses.length > 0 ? verses[verseOfDayIndex(now, verses.length)] : null;

  const projected = allCommitments
    .map((c) => projectCommitment(c, now))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const todayCommitments = projected.filter((c) => c.startAt >= todayStart && c.startAt <= todayEnd);
  const upcomingCommitments = projected.filter((c) => c.startAt > todayEnd).slice(0, 10);

  const currentBalance = finance?.currentBalance ?? 0;
  const committed = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const free = currentBalance - committed;

  const devAlerts = projects.filter((p) => p.area === "desenvolvimento" && p.hasAlert).length;

  const STATUS_WEIGHT: Record<string, number> = { bloqueado: 0, esperando: 1, ativo: 2, planejado: 3, concluido: 4 };
  const projectsAttention = projects
    .filter((p) => p.status !== "concluido")
    .map((p) => {
      const { tasks, stages, ...rest } = p;
      return { ...rest, progress: computeProjectProgress(tasks, stages) };
    })
    .sort((a, b) => {
      const w = (STATUS_WEIGHT[a.status] ?? 5) - (STATUS_WEIGHT[b.status] ?? 5);
      if (w !== 0) return w;
      if (a.prazo && b.prazo) return a.prazo.getTime() - b.prazo.getTime();
      if (a.prazo) return -1;
      if (b.prazo) return 1;
      return 0;
    })
    .slice(0, 5);

  return ok({
    today: { commitments: todayCommitments, bills: billsToday },
    upcomingCommitments,
    finance: { currentBalance, committed, free, envelopes: envelopes.map((e) => ({ name: e.name, allocated: e.allocated })) },
    projectsAttention,
    projectsTotal: projects.length,
    dev: { alerts: devAlerts },
    verseOfDay: verseOfDay ? { reference: verseOfDay.reference, text: verseOfDay.text } : null,
    checkin: checkin ? { mood: checkin.mood } : null,
  });
}
