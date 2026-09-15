"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarRange,
  Check,
  ChevronDown,
  CircleDollarSign,
  Gauge,
  HeartHandshake,
  ListChecks,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Scale,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SectionCard } from "@/components/section-card";
import {
  ADJUSTMENT_OBJECTIVES,
  CENTRAL_RHYTHMS,
  PRIORITY_ACTIONS,
} from "@/lib/adjustment-plan";
import { STATUS_LABEL } from "@/lib/projects";
import { notify } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface PlanTask {
  id: string;
  title: string;
  done: boolean;
}

interface PlanStage {
  id: string;
  key: string;
  title: string;
  summary: string;
  objective: "financas" | "desenvolvimento" | "presenca";
  order: number;
  progress: { done: number; total: number; percent: number };
  tasks: PlanTask[];
}

interface DevelopmentProject {
  id: string;
  name: string;
  status: string;
  prioridade: string;
  prazo: string | null;
}

interface PlanSystem {
  weeklyBaseIncome: number;
  weeklyBudgetTotal: number;
  developmentWipLimit: number;
  activeDevelopmentCount: number;
  developmentProjects: DevelopmentProject[];
}

type PlanResponse =
  | { initialized: false; system: PlanSystem }
  | {
      initialized: true;
      plan: {
        id: string;
        name: string;
        deadline: string | null;
        progress: { done: number; total: number; percent: number };
        stages: PlanStage[];
        rules: { id: string; body: string }[];
      };
      system: PlanSystem;
    };

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function AdjustmentPlan() {
  const router = useRouter();
  const [data, setData] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);
  const [pendingTask, setPendingTask] = useState<string | null>(null);
  const [openStage, setOpenStage] = useState<number | null>(null);
  const initialStageSet = useRef(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/adjustment-plan");
    if (response.status === 401) {
      router.replace("/login");
      return;
    }
    if (!response.ok) throw new Error("Não foi possível carregar o plano");
    const result = (await response.json()) as PlanResponse;
    setData(result);
    setLoading(false);

    if (result.initialized && !initialStageSet.current) {
      const firstIncomplete = result.plan.stages.find((stage) => stage.progress.percent < 100);
      setOpenStage(firstIncomplete?.order ?? 0);
      initialStageSet.current = true;
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch(() => {
        notify.error("Não foi possível carregar o plano de ajuste");
        setLoading(false);
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function initializePlan() {
    setInitializing(true);
    try {
      const response = await fetch("/api/adjustment-plan", { method: "POST" });
      if (!response.ok) throw new Error();
      await load();
      notify.success("Plano de 90 dias ativado");
    } catch {
      notify.error("Não foi possível ativar o plano");
    } finally {
      setInitializing(false);
    }
  }

  function retryLoad() {
    setLoading(true);
    load().catch(() => {
      notify.error("Não foi possível carregar o plano de ajuste");
      setLoading(false);
    });
  }

  async function toggleTask(task: PlanTask) {
    if (!data?.initialized || pendingTask) return;
    const previous = data;
    const nextDone = !task.done;
    setPendingTask(task.id);
    setData(updateTaskInPlan(data, task.id, nextDone));

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: nextDone }),
      });
      if (!response.ok) throw new Error();
    } catch {
      setData(previous);
      notify.error("Não foi possível atualizar a ação");
    } finally {
      setPendingTask(null);
    }
  }

  if (loading) return <PlanSkeleton />;
  if (!data) return <PlanError onRetry={retryLoad} />;
  if (!data.initialized) return <PlanSetup system={data.system} loading={initializing} onInitialize={initializePlan} />;

  return (
    <PlanWorkspace
      data={data}
      pendingTask={pendingTask}
      openStage={openStage}
      onOpenStage={setOpenStage}
      onToggleTask={toggleTask}
    />
  );
}

