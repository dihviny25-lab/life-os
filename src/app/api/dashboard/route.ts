import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { projectCommitment } from "@/lib/recurrence";
import { verseOfDayIndex } from "@/lib/verse";
import { materializeDueCreditCardInvoices } from "@/lib/creditCard";
import { AREAS } from "@/lib/areas";
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

  await materializeDueCreditCardInvoices(userId);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [user, allCommitments, allBills, finance, envelopes, projects, verses, checkin, doneToday, recentTransactions, recentBills, recentTasks, recentCommitments, recentDebtPayments, creditCards] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
    db.commitment.findMany({ where: { userId, archived: false } }),
    db.bill.findMany({ where: { userId, paid: false }, orderBy: { dueDate: "asc" } }),
    db.finance.findUnique({ where: { userId } }),
    db.envelope.findMany({ where: { userId } }),
    db.project.findMany({ where: { userId, archived: false } }),
    db.verse.findMany({ where: { userId }, orderBy: { order: "asc" } }),
    db.checkin.findUnique({ where: { userId_date: { userId, date: todayStart } } }),
    db.task.count({ where: { project: { userId }, doneAt: { gte: todayStart, lte: todayEnd } } }),
    db.transaction.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.bill.findMany({ where: { userId, paid: true, paidAt: { not: null } }, orderBy: { paidAt: "desc" }, take: 8 }),
    db.task.findMany({ where: { project: { userId }, doneAt: { not: null } }, orderBy: { doneAt: "desc" }, take: 8, include: { project: { select: { name: true } } } }),
    db.commitment.findMany({ where: { userId, done: true, doneAt: { not: null } }, orderBy: { doneAt: "desc" }, take: 8 }),
    db.debtPayment.findMany({ where: { debt: { userId } }, orderBy: { date: "desc" }, take: 8, include: { debt: { select: { pessoa: true } } } }),
    db.creditCard.findMany({
      where: { userId, archived: false },
      select: { id: true, name: true, purchases: { where: { billId: null } }, bills: { where: { paid: false } } },
    }),
  ]);

  const firstName = user?.name?.trim().split(" ")[0] || null;
  const verseOfDay = verses.length > 0 ? verses[verseOfDayIndex(now, verses.length)] : null;

  const projected = allCommitments
    .map((c) => projectCommitment(c, now))
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  const upcomingCommitments = projected.filter((c) => c.startAt > todayEnd).slice(0, 10);

  const currentBalance = finance?.currentBalance ?? 0;
  const committed = envelopes.reduce((sum, e) => sum + e.allocated, 0);
  const free = currentBalance - committed;

  const overdueBills = allBills.filter((b) => b.dueDate < todayStart);
  const billsDueToday = allBills.filter((b) => b.dueDate >= todayStart && b.dueDate <= todayEnd);

  // Compute total owed across all credit cards
  const emCartoes = creditCards.reduce((total, card) => {
    const faturaAtual = Math.round(card.purchases.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const faturasPendentes = card.bills.reduce((sum, b) => sum + b.amount, 0);
    return total + faturaAtual + faturasPendentes;
  }, 0);

  // Um compromisso recorrente sempre é projetado pra próxima ocorrência —
  // nunca fica "atrasado". Só um compromisso único (sem recorrência) pode
  // passar do horário e ficar esquecido sem ninguém saber.
  const overdueCommitments = allCommitments.filter((c) => !c.recurring && !c.done && c.startAt < now);
  const commitmentsTodayUpcoming = projected.filter(
    (c) => !c.done && c.startAt >= todayStart && c.startAt <= todayEnd && c.startAt >= now,
  );

  const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

  // "Foco do dia" — urgências reais primeiro (vermelho), depois a agenda de
  // hoje (neutra: um compromisso não é um problema, é só o que vai acontecer).
  const foco: { id?: string; type: string; label: string; detail: string; href: string; kind: "alerta" | "evento"; checkable?: boolean }[] = [];
  if (free < 0) {
    foco.push({ type: "saldo", label: "Saldo comprometido além do disponível", detail: `Disponível de verdade: ${free.toFixed(2)}`, href: "/app/areas/financas", kind: "alerta" });
  }
  for (const b of overdueBills) {
    foco.push({ type: "conta", label: `${b.title} está atrasada`, detail: `Vencia em ${dateFmt.format(b.dueDate)}`, href: "/app/areas/financas", kind: "alerta" });
  }
  for (const b of billsDueToday) {
    foco.push({ type: "conta", label: `${b.title} vence hoje`, detail: `${b.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`, href: "/app/areas/financas", kind: "alerta" });
  }
  for (const c of overdueCommitments) {
    foco.push({ id: c.id, type: "compromisso", label: `${c.title} passou do horário`, detail: `Era ${dateFmt.format(c.startAt)} às ${timeFmt.format(c.startAt)}`, href: "/app", kind: "alerta", checkable: true });
  }
  for (const c of commitmentsTodayUpcoming) {
    foco.push({ id: c.id, type: "compromisso", label: c.title, detail: timeFmt.format(c.startAt), href: "/app", kind: "evento", checkable: !c.recurring });
  }

  const porArea = AREAS.map((a) => {
    const activeProjects = projects.filter((p) => p.area === a.key && p.status !== "concluido");
    const nextCommitment = projected.find((c) => c.startAt >= now && c.area === a.key);
    const nextBill = allBills.find((b) => b.area === a.key);
    let subtitle: string;
    if (a.key === "financas") {
      subtitle = `Disponível: ${free.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    } else if (nextCommitment && (!nextBill || nextCommitment.startAt <= nextBill.dueDate)) {
      subtitle = `${nextCommitment.title} · ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(nextCommitment.startAt)}`;
    } else if (nextBill) {
      subtitle = `${nextBill.title} · ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(nextBill.dueDate)}`;
    } else {
      subtitle = "Sem itens agendados";
    }
    return { key: a.key, name: a.name, color: a.color, ativos: activeProjects.length, subtitle };
  });

  // Atividade recente — merge multiple event streams
  type ActivityItem = { type: string; label: string; detail: string; at: string };
  const atividade: ActivityItem[] = [];

  for (const t of recentTransactions) {
    const isIncome = t.type === "income";
    const sign = isIncome ? "+" : "-";
    const detail = `${sign}${t.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
    const label = isIncome ? `Recebeu: ${t.title}` : `Gastou: ${t.title}`;
    atividade.push({ type: "transacao", label, detail, at: t.createdAt.toISOString() });
  }

  for (const b of recentBills) {
    if (b.paidAt) {
      const detail = b.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      atividade.push({ type: "conta", label: `Pagou: ${b.title}`, detail, at: b.paidAt.toISOString() });
    }
  }

  for (const tk of recentTasks) {
    const detail = tk.project.name;
    atividade.push({ type: "tarefa", label: `Concluiu: ${tk.title}`, detail, at: tk.doneAt!.toISOString() });
  }

  for (const c of recentCommitments) {
    if (c.doneAt) {
      atividade.push({ type: "compromisso", label: `Concluiu: ${c.title}`, detail: "", at: c.doneAt.toISOString() });
    }
  }

  for (const dp of recentDebtPayments) {
    const detail = dp.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    atividade.push({ type: "divida", label: `Pagou ${dp.debt.pessoa}`, detail, at: dp.date.toISOString() });
  }

  // Sort by date descending and take top 8
  atividade.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const topAtividade = atividade.slice(0, 8);

  return ok({
    firstName,
    now: now.toISOString(),
    foco,
    resumo: {
      pendentes: allBills.length,
      concluidasHoje: doneToday,
      proximosCompromissos: upcomingCommitments.length,
      atrasadas: overdueBills.length,
      emCartoes,
    },
    porArea,
    verseOfDay: verseOfDay ? { reference: verseOfDay.reference, text: verseOfDay.text } : null,
    checkin: checkin ? { mood: checkin.mood } : null,
    atividade: topAtividade,
    creditCards: creditCards.map((c) => ({ id: c.id, name: c.name })),
  });
}
