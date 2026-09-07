"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, Wallet, FolderKanban, AlertTriangle, ArrowRight, Repeat, Smile } from "lucide-react";
import { MOODS } from "@/lib/moods";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/section-card";
import {
  AddCommitmentDialog,
  AddBillDialog,
  EditCommitmentDialog,
  EditBillDialog,
} from "@/components/entry-dialogs";
import { DeleteButton } from "@/components/delete-button";
import { AREAS } from "@/lib/areas";
import { STATUS_LABEL } from "@/lib/projects";
import type { Commitment, Bill, Project } from "@/lib/types";

interface ProjectAttention extends Project {
  progress: { total: number; done: number; percent: number; nextAction: { id: string; title: string } | null };
}

interface DashboardData {
  today: { commitments: Commitment[]; bills: Bill[] };
  upcomingCommitments: Commitment[];
  finance: { currentBalance: number; committed: number; free: number; envelopes: { name: string; allocated: number }[] };
  projectsAttention: ProjectAttention[];
  projectsTotal: number;
  dev: { alerts: number };
  verseOfDay: { reference: string; text: string | null } | null;
  checkin: { mood: string } | null;
}

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const label = weekdayFmt.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

const financasColor = AREAS.find((a) => a.key === "financas")!.color;

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-[26px] font-semibold italic tracking-tight">O que precisa da minha atenção?</h1>

      <div className="space-y-5">
        {/* Prioridade 1: o que é urgente agora e o dinheiro. */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <AgendaSection data={data} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <FinanceSection finance={data.finance} />
        </motion.div>

        {/* Prioridade 2: projetos, agrupados em vez de espalhados em cards repetidos. */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <ProjectsOverviewSection data={data} />
        </motion.div>

        {/* Ritual do dia — calmo, não é urgência, por isso fica por último. */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <DailyRitualSection data={data} onChange={load} />
        </motion.div>
      </div>
    </div>
  );
}

function AgendaSection({ data, onChange }: { data: DashboardData; onChange: () => void }) {
  const { commitments, bills } = data.today;
  const upcoming = data.upcomingCommitments;
  const empty = commitments.length === 0 && bills.length === 0 && upcoming.length === 0;

  async function markPaid(id: string) {
    await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    onChange();
  }

  async function deleteCommitment(id: string) {
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
    onChange();
  }

  async function deleteBill(id: string) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <SectionCard
      title="Agenda"
      icon={Sun}
      color="#f59e0b"
      actions={
        <div className="flex gap-1">
          <AddCommitmentDialog onAdded={onChange} />
          <AddBillDialog onAdded={onChange} />
        </div>
      }
    >
      {empty ? (
        <p className="text-sm text-muted-foreground">Nada marcado.</p>
      ) : (
        <div className="space-y-4">
          {(commitments.length > 0 || bills.length > 0) && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Hoje</p>
              <ul className="space-y-1.5">
                {commitments.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="w-12 shrink-0 tabular-nums text-muted-foreground">{timeFmt.format(new Date(c.startAt))}</span>
                    <span className="flex-1 font-medium">{c.title}</span>
                    {c.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                    <EditCommitmentDialog commitment={c} onSaved={onChange} />
                    <DeleteButton label={c.title} onDelete={() => deleteCommitment(c.id)} />
                  </li>
                ))}
                {bills.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm">
                    <Checkbox className="shrink-0" onCheckedChange={() => markPaid(b.id)} />
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span className="flex-1 font-medium">Conta {b.title.toLowerCase()} vence hoje</span>
                    <EditBillDialog bill={b} onSaved={onChange} />
                    <DeleteButton label={b.title} onDelete={() => deleteBill(b.id)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcoming.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Próximos</p>
              <ul className="space-y-1.5">
                {upcoming.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="w-28 shrink-0 text-muted-foreground">
                      {dayLabel(c.startAt)} {timeFmt.format(new Date(c.startAt))}
                    </span>
                    <span className="flex-1 font-medium">{c.title}</span>
                    {c.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                    <EditCommitmentDialog commitment={c} onSaved={onChange} />
                    <DeleteButton label={c.title} onDelete={() => deleteCommitment(c.id)} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

function DailyRitualSection({ data, onChange }: { data: DashboardData; onChange: () => void }) {
  if (!data.verseOfDay && !data.checkin) return null;
  return (
    <SectionCard title="Antes de seguir" icon={Smile} color="#f59e0b">
      <div className="space-y-4">
        <CheckinBlock checkin={data.checkin} onChange={onChange} />
        {data.verseOfDay && (
          <div className="border-t border-border/70 pt-3.5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Versículo do dia</p>
            <p className="text-sm italic leading-relaxed">{data.verseOfDay.text ?? "Texto não cadastrado."}</p>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{data.verseOfDay.reference} (ARC)</p>
          </div>
        )}
      </div>
    </SectionCard>
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
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">Como você está?</p>
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

function FinanceSection({ finance }: { finance: DashboardData["finance"] }) {
  return (
    <SectionCard title="Financeiro" icon={Wallet} color={financasColor}>
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Disponível de verdade</span>
          <p className={`font-display text-3xl font-semibold tabular-nums ${finance.free >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
            {currency(finance.free)}
          </p>
        </div>
        <div className="border-t border-border/70 pt-2.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Já comprometido</span>
            <span className="font-medium tabular-nums text-muted-foreground">{currency(finance.committed)}</span>
          </div>
          {finance.envelopes.length > 0 && (
            <ul className="mt-1.5 space-y-1 border-l border-border/70 pl-2.5">
              {finance.envelopes.map((e) => (
                <li key={e.name} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{e.name}</span>
                  <span className="tabular-nums">{currency(e.allocated)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link
          href="/app/areas/financas"
          className="mt-1 inline-flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: financasColor }}
        >
          Abrir financeiro <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </SectionCard>
  );
}

const prazoFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function ProjectsOverviewSection({ data }: { data: DashboardData }) {
  const { dev, projectsAttention, projectsTotal } = data;

  return (
    <SectionCard
      title="Projetos que precisam de atenção"
      icon={FolderKanban}
      color="#71717a"
      actions={
        <Link href="/app/projects" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          Ver todos ({projectsTotal})
        </Link>
      }
    >
      {dev.alerts > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {dev.alerts} {dev.alerts === 1 ? "deploy com problema" : "deploys com problema"}
        </div>
      )}
      {projectsAttention.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada precisando de atenção agora.</p>
      ) : (
        <ul className="space-y-2">
          {projectsAttention.map((p) => {
            const areaMeta = AREAS.find((a) => a.key === p.area);
            return (
              <li key={p.id}>
                <Link href={`/app/projects/${p.id}`} className="block rounded-lg bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <span className="shrink-0 text-xs" style={{ color: areaMeta?.color }}>
                      {areaMeta?.name || p.area}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    {p.status === "esperando" || p.status === "bloqueado" ? (
                      <>
                        {STATUS_LABEL[p.status]}
                        {p.esperandoMotivo ? ` — ${p.esperandoMotivo}` : ""}
                      </>
                    ) : p.progress.nextAction ? (
                      <>→ {p.progress.nextAction.title}</>
                    ) : (
                      "Sem próxima ação definida"
                    )}
                    {p.prazo && <span className="ml-1.5 text-xs text-muted-foreground/70">· {prazoFmt.format(new Date(p.prazo))}</span>}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
