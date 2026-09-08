"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AddProjectDialog } from "@/components/entry-dialogs";
import { AREAS } from "@/lib/areas";
import { STATUS_LABEL } from "@/lib/projects";
import type { Project } from "@/lib/types";

interface ProjectWithProgress extends Project {
  progress: { total: number; done: number; percent: number; nextAction: { id: string; title: string } | null };
}

const STATUS_FILTERS = [
  { value: "", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "esperando", label: "Esperando" },
  { value: "bloqueado", label: "Bloqueados" },
  { value: "planejado", label: "Planejados" },
  { value: "concluido", label: "Concluídos" },
];

const prazoFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function ProjectsHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [area, setArea] = useState(searchParams.get("area") || "");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (area) params.set("area", area);
    const res = await fetch(`/api/projects?${params.toString()}`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setProjects(json.projects || []);
    setLoading(false);
  }, [router, status, area]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">O que estou tentando fazer avançar?</p>
        </div>
        <AddProjectDialog onAdded={load} />
      </div>

      <div className="mb-5 space-y-2.5">
        <Pills options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <Pills
          options={[{ value: "", label: "Todas as áreas" }, ...AREAS.map((a) => ({ value: a.key, label: a.name }))]}
          value={area}
          onChange={setArea}
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum projeto por aqui.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <ProjectCard project={p} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            value === o.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-transparent text-muted-foreground hover:bg-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectWithProgress }) {
  const areaMeta = AREAS.find((a) => a.key === p.area);
  return (
    <Link
      href={`/app/projects/${p.id}`}
      className="block rounded-xl border border-border bg-card p-4 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-colors hover:border-primary/40"
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="font-medium">{p.name}</p>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${areaMeta?.color || "#71717a"}1a`, color: areaMeta?.color || "#71717a" }}>
          {areaMeta?.name || p.area}
        </span>
      </div>
      <p className="mb-2.5 text-xs text-muted-foreground">
        {STATUS_LABEL[p.status] || p.status}
        {p.status === "esperando" && p.esperandoMotivo ? ` · ${p.esperandoMotivo}` : ""}
        {" · "}
        {p.prazo ? prazoFmt.format(new Date(p.prazo)) : "sem prazo definido"}
      </p>

      {p.progress.nextAction ? (
        <p className="mb-2 text-xs">
          <span className="text-muted-foreground">Próxima ação: </span>
          <span className="font-medium">{p.progress.nextAction.title}</span>
        </p>
      ) : p.progress.total > 0 ? (
        <p className="mb-2 text-xs text-emerald-500">Todas as etapas concluídas</p>
      ) : (
        <p className="mb-2 text-xs text-muted-foreground">Sem etapas cadastradas ainda</p>
      )}

      {p.progress.total > 0 && (
        <div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress.percent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {p.progress.done} de {p.progress.total} etapas concluídas
          </p>
        </div>
      )}
    </Link>
  );
}
