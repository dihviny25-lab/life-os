"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays, Receipt, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { AnimatedNumber } from "@/components/animated-number";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const monthFmt = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" });

interface Report {
  monthStart: string;
  monthEnd: string;
  financeiro: { recebido: number; gasto: number; dizimo: number; saldoMes: number };
  tarefasConcluidas: { total: number; porProjeto: { name: string; count: number }[] };
  compromissos: { total: number; itens: { title: string; startAt: string }[] };
  contas: { total: number; pagas: number };
  diasComCheckin: number;
  totalDiasNoMes: number;
}

export function MonthReport() {
  const router = useRouter();
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/report/month");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  const monthName = monthFmt.format(new Date(data.monthStart));
  const cappedCount = data.compromissos.itens.length;
  const totalCount = data.compromissos.total;
  const isCapped = cappedCount < totalCount;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-[26px] font-semibold tracking-tight">Relatório mensal</h1>
      <p className="mb-6 text-sm text-muted-foreground capitalize">{monthName}</p>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icon={CheckCircle2} color="#10b981" label="Tarefas concluídas" value={data.tarefasConcluidas.total} />
        <StatTile icon={CalendarDays} color="#3b82f6" label="Compromissos" value={data.compromissos.total} />
        <StatTile icon={Receipt} color="#f59e0b" label="Contas pagas" value={data.contas.pagas} suffix={`/${data.contas.total}`} />
        <StatTile
          icon={TrendingUp}
          color={data.financeiro.saldoMes >= 0 ? "#10b981" : "#f43f5e"}
          label="Saldo do mês"
          value={data.financeiro.saldoMes}
          format={currency}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
        <SectionCard title="Financeiro" icon={TrendingUp} color="#10b981">
          <div className="space-y-1.5 text-sm">
            <Row label="Recebido" value={currency(data.financeiro.recebido)} />
            <Row label="Dízimo (10%)" value={`-${currency(data.financeiro.dizimo)}`} valueClass="text-rose-500" />
            <Row label="Gasto" value={`-${currency(data.financeiro.gasto)}`} valueClass="text-rose-500" />
            <Row
              label="Saldo do mês"
              value={currency(data.financeiro.saldoMes)}
              bold
              valueClass={data.financeiro.saldoMes >= 0 ? "text-emerald-500" : "text-rose-500"}
            />
          </div>
        </SectionCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
        <SectionCard title="Consistência" icon={CheckCircle2} color="#ec4899">
          <div className="space-y-1.5 text-sm">
            <Row
              label="Dias com check-in"
              value={`${data.diasComCheckin}/${data.totalDiasNoMes}`}
              valueClass="font-medium text-muted-foreground"
            />
            <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all"
                style={{ width: `${(data.diasComCheckin / data.totalDiasNoMes) * 100}%` }}
              />
            </div>
          </div>
        </SectionCard>
      </motion.div>

      {data.tarefasConcluidas.porProjeto.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-5">
          <SectionCard title="Tarefas concluídas por projeto" icon={CheckCircle2} color="#3b82f6">
            <ul className="space-y-1.5">
              {data.tarefasConcluidas.porProjeto.map((p) => (
                <li key={p.name} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-medium tabular-nums text-muted-foreground">{p.count}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </motion.div>
      )}

      {data.compromissos.itens.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard title="Compromissos do mês" icon={CalendarDays} color="#8b5cf6">
            <div>
              <ul className="space-y-1.5">
                {data.compromissos.itens.map((c, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>{c.title}</span>
                    <span className="text-muted-foreground">{dayFmt.format(new Date(c.startAt))}</span>
                  </li>
                ))}
              </ul>
              {isCapped && (
                <p className="mt-3 text-xs text-muted-foreground">
                  mostrando os {cappedCount} primeiros de {totalCount} compromissos do mês
                </p>
              )}
            </div>
          </SectionCard>
        </motion.div>
      )}
    </div>
  );
}

function StatTile({
  icon: Icon,
  color,
  label,
  value,
  suffix,
  format,
}: {
  icon: typeof CheckCircle2;
  color: string;
  label: string;
  value: number;
  suffix?: string;
  format?: (n: number) => string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-lg border border-border bg-card p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      </div>
      <p className="font-display text-xl font-semibold tabular-nums">
        <AnimatedNumber value={value} format={format ?? ((v) => Math.round(v).toString())} />
        {suffix}
      </p>
    </motion.div>
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
