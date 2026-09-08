"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarClock, Receipt, FolderKanban, Repeat, ArrowRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SectionCard } from "@/components/section-card";
import {
  AddCommitmentDialog,
  AddBillDialog,
  AddProjectDialog,
  EditCommitmentDialog,
  EditBillDialog,
} from "@/components/entry-dialogs";
import { DeleteButton } from "@/components/delete-button";
import { MediaLists } from "@/components/media-lists";
import { STATUS_LABEL } from "@/lib/projects";
import { notify } from "@/lib/toast";
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

  async function markPaid(b: Bill) {
    if (!confirm(`Marcar "${b.title}" (${currency(b.amount)}) como paga? Isso desconta o valor do saldo atual.`)) return;
    await fetch(`/api/bills/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    notify.success(`"${b.title}" paga — ${currency(b.amount)} descontado do saldo`);
    load();
  }

  async function markCommitmentDone(id: string) {
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
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
      <h1 className="mb-6 font-display text-[26px] font-semibold tracking-tight" style={{ color }}>
        {areaMeta?.name || area}
      </h1>

      <div className="space-y-5">
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard title="Compromissos" icon={CalendarClock} color={color} actions={<AddCommitmentDialog onAdded={load} defaultArea={area} />}>
            {data.commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada marcado ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.commitments.map((c) => {
                  const atrasado = !c.recurring && !c.done && new Date(c.startAt) < new Date();
                  return (
                    <li
                      key={c.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${atrasado ? "border border-rose-500/20 bg-rose-500/5" : "bg-muted/40"}`}
                    >
                      {!c.recurring && (
                        <Checkbox className="shrink-0" checked={!!c.done} onCheckedChange={() => markCommitmentDone(c.id)} />
                      )}
                      <span className="w-24 shrink-0 text-muted-foreground">
                        {dateFmt.format(new Date(c.startAt))} · {timeFmt.format(new Date(c.startAt))}
                      </span>
                      <span className={`min-w-0 flex-1 truncate font-medium ${c.done ? "text-muted-foreground line-through" : ""}`}>{c.title}</span>
                      {c.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                      {atrasado && <span className="shrink-0 text-xs font-medium text-rose-500">Atrasado</span>}
                      <EditCommitmentDialog commitment={c} onSaved={load} />
                      <DeleteButton label={c.title} onDelete={() => deleteCommitment(c.id)} />
                    </li>
                  );
                })}
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
                    <Checkbox className="shrink-0" onCheckedChange={() => markPaid(b)} />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {b.title}
                      {b.installments && <span className="ml-1 text-xs font-normal text-muted-foreground">({b.installmentNumber || 1}/{b.installments})</span>}
                    </span>
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
          <SectionCard
            title="Projetos"
            icon={FolderKanban}
            color={color}
            actions={
              <div className="flex items-center gap-1">
                <AddProjectDialog onAdded={load} defaultArea={area} />
                <Link href={`/app/projects?area=${area}`} className="flex items-center gap-1 px-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                  Ver todos <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            }
          >
            {data.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/app/projects/${p.id}`} className="block rounded-lg bg-muted/40 px-3 py-2 text-sm transition-colors hover:bg-muted">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground">
                        {STATUS_LABEL[p.status] || p.status}
                        {p.statusNote ? ` — ${p.statusNote}` : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </motion.div>

        {area === "pessoal" && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MediaLists />
          </motion.div>
        )}
      </div>
    </div>
  );
}
