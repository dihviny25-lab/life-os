"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CalendarClock, Receipt, FolderKanban, Archive, Repeat } from "lucide-react";
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

interface AreaData {
  commitments: Commitment[];
  bills: Bill[];
  projects: Project[];
}

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function AreaView({ area }: { area: string }) {
  const router = useRouter();
  const [data, setData] = useState<AreaData | null>(null);
  const [loading, setLoading] = useState(true);

  const areaMeta = AREAS.find((a) => a.key === area);
  const color = areaMeta?.color || "#71717a";

  const load = useCallback(async () => {
    const res = await fetch(`/api/areas/${area}`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [router, area]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function markPaid(id: string) {
    await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    load();
  }

  async function deleteCommitment(id: string) {
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteBill(id: string) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  }

  async function archiveProject(id: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    load();
  }

  async function deleteProject(id: string) {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando…
      </div>
    );
  }

  const upcomingBills = data.bills.filter((b) => !b.paid);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight" style={{ color }}>
        {areaMeta?.name || area}
      </h1>

      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard title="Compromissos" icon={CalendarClock} color={color} actions={<AddCommitmentDialog onAdded={load} defaultArea={area} />}>
            {data.commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada marcado ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.commitments.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">
                      {dateFmt.format(new Date(c.startAt))} · {timeFmt.format(new Date(c.startAt))}
                    </span>
                    <span className="flex-1 font-medium">{c.title}</span>
                    {c.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                    <EditCommitmentDialog commitment={c} onSaved={load} />
                    <DeleteButton label={c.title} onDelete={() => deleteCommitment(c.id)} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard title="Contas" icon={Receipt} color={color} actions={<AddBillDialog onAdded={load} defaultArea={area} />}>
            {upcomingBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada por aqui.</p>
            ) : (
              <ul className="space-y-1.5">
                {upcomingBills.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <Checkbox className="shrink-0" onCheckedChange={() => markPaid(b.id)} />
                    <span className="flex-1 font-medium">{b.title}</span>
                    <span className="text-muted-foreground">{dateFmt.format(new Date(b.dueDate))}</span>
                    <span className="font-semibold tabular-nums text-rose-500">{currency(b.amount)}</span>
                    <EditBillDialog bill={b} onSaved={load} />
                    <DeleteButton label={b.title} onDelete={() => deleteBill(b.id)} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard title="Projetos" icon={FolderKanban} color={color} actions={<AddProjectDialog onAdded={load} defaultArea={area} />}>
            {data.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
            ) : (
              <ul className="space-y-2">
                {data.projects.map((p) => (
                  <li key={p.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{p.name}</p>
                        {p.statusNote && <p className="text-muted-foreground">→ {p.statusNote}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <EditProjectDialog project={p} onSaved={load} />
                        <button onClick={() => archiveProject(p.id)} className="text-muted-foreground/60 transition-colors hover:text-foreground" aria-label={`Arquivar ${p.name}`}>
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                        <DeleteButton label={p.name} onDelete={() => deleteProject(p.id)} />
                      </div>
                    </div>
                    <ProjectTasks projectId={p.id} tasks={p.tasks} onChange={load} />
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>
      </div>
    </div>
  );
}
