"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ListChecks, CalendarClock, AlertTriangle, Clock, Smile, Activity, Receipt, HandCoins, TrendingUp } from "lucide-react";
import { MOODS } from "@/lib/moods";
import { AREAS } from "@/lib/areas";
import { AnimatedNumber } from "@/components/animated-number";
import { Checkbox } from "@/components/ui/checkbox";
import { AddTransactionDialog } from "@/components/finance-dialogs";
import { AddBillDialog, AddCommitmentDialog } from "@/components/entry-dialogs";

interface FocoItem {
  id?: string;
  type: string;
  label: string;
  detail: string;
  href: string;
  kind: "alerta" | "evento";
  checkable?: boolean;
}
interface AreaSummary {
  key: string;
  name: string;
  color: string;
  ativos: number;
  subtitle: string;
}
interface DashboardData {
  firstName: string | null;
  now: string;
  foco: FocoItem[];
  resumo: { pendentes: number; concluidasHoje: number; proximosCompromissos: number; atrasadas: number };
  porArea: AreaSummary[];
  verseOfDay: { reference: string; text: string | null } | null;
  checkin: { mood: string } | null;
  atividade: { type: string; label: string; detail: string; at: string }[];
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

function greeting(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function Dashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const now = new Date(data.now);
  const dateLabel = dateFmt.format(now);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-[26px] font-semibold tracking-tight">
          {greeting(now.getHours())}{data.firstName ? `, ${data.firstName}` : ""}.
        </h1>
        <p className="mt-1 text-sm capitalize text-muted-foreground">{dateLabel}</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6">
        <div className="flex gap-2">
          <AddTransactionDialog type="income" onAdded={load} />
          <AddTransactionDialog type="expense" onAdded={load} />
          <AddBillDialog onAdded={load} />
          <AddCommitmentDialog onAdded={load} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
        <FocoDoDia items={data.foco} onChange={load} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-5">
        <ResumoGeral resumo={data.resumo} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
        <PorArea areas={data.porArea} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-6">
        <AtividadeRecente items={data.atividade} />
      </motion.div>

      {(data.checkin !== undefined || data.verseOfDay) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
          <AntesDeSeguir checkin={data.checkin} verseOfDay={data.verseOfDay} onChange={load} />
        </motion.div>
      )}
    </div>
  );
}

