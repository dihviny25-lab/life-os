"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ListChecks, CalendarClock, AlertTriangle, Clock, Smile } from "lucide-react";
import { MOODS } from "@/lib/moods";
import { AREAS } from "@/lib/areas";
import { AnimatedNumber } from "@/components/animated-number";

interface FocoItem {
  label: string;
  detail: string;
  href: string;
  kind: "alerta" | "evento";
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
        <FocoDoDia items={data.foco} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5">
        <ResumoGeral resumo={data.resumo} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-6">
        <PorArea areas={data.porArea} />
      </motion.div>

      {(data.checkin !== undefined || data.verseOfDay) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
          <AntesDeSeguir checkin={data.checkin} verseOfDay={data.verseOfDay} onChange={load} />
        </motion.div>
      )}
    </div>
  );
}

function FocoDoDia({ items }: { items: FocoItem[] }) {
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
            >
              <Link
                href={item.href}
                className={`flex items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
                  item.kind === "alerta" ? "bg-rose-500/5 hover:bg-rose-500/10" : "bg-muted/40 hover:bg-muted"
                }`}
              >
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
    { label: "Pendentes", value: resumo.pendentes, icon: ListChecks, color: "#f59e0b" },
    { label: "Concluídas hoje", value: resumo.concluidasHoje, icon: CheckCircle2, color: "#10b981" },
    { label: "Próximos compromissos", value: resumo.proximosCompromissos, icon: CalendarClock, color: "#3b82f6" },
    { label: "Atrasadas", value: resumo.atrasadas, icon: AlertTriangle, color: "#f43f5e" },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Resumo geral</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((t) => (
          <motion.div
            key={t.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-lg border border-border bg-card p-3.5"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t.label}</span>
              <t.icon className="h-3.5 w-3.5 shrink-0" style={{ color: t.color }} />
            </div>
            <p className="font-display text-2xl font-semibold tabular-nums">
              <AnimatedNumber value={t.value} format={(v) => Math.round(v).toString()} />
            </p>
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
