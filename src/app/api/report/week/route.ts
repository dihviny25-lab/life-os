import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { startOfWeekMonday } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 86400000));

  const [transactions, doneTasks, commitmentsRaw, billsThisWeek, checkins] = await Promise.all([
    db.transaction.findMany({ where: { userId, date: { gte: weekStart, lte: weekEnd } } }),
    db.task.findMany({
      where: { project: { userId }, doneAt: { gte: weekStart, lte: weekEnd } },
      include: { project: { select: { name: true, area: true } } },
    }),
    db.commitment.findMany({ where: { userId, archived: false, startAt: { gte: weekStart, lte: weekEnd } } }),
    db.bill.findMany({ where: { userId, dueDate: { gte: weekStart, lte: weekEnd } } }),
    db.checkin.findMany({ where: { userId, date: { gte: weekStart, lte: weekEnd } } }),
  ]);

  const recebido = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const gasto = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const dizimo = Math.round(recebido * 0.1 * 100) / 100;
  const saldoSemana = recebido - gasto;

  const porProjeto = new Map<string, number>();
  for (const t of doneTasks) {
    const name = t.project.name;
    porProjeto.set(name, (porProjeto.get(name) ?? 0) + 1);
  }

  const dayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const moodByDate = new Map(checkins.map((c) => [c.date.toISOString().slice(0, 10), c.mood]));
  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    return { label: dayLabels[i], mood: moodByDate.get(d.toISOString().slice(0, 10)) ?? null, isFuture: d > now };
  });

  const contasPagas = billsThisWeek.filter((b) => b.paid).length;

  return ok({
    weekStart,
    weekEnd,
    financeiro: { recebido, gasto, dizimo, saldoSemana },
    tarefasConcluidas: { total: doneTasks.length, porProjeto: Array.from(porProjeto, ([name, count]) => ({ name, count })) },
    compromissos: { total: commitmentsRaw.length, itens: commitmentsRaw.map((c) => ({ title: c.title, startAt: c.startAt })) },
    contas: { total: billsThisWeek.length, pagas: contasPagas },
    dias,
  });
}