function PlanWorkspace({
  data,
  pendingTask,
  openStage,
  onOpenStage,
  onToggleTask,
}: {
  data: Extract<PlanResponse, { initialized: true }>;
  pendingTask: string | null;
  openStage: number | null;
  onOpenStage: (order: number | null) => void;
  onToggleTask: (task: PlanTask) => void;
}) {
  const { plan, system } = data;
  const allTasks = useMemo(() => plan.stages.flatMap((stage) => stage.tasks), [plan.stages]);
  const taskByTitle = useMemo(() => new Map(allTasks.map((task) => [task.title, task])), [allTasks]);
  const priorities = PRIORITY_ACTIONS.map((title) => taskByTitle.get(title)).filter((task): task is PlanTask => Boolean(task));
  const nextAction = priorities.find((task) => !task.done) ?? allTasks.find((task) => !task.done) ?? null;
  const activeDevelopment = system.developmentProjects.filter((project) => project.status === "ativo");
  const overWip = system.activeDevelopmentCount > system.developmentWipLimit;
  const weeklyGap = system.weeklyBaseIncome - system.weeklyBudgetTotal;

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Target className="h-4 w-4" /> Ciclo de 90 dias
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Plano de ajuste</h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Menos frentes abertas, mais margem financeira e presença real com quem importa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/projects/${plan.id}`}>Abrir projeto completo</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app">Voltar para Hoje</Link>
          </Button>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-7 overflow-hidden rounded-xl border border-border bg-card"
      >
        <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">Progresso do ciclo</p>
              <p className="text-sm text-muted-foreground">
                {plan.progress.done} de {plan.progress.total} ações
              </p>
            </div>
            <Progress value={plan.progress.percent} className="h-2.5" />
            <p className="mt-2 text-sm text-muted-foreground">
              {plan.deadline ? `Revisão final em ${shortDate.format(new Date(plan.deadline))}` : "Sem data final definida"}
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-primary/15 text-xl font-semibold text-primary">
            {plan.progress.percent}%
          </div>
        </div>
        {nextAction && (
          <div className="border-t border-border bg-primary/[0.03] px-5 py-3">
            <p className="mb-1 text-sm font-medium text-muted-foreground">Próxima ação</p>
            <TaskRow task={nextAction} pending={pendingTask === nextAction.id} onToggle={onToggleTask} compact />
          </div>
        )}
      </motion.section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        {ADJUSTMENT_OBJECTIVES.map((objective, index) => {
          const relevantStages = plan.stages.filter((stage) => stage.objective === objective.key);
          const total = relevantStages.reduce((sum, stage) => sum + stage.progress.total, 0);
          const done = relevantStages.reduce((sum, stage) => sum + stage.progress.done, 0);
          const percent = total === 0 ? 0 : Math.round((done / total) * 100);
          return (
            <motion.div
              key={objective.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-xl border border-border bg-card p-4"
              style={{ borderTop: `3px solid ${objective.color}` }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold leading-tight">{objective.title}</h2>
                <span className="shrink-0 text-sm font-semibold" style={{ color: objective.color }}>{percent}%</span>
              </div>
              <p className="min-h-14 text-sm leading-relaxed text-muted-foreground">{objective.description}</p>
              <Progress value={percent} className="mt-4 h-1.5" />
            </motion.div>
          );
        })}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <SectionCard title="Começar por aqui" icon={ListChecks} color="#f59e0b">
          <div className="space-y-2">
            {priorities.map((task) => (
              <TaskRow key={task.id} task={task} pending={pendingTask === task.id} onToggle={onToggleTask} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Limites reais" icon={Gauge} color={overWip ? "#f43f5e" : "#10b981"}>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Desenvolvimento ativo</span>
                <span className={cn("font-semibold", overWip && "text-rose-500")}>
                  {system.activeDevelopmentCount}/{system.developmentWipLimit}
                </span>
              </div>
              <Progress value={Math.min(100, (system.activeDevelopmentCount / system.developmentWipLimit) * 100)} className="h-1.5" />
              {overWip && (
                <p className="mt-2 flex gap-1.5 text-sm text-rose-500">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Há frentes demais para o limite definido.
                </p>
              )}
              {activeDevelopment.length > 0 && (
                <div className="mt-2 space-y-1">
                  {activeDevelopment.slice(0, 4).map((project) => (
                    <Link key={project.id} href={`/app/projects/${project.id}`} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                      <span className="truncate">{project.name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
              {activeDevelopment.length === 0 && (
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma frente está marcada como ativa.</p>
              )}
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Base semanal</span>
                <span className="font-semibold">{currency.format(system.weeklyBaseIncome)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Orçamentos semanais cadastrados</span>
                <span className="font-semibold">{currency.format(system.weeklyBudgetTotal)}</span>
              </div>
              <p className={cn("mt-2 text-sm", weeklyGap < 0 ? "text-rose-500" : "text-muted-foreground")}>
                {weeklyGap < 0
                  ? `O cadastro semanal supera a base em ${currency.format(Math.abs(weeklyGap))}.`
                  : `${currency.format(weeklyGap)} sem destino nos orçamentos semanais; as contas mensais continuam separadas.`}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold">Os 10 ajustes</h2>
            <p className="mt-1 text-sm text-muted-foreground">Abra um eixo por vez e conclua ações reais.</p>
          </div>
          <span className="text-sm text-muted-foreground">{plan.progress.done}/{plan.progress.total}</span>
        </div>
        <div className="space-y-2">
          {plan.stages.map((stage) => {
            const isOpen = openStage === stage.order;
            return (
              <div key={stage.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => onOpenStage(isOpen ? null : stage.order)}
                  className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/40"
                  aria-expanded={isOpen}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {stage.order + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{stage.title}</span>
                    <span className="mt-0.5 block line-clamp-2 text-sm text-muted-foreground">{stage.summary}</span>
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{stage.progress.done}/{stage.progress.total}</span>
                  <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t border-border px-4 py-3 sm:px-5">
                    <div className="space-y-1.5">
                      {stage.tasks.map((task) => (
                        <TaskRow key={task.id} task={task} pending={pendingTask === task.id} onToggle={onToggleTask} compact />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="Ritmos centrais" icon={CalendarRange} color="#0ea5e9">
          <div className="space-y-3">
            {CENTRAL_RHYTHMS.map((rhythm) => {
              const task = taskByTitle.get(rhythm.task);
              return (
                <div key={rhythm.title} className="rounded-lg bg-muted/40 p-3">
                  <div className="flex items-start gap-2.5">
                    {task ? (
                      <Checkbox
                        checked={task.done}
                        disabled={pendingTask === task.id}
                        onCheckedChange={() => onToggleTask(task)}
                        aria-label={`Marcar ${rhythm.title}`}
                        className="mt-0.5"
                      />
                    ) : <span className="mt-1 h-4 w-4 rounded border border-border" />}
                    <div>
                      <p className={cn("font-medium", task?.done && "text-muted-foreground line-through")}>{rhythm.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{rhythm.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Regras de funcionamento" icon={Scale} color="#8b5cf6">
          <ol className="space-y-2.5">
            {plan.rules.map((rule, index) => (
              <li key={rule.id} className="flex gap-3 text-sm leading-relaxed">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-semibold text-violet-500">{index + 1}</span>
                <span>{rule.body}</span>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <QuickLink href="/app/areas/financas" icon={CircleDollarSign} title="Revisar finanças" detail="Base, contas e orçamento semanal" />
        <QuickLink href="/app/projects?area=desenvolvimento" icon={BriefcaseBusiness} title="Classificar projetos" detail="Ativos, manutenção e espera" />
        <QuickLink href="/app/areas/familia" icon={HeartHandshake} title="Proteger presença" detail="Família antes do tempo que sobrar" />
      </div>
    </div>
  );
}

function TaskRow({ task, pending, onToggle, compact = false }: { task: PlanTask; pending: boolean; onToggle: (task: PlanTask) => void; compact?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg hover:bg-muted/50", compact ? "px-2 py-2.5" : "p-3", pending && "cursor-wait opacity-70")}>
      <Checkbox checked={task.done} disabled={pending} onCheckedChange={() => onToggle(task)} className="mt-0.5" />
      <span className={cn("text-sm leading-relaxed", task.done && "text-muted-foreground line-through")}>{task.title}</span>
      {pending && <Loader2 className="ml-auto mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
    </label>
  );
}

function QuickLink({ href, icon: Icon, title, detail }: { href: string; icon: LucideIcon; title: string; detail: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:border-primary/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{detail}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function PlanSetup({ system, loading, onInitialize }: { system: PlanSystem; loading: boolean; onInitialize: () => void }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center px-4 py-10 sm:px-6">
      <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-gradient-to-br from-primary/10 via-transparent to-sky-500/10 p-6 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Target className="h-6 w-6" />
          </span>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Plano de ajuste — 90 dias</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Um único plano para reduzir frentes abertas, estabilizar as finanças, transformar desenvolvimento em renda e recuperar presença com a família.
          </p>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            {ADJUSTMENT_OBJECTIVES.map((objective) => (
              <div key={objective.key} className="rounded-lg border border-border p-3" style={{ borderTopColor: objective.color, borderTopWidth: 3 }}>
                <p className="font-medium leading-tight">{objective.title}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
            O plano será criado usando Projeto, Etapas, Tarefas e Decisões que já existem. Nenhuma nova estrutura de banco será necessária.
          </div>
          {system.activeDevelopmentCount > system.developmentWipLimit && (
            <p className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-sm text-rose-500">
              <AlertTriangle className="h-4 w-4 shrink-0" /> Hoje existem {system.activeDevelopmentCount} projetos de desenvolvimento ativos para um limite de {system.developmentWipLimit}.
            </p>
          )}
          <Button onClick={onInitialize} disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Ativando plano</> : <><Check className="mr-2 h-4 w-4" />Ativar plano de 90 dias</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6">
      <div className="skeleton h-9 w-64 rounded-lg" />
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="grid gap-3 md:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="skeleton h-36 rounded-xl" />)}
      </div>
      <div className="skeleton h-72 w-full rounded-xl" />
    </div>
  );
}

function PlanError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
      <div className="w-full rounded-xl border border-border bg-card p-6 text-center">
        <LockKeyhole className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-xl font-semibold">O plano não carregou</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente. Nenhuma informação foi alterada.</p>
        <Button onClick={onRetry} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function updateTaskInPlan(
  data: Extract<PlanResponse, { initialized: true }>,
  taskId: string,
  done: boolean,
): Extract<PlanResponse, { initialized: true }> {
  const stages = data.plan.stages.map((stage) => {
    const tasks = stage.tasks.map((task) => task.id === taskId ? { ...task, done } : task);
    const completed = tasks.filter((task) => task.done).length;
    return {
      ...stage,
      tasks,
      progress: {
        done: completed,
        total: tasks.length,
        percent: tasks.length === 0 ? 0 : Math.round((completed / tasks.length) * 100),
      },
    };
  });
  const allTasks = stages.flatMap((stage) => stage.tasks);
  const completed = allTasks.filter((task) => task.done).length;

  return {
    ...data,
    plan: {
      ...data.plan,
      stages,
      progress: {
        done: completed,
        total: allTasks.length,
        percent: allTasks.length === 0 ? 0 : Math.round((completed / allTasks.length) * 100),
      },
    },
  };
}
