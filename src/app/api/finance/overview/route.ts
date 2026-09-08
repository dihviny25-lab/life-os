import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { startOfWeekMonday, computeExcedente } from "@/lib/finance";
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

  const historyStart = startOfDay(new Date(weekStart.getTime() - 5 * 7 * 86400000));

  const [finance, envelopes, weeklyBudgets, unpaidBills, weekIncome, weekExpense, recentIncome, historyTx, balanceHistory] = await Promise.all([
    db.finance.findUnique({ where: { userId } }),
    db.envelope.findMany({ where: { userId } }),
    db.weeklyBudget.findMany({ where: { userId } }),
    db.bill.findMany({ where: { userId, paid: false }, include: { envelopes: true }, orderBy: { dueDate: "asc" } }),
    db.transaction.findMany({ where: { userId, type: "income", date: { gte: weekStart, lte: weekEnd } } }),
    db.transaction.findMany({ where: { userId, type: "expense", date: { gte: weekStart, lte: weekEnd } } }),
    db.transaction.findMany({ where: { userId, type: "income", date: { gte: last30DaysStart, lte: now } } }),
    db.transaction.findMany({ where: { userId, date: { gte: historyStart, lte: weekEnd } } }),
    db.balanceHistory.findMany({ where: { userId }, orderBy: { date: "asc" }, take: 200 }),
  ]);

  const currentBalance = finance?.currentBalance ?? 0;
  const weeklyBaseIncome = finance?.weeklyBaseIncome ?? 1500;
  const fixedTotal = weeklyBudgets.filter((w) => w.kind === "fixed").reduce((sum, w) => sum + w.amount, 0);
  const ceilingTotal = weeklyBudgets.filter((w) => w.kind !== "fixed").reduce((sum, w) => sum + w.amount, 0);
  const weeklyBudgetTotal = fixedTotal + ceilingTotal;
  const committed = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const free = currentBalance - committed;

  const billsWithStatus = unpaidBills.map((b) => {
    const separated = b.envelopes.reduce((sum, e) => sum + e.allocated, 0);
    const missing = Math.max(0, b.amount - separated);
    return {
      id: b.id,
      title: b.title,
      amount: b.amount,
      dueDate: b.dueDate,
      paid: b.paid,
      priority: b.priority,
      area: b.area,
      recurring: b.recurring,
      installments: b.installments,
      installmentNumber: b.installmentNumber,
      separated,
      missing,
      status: billStatus(b, separated, today),
    };
  });

  // Só entra aqui quem está atrasado ou vence nesta semana — uma conta
  // pequena vencendo daqui a três semanas não é "atenção" ainda, porque o
  // plano é pagá-la com o dinheiro da semana do vencimento, não separar
  // com antecedência (isso é reservado pra contas grandes tipo carro/casa).
  const atencao = billsWithStatus
    .filter((b) => b.status !== "separado" && (b.status === "atrasado" || b.dueDate <= weekEnd))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const recebidoSemana = weekIncome.reduce((sum, t) => sum + t.amount, 0);
  const gastoSemana = weekExpense.reduce((sum, t) => sum + t.amount, 0);
  const contasSemana = unpaidBills
    .filter((b) => b.dueDate >= weekStart && b.dueDate <= weekEnd)
    .map((b) => ({ title: b.title, amount: b.amount }));

  const excedente = computeExcedente({
    weeklyBaseIncome,
    recebidoSemana,
    fixedTotal,
    ceilingTotal,
    contasProximas: contasSemana,
  });

  const entradas30d = recentIncome.reduce((sum, t) => sum + t.amount, 0);
  const contas30d = unpaidBills.filter((b) => b.dueDate <= in30Days).reduce((sum, b) => sum + b.amount, 0);
  const margem30d = entradas30d - contas30d;

  const weekLabelFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" });
  const historico = Array.from({ length: 6 }, (_, i) => {
    const wStart = new Date(historyStart.getTime() + i * 7 * 86400000);
    const wEnd = endOfDay(new Date(wStart.getTime() + 6 * 86400000));
    const inWeek = historyTx.filter((t) => t.date >= wStart && t.date <= wEnd);
    return {
      semana: weekLabelFmt.format(wStart),
      recebido: inWeek.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
      gasto: inWeek.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const envelopesChart = envelopes.filter((e) => e.allocated > 0).map((e) => ({ name: e.name, value: e.allocated }));

  const saldoHistorico = balanceHistory.map((bh) => ({
    date: weekLabelFmt.format(new Date(bh.date)),
    balance: bh.balance,
  }));

  return ok({
    situacao: { currentBalance, committed, free, status: free < 0 ? "atencao" : "ok" },
    atencao,
    semana: {
      weekStart,
      weekEnd,
      recebido: recebidoSemana,
      gasto: gastoSemana,
      orcamentoSemanal: weeklyBudgetTotal,
    },
    excedente,
    projecao30d: { entradas: entradas30d, contas: contas30d, margem: margem30d },
    historico,
    envelopesChart,
    saldoHistorico,
  });
}