function FocoDoDia({ items, onChange }: { items: FocoItem[]; onChange: () => void }) {
  async function markCommitmentDone(id: string) {
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    onChange();
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <span aria-hidden>🔥</span> Foco do dia
      </p>
      {items.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.4 }}>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </motion.div>
          <div>
            <p className="font-medium">Você está em dia.</p>
            <p className="text-sm text-muted-foreground">Nada urgente exige sua atenção agora.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors ${
                item.kind === "alerta" ? "bg-rose-500/5 hover:bg-rose-500/10" : "bg-muted/40 hover:bg-muted"
              }`}
            >
              {item.checkable && item.id && (
                <Checkbox className="shrink-0" onCheckedChange={() => markCommitmentDone(item.id!)} />
              )}
              <Link href={item.href} className="flex flex-1 items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  {item.kind === "alerta" ? (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                  ) : (
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  {item.label}
                </span>
                <span className="shrink-0 text-muted-foreground">{item.detail}</span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResumoGeral({ resumo }: { resumo: DashboardData["resumo"] }) {
  const tiles = [
    { label: "Contas pendentes", sub: "ainda não pagas", value: resumo.pendentes, icon: ListChecks, color: "#f59e0b", href: "/app/areas/financas" },
    { label: "Tarefas concluídas", sub: "hoje", value: resumo.concluidasHoje, icon: CheckCircle2, color: "#10b981", href: "/app/semana" },
    { label: "Próximos compromissos", sub: "agendados", value: resumo.proximosCompromissos, icon: CalendarClock, color: "#3b82f6", href: "/app/semana" },
    { label: "Contas atrasadas", sub: "venceram e não foram pagas", value: resumo.atrasadas, icon: AlertTriangle, color: "#f43f5e", href: "/app/areas/financas" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Resumo geral</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((t) => (
          <motion.div key={t.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link href={t.href} className="block rounded-lg border border-border bg-card p-3.5 transition-colors hover:bg-muted/40">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t.label}</span>
                <t.icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.color }} />
              </div>
              <p className="font-display text-2xl font-semibold tabular-nums">
                <AnimatedNumber value={t.value} format={(v) => Math.round(v).toString()} />
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.sub}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PorArea({ areas }: { areas: AreaSummary[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Por área</p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {areas.map((a) => {
          const areaMeta = AREAS.find((m) => m.key === a.key);
          const Icon = areaMeta?.icon;
          return (
            <motion.div key={a.key} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/app/areas/${a.key}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-[var(--card-border-hover)]"
                style={{ ["--card-border-hover" as string]: a.color }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: `${a.color}1a`, color: a.color }}>
                      {Icon && <Icon className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{a.name}</p>
                      <p className="text-xs text-muted-foreground">
                        <AnimatedNumber value={a.ativos} format={(v) => Math.round(v).toString()} /> ativos
                      </p>
                    </div>
                  </div>
                </div>
                <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function AntesDeSeguir({
  checkin,
  verseOfDay,
  onChange,
}: {
  checkin: DashboardData["checkin"];
  verseOfDay: DashboardData["verseOfDay"];
  onChange: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Smile className="h-3.5 w-3.5" /> Antes de seguir
      </p>
      <div className="space-y-3.5">
        <CheckinBlock checkin={checkin} onChange={onChange} />
        {verseOfDay && (
          <div className="border-t border-border/70 pt-3.5">
            <p className="text-sm italic leading-relaxed">{verseOfDay.text ?? "Texto não cadastrado."}</p>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{verseOfDay.reference} (ARC)</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckinBlock({ checkin, onChange }: { checkin: DashboardData["checkin"]; onChange: () => void }) {
  const [editing, setEditing] = useState(!checkin);
  const current = MOODS.find((m) => m.key === checkin?.mood);

  async function pick(moodKey: string) {
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: moodKey }),
    });
    setEditing(false);
    onChange();
  }

  return !editing && current ? (
    <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
      <span className="text-lg">{current.emoji}</span>
      Como você está: <span className="font-medium text-foreground">{current.label}</span>
      <span className="text-xs">(mudar)</span>
    </button>
  ) : (
    <div>
      <p className="mb-1.5 text-xs text-muted-foreground">Como você está?</p>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((m) => (
          <button
            key={m.key}
            onClick={() => pick(m.key)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <span>{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string, now: Date): string {
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "agora";
  if (diffMins < 60) return `há ${diffMins}m`;
  if (diffHours < 24) return `há ${diffHours}h`;
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays}d`;

  const shortDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return shortDateFmt.format(date);
}

function AtividadeRecente({ items }: { items: DashboardData["atividade"] }) {
  const now = new Date();

  const getIcon = (type: string) => {
    switch (type) {
      case "transacao":
        return TrendingUp;
      case "conta":
        return Receipt;
      case "tarefa":
        return CheckCircle2;
      case "compromisso":
        return CalendarClock;
      case "divida":
        return HandCoins;
      default:
        return Activity;
    }
  };

  const getColor = (type: string): string => {
    switch (type) {
      case "transacao":
        return "text-blue-500";
      case "conta":
        return "text-orange-500";
      case "tarefa":
        return "text-emerald-500";
      case "compromisso":
        return "text-purple-500";
      case "divida":
        return "text-amber-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Activity className="h-4 w-4" /> Atividade recente
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const Icon = getIcon(item.type);
            const colorClass = getColor(item.type);
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.02 * i }}
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted/30"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.detail && <p className="text-xs text-muted-foreground truncate">{item.detail}</p>}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTime(item.at, now)}</span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
