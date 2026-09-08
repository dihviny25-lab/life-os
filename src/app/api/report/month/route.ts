import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
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
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  const [transactions, doneTasks, commitmentsRaw, billsThisMonth, checkins] = await Promise.all([
    db.transaction.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } } }),
    db.task.findMany({
      where: { project: { userId }, doneAt: { gte: monthStart, lte: monthEnd } },
      include: { project: { select: { name: true, area: true } } },
    }),
    db.commitment.findMany({ where: { userId, archived: false, startAt: { gte: monthStart, lte: monthEnd } } }),
    db.bill.findMany({ where: { userId, dueDate: { gte: monthStart, lte: monthEnd } } }),
    db.checkin.findMany({ where: { userId, date: { gte: monthStart, lte: monthEnd } } }),
  ]);

  const recebido = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const gasto = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const dizimo = Math.round(recebido * 0.1 * 100) / 100;
  const saldoMes = recebido - gasto;

  const porProjeto = new Map<string, number>();
  for (const t of doneTasks) {
    const name = t.project.name;
    porProjeto.set(name, (porProjeto.get(name) ?? 0) + 1);
  }

  // Count days with checkins
  const diasComCheckinSet = new Set(checkins.map((c) => c.date.toISOString().slice(0, 10)));
  const diasComCheckin = diasComCheckinSet.size;

  // Total days elapsed in the month
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalDiasNoMes = Math.min(now.getDate(), lastDayOfMonth);

  const contasPagas = billsThisMonth.filter((b) => b.paid).length;

  // Cap commitments at 15 most recent
  const sortedCommitments = commitmentsRaw.sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );
  const commitmentsCapped = sortedCommitments.slice(0, 15);

  return ok({
    monthStart,
    monthEnd,
    financeiro: { recebido, gasto, dizimo, saldoMes },
    tarefasConcluidas: { total: doneTasks.length, porProjeto: Array.from(porProjeto, ([name, count]) => ({ name, count })) },
    compromissos: {
      total: commitmentsRaw.length,
      itens: commitmentsCapped.map((c) => ({ title: c.title, startAt: c.startAt })),
    },
    contas: { total: billsThisMonth.length, pagas: contasPagas },
    diasComCheckin,
    totalDiasNoMes,
  });
}
