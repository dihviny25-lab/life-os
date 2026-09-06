"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { notify } from "@/lib/toast";
import { AddCommitmentDialog, AddBillDialog, AddProjectDialog } from "@/components/entry-dialogs";
import type { Commitment, Bill, Project } from "@/lib/types";

interface DashboardData {
  today: { commitments: Commitment[]; bills: Bill[] };
  upcomingCommitments: Commitment[];
  finance: { availableBalance: number; billsUntilSunday: number; projectedAfterCommitments: number };
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-xl font-bold">O que precisa da minha atenção?</h1>

      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <TodaySection data={data} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <UpcomingSection commitments={data.upcomingCommitments} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <FinanceSection finance={data.finance} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <ProjectsSection title="PROJETOS" projects={data.projects} onChange={load} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ProjectsSection title="IGREJA & MINISTÉRIO" projects={data.church} onChange={load} defaultArea="igreja_ministerio" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <DevSection dev={data.dev} />
        </motion.div>
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
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

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>Hoje</SectionTitle>
        <div className="flex gap-1">
          <AddCommitmentDialog onAdded={onChange} />
          <AddBillDialog onAdded={onChange} />
        </div>
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground">Nada marcado para hoje.</p>
      ) : (
        <ul className="space-y-1.5">
          {commitments.map((c) => (
            <li key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-muted-foreground">{timeFmt.format(new Date(c.startAt))}</span>
              <span>{c.title}</span>
            </li>
          ))}
          {bills.map((b) => (
            <li key={b.id} className="flex items-center gap-3 text-sm">
              <Checkbox className="shrink-0" onCheckedChange={() => markPaid(b.id)} />
              <span className="font-bold text-rose-500">!</span>
              <span>Conta {b.title.toLowerCase()} vence hoje</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UpcomingSection({ commitments }: { commitments: Commitment[] }) {
  return (
    <section>
      <SectionTitle>Próximos compromissos</SectionTitle>
      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum compromisso futuro marcado.</p>
      ) : (
        <ul className="space-y-1.5">
          {commitments.map((c) => (
            <li key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-muted-foreground">
                {dayLabel(c.startAt)} {timeFmt.format(new Date(c.startAt))}
              </span>
              <span>{c.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FinanceSection({ finance, onChange }: { finance: DashboardData["finance"]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(finance.availableBalance));

  async function save() {
    const availableBalance = Number(value.replace(",", "."));
    if (Number.isNaN(availableBalance)) {
      notify.error("Valor inválido");
      return;
    }
    await fetch("/api/finance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableBalance }),
    });
    setEditing(false);
    onChange();
  }

  return (
    <section>
      <SectionTitle>Financeiro</SectionTitle>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span>Disponível esta semana</span>
          {editing ? (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-7 w-28 rounded-md border border-input bg-transparent px-2 text-right text-sm"
                inputMode="decimal"
              />
              <button className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground" onClick={save}>
                Salvar
              </button>
            </div>
          ) : (
            <button className="font-medium hover:underline" onClick={() => setEditing(true)}>
              {currency(finance.availableBalance)}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Contas até domingo</span>
          <span className="font-medium text-rose-500">{currency(finance.billsUntilSunday)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Previsto após compromissos</span>
          <span className={`font-medium ${finance.projectedAfterCommitments >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {currency(finance.projectedAfterCommitments)}
          </span>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({
  title,
  projects,
  onChange,
  defaultArea,
}: {
  title: string;
  projects: Project[];
  onChange: () => void;
  defaultArea?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        <AddProjectDialog onAdded={onChange} defaultArea={defaultArea} />
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="text-sm">
              <p className="font-medium">{p.name}</p>
              {p.statusNote && <p className="text-muted-foreground">→ {p.statusNote}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DevSection({ dev }: { dev: DashboardData["dev"] }) {
  if (dev.needsDecision === 0 && dev.alerts === 0) {
    return (
      <section>
        <SectionTitle>Desenvolvimento</SectionTitle>
        <p className="text-sm text-muted-foreground">Nada pendente.</p>
      </section>
    );
  }
  return (
    <section>
      <SectionTitle>Desenvolvimento</SectionTitle>
      <ul className="space-y-1 text-sm">
        {dev.needsDecision > 0 && (
          <li>
            {dev.needsDecision} {dev.needsDecision === 1 ? "projeto precisa" : "projetos precisam"} de decisão
          </li>
        )}
        {dev.alerts > 0 && (
          <li>
            {dev.alerts} {dev.alerts === 1 ? "deploy com problema" : "deploys com problema"}
          </li>
        )}
      </ul>
    </section>
  );
}
