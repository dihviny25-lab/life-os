"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, AlertTriangle, CalendarDays, TrendingUp, PiggyBank, Repeat, BarChart3, Receipt } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/section-card";
import {
  AddTransactionDialog,
  AddEnvelopeDialog,
  AddWeeklyBudgetDialog,
  EditEnvelopeDialog,
  EditWeeklyBudgetDialog,
  EditTransactionDialog,
  LogActualDialog,
} from "@/components/finance-dialogs";
import { AddBillDialog, EditBillDialog } from "@/components/entry-dialogs";
import { DeleteButton } from "@/components/delete-button";
import { AnimatedNumber } from "@/components/animated-number";
import { DebtsCard } from "@/components/debts-card";
import { CreditCardsCard } from "@/components/credit-cards-card";
import { notify } from "@/lib/toast";
import { AREAS } from "@/lib/areas";
import type { Bill } from "@/lib/types";

const financasColor = AREAS.find((a) => a.key === "financas")!.color;

interface Envelope {
  id: string;
  name: string;
  allocated: number;
  billId: string | null;
}
interface WeeklyBudgetItem {
  id: string;
  name: string;
  amount: number;
  kind: string;
  actualThisWeek: number;
}
interface BillWithStatus extends Bill {
  separated: number;
  missing: number;
  status: "pago" | "atrasado" | "separado" | "parcial" | "sem_cobertura";
  priority: string;
}
interface Excedente {
  weeklyBaseIncome: number;
  recebidoSemana: number;
  dizimoSemana: number;
  liquidoSemana: number;
  necessidadesFixas: number;
  sobraOuDeficit: number;
  sugestao: { label: string; amount: number }[] | null;
}
interface Overview {
  situacao: { currentBalance: number; committed: number; free: number; status: "atencao" | "ok" };
  atencao: BillWithStatus[];
  semana: { recebido: number; gasto: number; orcamentoSemanal: number };
  excedente: Excedente;
  projecao30d: { entradas: number; contas: number; margem: number };
  historico: { semana: string; recebido: number; gasto: number }[];
  envelopesChart: { name: string; value: number }[];
  saldoHistorico: { date: string; balance: number }[];
}
interface TransactionRow {
  id: string;
  type: string;
  title: string;
  amount: number;
  date: string;
}

