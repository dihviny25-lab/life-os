"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sun, CalendarClock, Wallet, FolderKanban, Church, Code2, AlertTriangle, ArrowRight, Check, Archive, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/section-card";
import {
  AddCommitmentDialog,
  AddBillDialog,
  AddProjectDialog,
  EditCommitmentDialog,
  EditBillDialog,
  EditProjectDialog,
} from "@/components/entry-dialogs";
import { ProjectTasks } from "@/components/project-tasks";
import { DeleteButton } from "@/components/delete-button";
import { AREAS } from "@/lib/areas";
import type { Commitment, Bill, Project } from "@/lib/types";

interface DashboardData {
  today: { commitments: Commitment[]; bills: Bill[] };
  upcomingCommitments: Commitment[];
  finance: { currentBalance: number; committed: number; free: number };
  projects: Project[];
  church: Project[];
  dev: { needsDecision: number; alerts: number };
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
const igrejaColor = AREAS.find((a) => a.key === "igreja_ministerio")!.color;
const devColor = AREAS.find((a) => a.key === "desenvolvimento")!.color;

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
      <h1 className="mb-6 text-2xl font-bold tracking-tight">O que precisa da minha atenção?</h1>

      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <TodaySection data={data} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <UpcomingSection commitments={data.upcomingCommitments} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <FinanceSection finance={data.finance} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ProjectsSection title="Projetos" icon={FolderKanban} color="#71717a" projects={data.projects} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ProjectsSection title="Igreja & Ministério" icon={Church} color={igrejaColor} projects={data.church} onChange={load} defaultArea="igreja_ministerio" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <DevSection dev={data.dev} />
        </motion.div>
      </div>
    </div>
  );
}

function TodaySection({ data, onChange }: { data: DashboardData; onChange: () => void }) {
  const { commitments, bills } = data.today;
  const empty = commitments.length === 0 && bills.length === 0;

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
      title="Hoje"
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
        <p className="text-sm text-muted-foreground">Nada marcado para hoje.</p>
      ) : (
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
      )}
    </SectionCard>
  );
}

function UpcomingSection({ commitments, onChange }: { commitments: Commitment[]; onChange: () => void }) {
  async function deleteCommitment(id: string) {
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <SectionCard title="Próximos compromissos" icon={CalendarClock} color="#0ea5e9">
      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum compromisso futuro marcado.</p>
      ) : (
        <ul className="space-y-1.5">
          {commitments.map((c) => (
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
      )}
    </SectionCard>
  );
}

function FinanceSection({ finance }: { finance: DashboardData["finance"] }) {
  return (
    <SectionCard title="Financeiro" icon={Wallet} color={financasColor}>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Disponível de verdade</span>
          <span className={`text-base font-bold tabular-nums ${finance.free >= 0 ? "text-emerald-600" : "text-rose-500"}`}>{currency(finance.free)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Já comprometido</span>
          <span className="font-medium tabular-nums text-muted-foreground">{currency(finance.committed)}</span>
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

function ProjectsSection({
  title,
  icon,
  color,
  projects,
  onChange,
  defaultArea,
}: {
  title: string;
  icon: React.ComponentProps<typeof SectionCard>["icon"];
  color: string;
  projects: Project[];
  onChange: () => void;
  defaultArea?: string;
}) {
  async function archive(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    onChange();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <SectionCard title={title} icon={icon} color={color} actions={<AddProjectDialog onAdded={onChange} defaultArea={defaultArea} />}>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  {p.statusNote && <p className="text-muted-foreground">→ {p.statusNote}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <EditProjectDialog project={p} onSaved={onChange} />
                  <button onClick={() => archive(p.id)} className="text-muted-foreground/60 transition-colors hover:text-foreground" aria-label={`Arquivar ${p.name}`}>
                    <Archive className="h-3.5 w-3.5" />
                  </button>
                  <DeleteButton label={p.name} onDelete={() => deleteProject(p.id)} />
                </div>
              </div>
              <ProjectTasks projectId={p.id} tasks={p.tasks} onChange={onChange} />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function DevSection({ dev }: { dev: DashboardData["dev"] }) {
  return (
    <SectionCard title="Desenvolvimento" icon={Code2} color={devColor}>
      {dev.needsDecision === 0 && dev.alerts === 0 ? (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-emerald-500" /> Nada pendente.
        </p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {dev.needsDecision > 0 && (
            <li className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {dev.needsDecision} {dev.needsDecision === 1 ? "projeto precisa" : "projetos precisam"} de decisão
            </li>
          )}
          {dev.alerts > 0 && (
            <li className="flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {dev.alerts} {dev.alerts === 1 ? "deploy com problema" : "deploys com problema"}
            </li>
          )}
        </ul>
      )}
    </SectionCard>
  );
}
