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
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function billStatus(bill: { paid: boolean; dueDate: Date; amount: number }, separated: number, today: Date) {
  if (bill.paid) return "pago";
  if (bill.dueDate < today) return "atrasado";
  if (separated >= bill.amount) return "separado";
  if (separated > 0) return "parcial";
  return "sem_cobertura";
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const userId = session.userId;

  const now = new Date();
  const today = startOfDay(now);
  const weekStart = startOfWeekMonday(now);
  const weekEnd = endOfDay(new Date(weekStart.getTime() + 6 * 86400000));
  const in30Days = endOfDay(new Date(now.getTime() + 30 * 86400000));
  const last30DaysStart = startOfDay(new Date(now.getTime() - 30 * 86400000));

  const [finance, envelopes, weeklyBudgets, unpaidBills, weekIncome, weekExpense, recentIncome] = await Promise.all([
    db.finance.findUnique({ where: { userId } }),
    db.envelope.findMany({ where: { userId } }),
    db.weeklyBudget.findMany({ where: { userId } }),
    db.bill.findMany({ where: { userId, paid: false }, include: { envelopes: true }, orderBy: { dueDate: "asc" } }),
    db.transaction.findMany({ where: { userId, type: "income", date: { gte: weekStart, lte: weekEnd } } }),
    db.transaction.findMany({ where: { userId, type: "expense", date: { gte: weekStart, lte: weekEnd } } }),
    db.transaction.findMany({ where: { userId, type: "income", date: { gte: last30DaysStart, lte: now } } }),
  ]);

  const currentBalance = finance?.currentBalance ?? 0;
  const weeklyBudgetTotal = weeklyBudgets.reduce((sum, w) => sum + w.amount, 0);
  const committed = envelopes.reduce((sum, e) => sum + e.allocated, 0) + weeklyBudgetTotal;
  const free = currentBalance - committed;

  const billsWithStatus = unpaidBills.map((b) => {
    const separated = b.envelopes.reduce((sum, e) => sum + e.allocated, 0);
    const missing = Math.max(0, b.amount - separated);
    return {
      id: b.id,
      title: b.title,
      amount: b.amount,
      dueDate: b.dueDate,
      priority: b.priority,
      separated,
      missing,
      status: billStatus(b, separated, today),
    };
  });

  const atencao = billsWithStatus
    .filter((b) => b.status !== "separado")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6);

  const recebidoSemana = weekIncome.reduce((sum, t) => sum + t.amount, 0);
  const gastoSemana = weekExpense.reduce((sum, t) => sum + t.amount, 0);
  const contasSemana = unpaidBills
    .filter((b) => b.dueDate >= weekStart && b.dueDate <= weekEnd)
    .reduce((sum, b) => sum + b.amount, 0);
  const livreSemana = recebidoSemana - gastoSemana - contasSemana - weeklyBudgetTotal;

  const entradas30d = recentIncome.reduce((sum, t) => sum + t.amount, 0);
  const contas30d = unpaidBills.filter((b) => b.dueDate <= in30Days).reduce((sum, b) => sum + b.amount, 0);
  const margem30d = entradas30d - contas30d;

  return ok({
    situacao: { currentBalance, committed, free, status: free < 0 ? "atencao" : "ok" },
    atencao,
    semana: {
      weekStart,
      weekEnd,
      recebido: recebidoSemana,
      gasto: gastoSemana,
      contas: contasSemana,
      orcamentoSemanal: weeklyBudgetTotal,
      livre: livreSemana,
    },
    projecao30d: { entradas: entradas30d, contas: contas30d, margem: margem30d },
  });
}