const PIE_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#f87171"];

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  atrasado: { label: "Atrasado", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  sem_cobertura: { label: "Nada separado ainda", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  parcial: { label: "Parcialmente separado", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  separado: { label: "Separado", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  pago: { label: "Pago", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
};

export function FinanceView() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [weeklyBudgets, setWeeklyBudgets] = useState<WeeklyBudgetItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [overviewRes, billsRes, envelopesRes, weeklyBudgetsRes, transactionsRes] = await Promise.all([
      fetch("/api/finance/overview"),
      fetch("/api/bills"),
      fetch("/api/envelopes"),
      fetch("/api/weekly-budgets"),
      fetch("/api/transactions?limit=20"),
    ]);
    if (overviewRes.status === 401) {
      router.replace("/login");
      return;
    }
    setOverview(await overviewRes.json());
    setBills((await billsRes.json()).bills);
    setEnvelopes((await envelopesRes.json()).envelopes);
    setWeeklyBudgets((await weeklyBudgetsRes.json()).weeklyBudgets);
    setTransactions((await transactionsRes.json()).transactions);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function markBillPaid(b: BillWithStatus) {
    if (!confirm(`Marcar "${b.title}" (${currency(b.amount)}) como paga? Isso desconta o valor do saldo atual.`)) return;
    await fetch(`/api/bills/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    notify.success(`"${b.title}" paga — ${currency(b.amount)} descontado do saldo`);
    load();
  }

  async function deleteBill(id: string) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteTransaction(id: string) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    load();
  }

  if (loading || !overview) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-[26px] font-semibold tracking-tight" style={{ color: financasColor }}>
        Financeiro
      </h1>

      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <SectionCard title="Situação atual" icon={Wallet} color={financasColor}>
            <SituacaoAtual situacao={overview.situacao} envelopes={envelopes} onChange={load} />
          </SectionCard>
        </motion.div>

        {(overview.historico.some((h) => h.recebido > 0 || h.gasto > 0) || overview.envelopesChart.length > 0 || overview.saldoHistorico.length > 1) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}>
            <SectionCard title="Gráficos" icon={BarChart3} color="#38bdf8">
              <FinanceCharts historico={overview.historico} envelopesChart={overview.envelopesChart} saldoHistorico={overview.saldoHistorico} />
            </SectionCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard title="Precisa da sua atenção" icon={AlertTriangle} color="#f43f5e" actions={<AddBillDialog onAdded={load} />}>
            {overview.atencao.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tudo coberto.</p>
            ) : (
              <ul className="space-y-2">
                {overview.atencao.map((b) => {
                  const s = STATUS_LABEL[b.status];
                  return (
                    <li key={b.id} className={`rounded-lg border p-3 text-sm ${s?.bg}`}>
                      <div className="flex items-center gap-2">
                        <Checkbox className="shrink-0" onCheckedChange={() => markBillPaid(b)} />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {b.title}
                          {b.installments && <span className="ml-1 text-xs font-normal text-muted-foreground">({b.installmentNumber || 1}/{b.installments})</span>}
                        </span>
                        <span className="shrink-0 font-semibold tabular-nums">{currency(b.amount)}</span>
                        <EditBillDialog bill={b} onSaved={load} />
                        <DeleteButton label={b.title} onDelete={() => deleteBill(b.id)} />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{dateFmt.format(new Date(b.dueDate))}</span>
                        <span className={`font-medium ${s?.color}`}>
                          {s?.label} {b.separated > 0 && `(${currency(b.separated)} separados)`}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard
            title="Esta semana"
            icon={CalendarDays}
            color="#0ea5e9"
            actions={
              <div className="flex gap-1">
                <AddTransactionDialog type="income" onAdded={load} />
                <AddTransactionDialog type="expense" onAdded={load} />
              </div>
            }
          >
            <div className="space-y-2 text-sm">
              <Row label={`Recebido (base planejada: ${currency(overview.excedente.weeklyBaseIncome)})`} value={currency(overview.excedente.recebidoSemana)} />
              <Row label="Dízimo (10%, separado automaticamente)" value={`-${currency(overview.excedente.dizimoSemana)}`} valueClass="text-rose-500" />
              <Row label="Líquido" value={currency(overview.excedente.liquidoSemana)} />
              <Row label="Necessidades fixas (carro+casa+teto)" value={`-${currency(overview.excedente.necessidadesFixas)}`} valueClass="text-rose-500" />
              <div className="my-1 border-t border-border/60" />
              <Row
                label={overview.excedente.sobraOuDeficit >= 0 ? "Excedente da semana" : "Déficit da semana"}
                value={currency(overview.excedente.sobraOuDeficit)}
                valueClass={overview.excedente.sobraOuDeficit >= 0 ? "text-emerald-500" : "text-rose-500"}
                bold
              />
              {overview.excedente.sugestao && (
                <div className="mt-2 space-y-1 rounded-lg bg-muted/40 p-2.5">
                  <p className="text-xs font-semibold text-muted-foreground">Sugestão pra esse excedente:</p>
                  {overview.excedente.sugestao.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.label}</span>
                      <span className="font-medium tabular-nums">{currency(s.amount)}</span>
                    </div>
                  ))}
                  <p className="pt-1 text-[11px] text-muted-foreground">Isso é só sugestão — você decide onde de fato colocar (envelope, adiantar conta, etc.)</p>
                </div>
              )}
            </div>
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <SectionCard title="Transações recentes" icon={Receipt} color="#0ea5e9">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma transação registrada ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {transactions.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium">{t.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{dateFmt.format(new Date(t.date))}</span>
                    <span className={`shrink-0 font-semibold tabular-nums ${t.type === "income" ? "text-emerald-500" : "text-rose-500"}`}>
                      {t.type === "income" ? "+" : "-"}{currency(t.amount)}
                    </span>
                    <span className="flex shrink-0 items-center">
                      <EditTransactionDialog transaction={t} onSaved={load} />
                      <DeleteButton label={t.title} onDelete={() => deleteTransaction(t.id)} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard title="Próximos 30 dias" icon={TrendingUp} color="#6366f1">
            <div className="space-y-2 text-sm">
              <Row label="Entradas (últimos 30 dias)" value={currency(overview.projecao30d.entradas)} />
              <Row label="Contas previstas" value={currency(overview.projecao30d.contas)} valueClass="text-rose-500" />
              <Row
                label="Margem projetada"
                value={currency(overview.projecao30d.margem)}
                valueClass={overview.projecao30d.margem >= 0 ? "text-emerald-500" : "text-rose-500"}
                bold
              />
            </div>
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <SectionCard title="Dinheiro separado (envelopes)" icon={PiggyBank} color="#f59e0b" actions={<AddEnvelopeDialog bills={bills} onAdded={load} />}>
            {envelopes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada separado ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {envelopes.map((e) => {
                  const bill = bills.find((b) => b.id === e.billId);
                  return (
                    <li key={e.id} className="flex flex-wrap items-center justify-between gap-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate font-medium">
                        {e.name}
                        {bill && <span className="font-normal text-muted-foreground"> → {bill.title}</span>}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular-nums">{currency(e.allocated)}</span>
                        <EditEnvelopeDialog envelope={e} bills={bills} onSaved={load} />
                        <DeleteButton label={e.name} onDelete={async () => { await fetch(`/api/envelopes/${e.id}`, { method: "DELETE" }); load(); }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionCard title="Custos semanais" icon={Repeat} color="#0ea5e9" actions={<AddWeeklyBudgetDialog onAdded={load} />}>
            {weeklyBudgets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum custo semanal cadastrado.</p>
            ) : (
              <ul className="space-y-1.5">
                {weeklyBudgets.map((w) => (
                  <li key={w.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-y-1.5">
                      <span className="min-w-0 truncate font-medium">
                        {w.name}
                        <span className="ml-1.5 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {w.kind === "fixed" ? "fixo" : "teto"}
                        </span>
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular-nums">{currency(w.amount)}/semana</span>
                        <EditWeeklyBudgetDialog weeklyBudget={w} onSaved={load} />
                        <DeleteButton label={w.name} onDelete={async () => { await fetch(`/api/weekly-budgets/${w.id}`, { method: "DELETE" }); load(); }} />
                      </div>
                    </div>
                    {w.kind !== "fixed" && (
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Executado: {currency(w.actualThisWeek)} de {currency(w.amount)}</span>
                        <LogActualDialog weeklyBudget={w} onSaved={load} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <CreditCardsCard />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <DebtsCard />
        </motion.div>
      </div>
    </div>
  );
}

function FinanceCharts({
  historico,
  envelopesChart,
  saldoHistorico,
}: {
  historico: { semana: string; recebido: number; gasto: number }[];
  envelopesChart: { name: string; value: number }[];
  saldoHistorico: { date: string; balance: number }[];
}) {
  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--foreground)",
    fontSize: 12,
  };
  const hasHistory = historico.some((h) => h.recebido > 0 || h.gasto > 0);

  return (
    <div className="space-y-6">
      {saldoHistorico.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Evolução do saldo
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={saldoHistorico} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} cursor={{ fill: "var(--muted)" }} />
              <Line dataKey="balance" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasHistory && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Recebido vs. gasto (últimas 6 semanas)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={historico} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="semana" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} width={48} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => currency(v)}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar dataKey="recebido" name="Recebido" fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gasto" name="Gasto" fill="#f87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {envelopesChart.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Para onde vai o dinheiro comprometido
          </p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={envelopesChart} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                  {envelopesChart.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => currency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {envelopesChart.map((e, i) => (
              <li key={e.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {e.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass, bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={`tabular-nums ${bold ? "text-base font-bold" : "font-medium"} ${valueClass || ""}`}>{value}</span>
    </div>
  );
}

function SituacaoAtual({
  situacao,
  envelopes,
  onChange,
}: {
  situacao: Overview["situacao"];
  envelopes: Envelope[];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(situacao.currentBalance));

  async function save() {
    const currentBalance = Number(value.replace(",", "."));
    if (Number.isNaN(currentBalance)) {
      notify.error("Valor inválido");
      return;
    }
    await fetch("/api/finance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentBalance }),
    });
    setEditing(false);
    onChange();
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Saldo total</span>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 w-28 text-right"
              inputMode="decimal"
            />
            <Button size="sm" className="h-7 px-2" onClick={save}>
              Salvar
            </Button>
          </div>
        ) : (
          <button className="font-semibold tabular-nums hover:underline" onClick={() => setEditing(true)}>
            {currency(situacao.currentBalance)}
          </button>
        )}
      </div>
      <Row label="Já comprometido" value={`-${currency(situacao.committed)}`} valueClass="text-rose-500" />
      {envelopes.length > 0 && (
        <ul className="space-y-1 border-l border-border/60 pl-2.5">
          {envelopes.map((e) => (
            <li key={e.id} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{e.name}</span>
              <span className="tabular-nums">{currency(e.allocated)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="my-1 border-t border-border/60" />
      <div>
        <span className="text-muted-foreground">Disponível de verdade</span>
        <p className={`font-display text-4xl font-semibold tabular-nums ${situacao.free >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
          <AnimatedNumber value={situacao.free} format={currency} />
        </p>
      </div>
      <span
        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
          situacao.status === "atencao" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        }`}
      >
        {situacao.status === "atencao" ? "Atenção" : "Ok"}
      </span>
    </div>
  );
}
