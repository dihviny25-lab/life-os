"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, CalendarDays, Receipt, TrendingUp } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { AnimatedNumber } from "@/components/animated-number";
import { MOODS } from "@/lib/moods";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" });

interface Report {
  weekStart: string;
  weekEnd: string;
  financeiro: { recebido: number; gasto: number; dizimo: number; saldoSemana: number };
  tarefasConcluidas: { total: number; porProjeto: { name: string; count: number }[] };
  compromissos: { total: number; itens: { title: string; startAt: string }[] };
  contas: { total: number; pagas: number };
  dias: { label: string; mood: string | null; isFuture: boolean }[];
}

export function WeekReport() {
  const router = useRouter();
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/report/week");
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="font-display text-[26px] font-semibold tracking-tight">Progresso da semana</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {dateFmt.format(new Date(data.weekStart))} – {dateFmt.format(new Date(data.weekEnd))}
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatTile icon={CheckCircle2} color="#10b981" label="Tarefas concluídas" value={data.tarefasConcluidas.total} />
        <StatTile icon={CalendarDays} color="#3b82f6" label="Compromissos" value={data.compromissos.total} />
        <StatTile icon={Receipt} color="#f59e0b" label="Contas pagas" value={data.contas.pagas} suffix={`/${data.contas.total}`} />
        <StatTile
          icon={TrendingUp}
          color={data.financeiro.saldoSemana >= 0 ? "#10b981" : "#f43f5e"}
          label="Saldo da semana"
          value={data.financeiro.saldoSemana}
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
              label="Saldo da semana"
              value={currency(data.financeiro.saldoSemana)}
              bold
              valueClass={data.financeiro.saldoSemana >= 0 ? "text-emerald-500" : "text-rose-500"}
            />
          </div>
        </SectionCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
        <SectionCard title="Como você estava" icon={CheckCircle2} color="#ec4899">
          <div className="flex justify-between">
            {data.dias.map((d) => {
              const mood = MOODS.find((m) => m.key === d.mood);
              return (
                <div key={d.label} className="flex flex-col items-center gap-1.5 text-center">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-lg ${mood ? "bg-muted" : "bg-muted/30"}`}>
                    {mood ? mood.emoji : d.isFuture ? "" : "—"}
                  </span>
                </div>
              );
            })}
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
          <SectionCard title="Compromissos da semana" icon={CalendarDays} color="#8b5cf6">
            <ul className="space-y-1.5">
              {data.compromissos.itens.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span>{c.title}</span>
                  <span className="text-muted-foreground">{dayFmt.format(new Date(c.startAt))}</span>
                </li>
              ))}
            </ul>
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
