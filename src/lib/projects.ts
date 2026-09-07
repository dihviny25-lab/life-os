// Deriva "próxima ação" e progresso a partir das tarefas — não é um campo
// salvo à parte, então nunca fica desatualizado em relação à checklist real.

interface TaskLike {
  id: string;
  title: string;
  done: boolean;
  order: number;
  stageId: string | null;
  createdAt: Date | string;
}

interface StageLike {
  id: string;
  order: number;
}

export function orderTasks<T extends TaskLike>(tasks: T[], stages: StageLike[]): T[] {
  const stageOrder = new Map(stages.map((s) => [s.id, s.order]));
  return [...tasks].sort((a, b) => {
    const sa = a.stageId ? (stageOrder.get(a.stageId) ?? 0) : -1;
    const sb = b.stageId ? (stageOrder.get(b.stageId) ?? 0) : -1;
    if (sa !== sb) return sa - sb;
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function computeProjectProgress<T extends TaskLike>(tasks: T[], stages: StageLike[]) {
  const ordered = orderTasks(tasks, stages);
  const total = ordered.length;
  const done = ordered.filter((t) => t.done).length;
  const nextAction = ordered.find((t) => !t.done) ?? null;
  return {
    total,
    done,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    nextAction: nextAction ? { id: nextAction.id, title: nextAction.title } : null,
  };
}

export const STATUS_ORDER = ["ativo", "bloqueado", "esperando", "planejado", "concluido"];

export const STATUS_LABEL: Record<string, string> = {
  planejado: "Planejado",
  ativo: "Ativo",
  esperando: "Esperando",
  bloqueado: "Bloqueado",
  concluido: "Concluído",
};

export const PRIORITY_LABEL: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};
