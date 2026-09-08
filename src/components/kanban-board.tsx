"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AREAS } from "@/lib/areas";
import { STATUS_LABEL } from "@/lib/projects";
import type { Project } from "@/lib/types";

interface ProjectWithProgress extends Project {
  progress: { total: number; done: number; percent: number; nextAction: { id: string; title: string } | null };
}

const COLUMNS = ["planejado", "ativo", "esperando", "bloqueado", "concluido"];

export function KanbanBoard({ projects, onChange }: { projects: ProjectWithProgress[]; onChange: () => void }) {
  async function moveTo(id: string, status: string) {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    onChange();
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {COLUMNS.map((status) => {
        const columnProjects = projects.filter((p) => p.status === status);
        return (
          <div key={status} className="w-[260px] shrink-0">
            <div className="mb-2 flex items-center justify-between px-0.5">
              <p className="text-xs font-semibold text-muted-foreground">{STATUS_LABEL[status]}</p>
              <span className="text-xs text-muted-foreground/70">{columnProjects.length}</span>
            </div>
            <div className="space-y-2">
              {columnProjects.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground/60">Vazio</div>
              ) : (
                columnProjects.map((p) => <KanbanCard key={p.id} project={p} onMove={moveTo} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ project: p, onMove }: { project: ProjectWithProgress; onMove: (id: string, status: string) => void }) {
  const areaMeta = AREAS.find((a) => a.key === p.area);

  return (
    <motion.div layout className="rounded-lg border border-border bg-card p-3 text-sm">
      <Link href={`/app/projects/${p.id}`} className="block">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: areaMeta?.color || "#71717a" }} />
          <p className="min-w-0 flex-1 truncate font-medium">{p.name}</p>
        </div>
        {p.progress.nextAction ? (
          <p className="mb-2 truncate text-xs text-muted-foreground">→ {p.progress.nextAction.title}</p>
        ) : p.progress.total > 0 ? (
          <p className="mb-2 text-xs text-emerald-500">Todas as etapas concluídas</p>
        ) : (
          <p className="mb-2 text-xs text-muted-foreground/60">Sem etapas ainda</p>
        )}
        {p.progress.total > 0 && (
          <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress.percent}%` }} />
          </div>
        )}
      </Link>
      <Select value={p.status} onValueChange={(v) => onMove(p.id, v)}>
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMNS.map((s) => (
            <SelectItem key={s} value={s}>
              Mover para {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </motion.div>
  );
}
