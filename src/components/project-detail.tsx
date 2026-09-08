"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Check, Clock3, Archive, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditProjectDialog, EditBillDialog } from "@/components/entry-dialogs";
import { DeleteButton } from "@/components/delete-button";
import { AREAS } from "@/lib/areas";
import { STATUS_LABEL, PRIORITY_LABEL } from "@/lib/projects";
import { notify } from "@/lib/toast";
import type { Project } from "@/lib/types";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  order: number;
  stageId: string | null;
}
interface StageRow {
  id: string;
  name: string;
  order: number;
  tasks: TaskRow[];
}
interface NoteRow {
  id: string;
  body: string;
  createdAt: string;
}
interface CommitmentRow {
  id: string;
  title: string;
  startAt: string;
}
interface BillRow {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  area: string | null;
  recurring: string | null;
  installments: number | null;
  installmentNumber: number | null;
}
interface EnvelopeRow {
  id: string;
  name: string;
  allocated: number;
}
interface LinkRow {
  id: string;
  url: string;
  label: string | null;
}
interface Detail {
  project: Project;
  progress: { total: number; done: number; percent: number; nextAction: { id: string; title: string } | null };
  stages: StageRow[];
  tasksSemEtapa: TaskRow[];
  notes: NoteRow[];
  decisions: NoteRow[];
  commitments: CommitmentRow[];
  bills: BillRow[];
  envelopes: EnvelopeRow[];
  links: LinkRow[];
  financeiro: { orcamento: number | null; comprometido: number; gasto: number; guardado: number; faltaGuardar: number | null; disponivel: number | null };
}

export function ProjectDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.status === 404) {
      notify.error("Projeto não encontrado");
      router.replace("/app/projects");
      return;
    }
    setData(await res.json());
    setLoading(false);
  }, [router, id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTask(taskId: string, done: boolean) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done }),
    });
    load();
  }

  async function adiarTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: Date.now() }),
    });
    load();
  }

  async function deleteBill(billId: string) {
    await fetch(`/api/bills/${billId}`, { method: "DELETE" });
    load();
  }

  async function deleteProject() {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.replace("/app/projects");
  }

  async function archiveProject() {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: true }),
    });
    router.replace("/app/projects");
  }

  if (loading || !data) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  const { project: p, progress, stages, tasksSemEtapa, notes, decisions, commitments, bills, envelopes, links, financeiro } = data;
  const areaMeta = AREAS.find((a) => a.key === p.area);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/app/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Projetos
      </Link>

      <div className="mb-1 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight">{p.name}</h1>
        <div className="flex shrink-0 items-center gap-1.5">
          <EditProjectDialog project={p} onSaved={load} />
          <button onClick={archiveProject} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Arquivar ${p.name}`}>
            <Archive className="h-3.5 w-3.5" />
          </button>
          <DeleteButton label={p.name} onDelete={deleteProject} />
        </div>
      </div>
      <p className="mb-4 text-sm" style={{ color: areaMeta?.color }}>
        {areaMeta?.name || p.area} · {STATUS_LABEL[p.status] || p.status}
      </p>

      {p.objetivo && <p className="mb-5 rounded-lg bg-muted/40 p-3 text-sm italic text-muted-foreground">{p.objetivo}</p>}

      {/* Visão geral */}
      <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-4 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.25)] sm:grid-cols-3">
        <InfoField label="Status" value={STATUS_LABEL[p.status] || p.status} />
        <InfoField label="Área" value={areaMeta?.name || p.area} />
        <InfoField label="Prioridade" value={PRIORITY_LABEL[p.prioridade] || p.prioridade} />
        <InfoField label="Prazo" value={p.prazo ? dateFmt.format(new Date(p.prazo)) : "sem prazo"} />
        <InfoField label="Orçamento" value={p.orcamento != null ? currency(p.orcamento) : "—"} />
        <InfoField label="Progresso" value={`${progress.done}/${progress.total} etapas`} />
      </div>

      {/* Próxima ação */}
      <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Próxima ação</p>
        {progress.nextAction ? (
          <>
            <p className="mb-3 text-base font-medium">{progress.nextAction.title}</p>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 gap-1.5 px-2.5 text-xs" onClick={() => toggleTask(progress.nextAction!.id, true)}>
                <Check className="h-3.5 w-3.5" /> Concluir
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1.5 px-2.5 text-xs" onClick={() => adiarTask(progress.nextAction!.id)}>
                <Clock3 className="h-3.5 w-3.5" /> Adiar
              </Button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{progress.total > 0 ? "Todas as etapas concluídas." : "Adicione etapas abaixo para ter uma próxima ação."}</p>
        )}
      </div>

      {/* Etapas */}
      <Section title="Etapas">
        <div className="space-y-4">
          {stages.map((s) => (
            <StageBlock key={s.id} stage={s} projectId={id} onToggle={toggleTask} onChange={load} />
          ))}
          {tasksSemEtapa.length > 0 && (
            <StageBlock stage={{ id: "", name: "Geral", order: 0, tasks: tasksSemEtapa }} projectId={id} onToggle={toggleTask} onChange={load} />
          )}
          <AddStage projectId={id} onAdded={load} />
        </div>
      </Section>

      {/* Financeiro */}
      {(p.orcamento != null || bills.length > 0 || financeiro.gasto > 0) && (
        <Section title="Financeiro">
          <div className="space-y-1.5 text-sm">
            {p.orcamento != null && <Row label="Orçamento" value={currency(p.orcamento)} />}
            <Row label="Comprometido (contas)" value={currency(financeiro.comprometido)} valueClass="text-rose-500" />
            <Row label="Gasto (transações)" value={currency(financeiro.gasto)} valueClass="text-rose-500" />
            {financeiro.disponivel != null && <Row label="Disponível" value={currency(financeiro.disponivel)} bold valueClass={financeiro.disponivel >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"} />}
          </div>
          {bills.length > 0 && (
            <ul className="mt-3 space-y-1">
              {bills.map((b) => (
                <li key={b.id} className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{b.title}</span>
                  <span className="shrink-0">{currency(b.amount)}{b.paid && " · pago"}</span>
                  <span className="flex shrink-0 items-center">
                    <EditBillDialog bill={b} onSaved={load} />
                    <DeleteButton label={b.title} onDelete={() => deleteBill(b.id)} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* Guardado — envelope financeiro do projeto, separado do resto */}
      <Section title="Guardado">
        {p.metaContribuicao && (
          <p className="mb-2 text-xs text-muted-foreground">
            Meta: guardar {currency(p.metaContribuicao)} por {p.metaFrequencia === "mensal" ? "mês" : "semana"}
          </p>
        )}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Guardado até agora</span>
          <span className="font-semibold tabular-nums">{currency(financeiro.guardado)}</span>
        </div>
        {financeiro.faltaGuardar != null && (
          <div className="mb-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${p.orcamento ? Math.min(100, (financeiro.guardado / p.orcamento) * 100) : 0}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Falta guardar: {currency(financeiro.faltaGuardar)}</p>
          </div>
        )}
        <EnvelopesList items={envelopes} projectId={id} onChange={load} />
      </Section>

      {/* Links */}
      <Section title="Links">
        <LinksList items={links} projectId={id} onChange={load} />
      </Section>

      {/* Agenda */}
      {commitments.length > 0 && (
        <Section title="Agenda">
          <ul className="space-y-1">
            {commitments.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span>{c.title}</span>
                <span className="text-xs text-muted-foreground">{dateTimeFmt.format(new Date(c.startAt))}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Notas */}
      <Section title="Notas">
        <NotesList items={notes} projectId={id} onChange={load} />
      </Section>

      {/* Decisões */}
      <Section title="Decisões">
        <DecisionsList items={decisions} projectId={id} onChange={load} />
      </Section>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function Row({ label, value, valueClass, bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`tabular-nums ${bold ? "font-bold" : "font-medium"} ${valueClass || ""}`}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="mb-2 font-display text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function StageBlock({
  stage,
  projectId,
  onToggle,
  onChange,
}: {
  stage: StageRow;
  projectId: string;
  onToggle: (taskId: string, done: boolean) => void;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  async function submit() {
    if (!title.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), stageId: stage.id || null }),
    });
    setTitle("");
    setAdding(false);
    onChange();
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{stage.name}</p>
      <ul className="space-y-1">
        {stage.tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-1.5 text-sm">
            <Checkbox checked={t.done} onCheckedChange={(c) => onToggle(t.id, !!c)} />
            <span className={t.done ? "flex-1 text-muted-foreground line-through" : "flex-1"}>{t.title}</span>
          </li>
        ))}
      </ul>
      {adding ? (
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nova tarefa…"
          className="mt-1 h-7 text-xs"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <Plus className="h-3 w-3" /> Tarefa
        </button>
      )}
    </div>
  );
}

function AddStage({ projectId, onAdded }: { projectId: string; onAdded: () => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  async function submit() {
    if (!name.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setAdding(false);
    onAdded();
  }

  return adding ? (
    <Input
      autoFocus
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => e.key === "Enter" && submit()}
      placeholder="Nome da etapa (ex: Reserva)…"
      className="h-8 text-sm"
    />
  ) : (
    <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <Plus className="h-3.5 w-3.5" /> Nova etapa
    </button>
  );
}

function NotesList({ items, projectId, onChange }: { items: NoteRow[]; projectId: string; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [body, setBody] = useState("");

  async function submit() {
    if (!body.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    setBody("");
    setAdding(false);
    onChange();
  }

  async function remove(noteId: string) {
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-2">
      {items.map((n) => (
        <div key={n.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <p className="flex-1">{n.body}</p>
          <DeleteButton label="nota" onDelete={() => remove(n.id)} />
        </div>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nova nota…"
          className="h-8 text-sm"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Nota
        </button>
      )}
    </div>
  );
}

function EnvelopesList({ items, projectId, onChange }: { items: EnvelopeRow[]; projectId: string; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  async function submit() {
    if (!name.trim()) {
      setAdding(false);
      return;
    }
    await fetch("/api/envelopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), allocated: 0, projectId }),
    });
    setName("");
    setAdding(false);
    onChange();
  }

  async function remove(id: string) {
    await fetch(`/api/envelopes/${id}`, { method: "DELETE" });
    onChange();
  }

  async function addContribution(env: EnvelopeRow, amount: number) {
    await fetch(`/api/envelopes/${env.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allocated: env.allocated + amount }),
    });
    onChange();
  }

  return (
    <div className="space-y-1.5">
      {items.map((e) => (
        <div key={e.id} className="flex flex-wrap items-center justify-between gap-y-1.5 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <span className="min-w-0 flex-1 truncate font-medium">{e.name}</span>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-semibold tabular-nums">{currency(e.allocated)}</span>
            <ContributeDialog envelope={e} onContribute={(v) => addContribution(e, v)} />
            <DeleteButton label={e.name} onDelete={() => remove(e.id)} />
          </div>
        </div>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={name}
          onChange={(ev) => setName(ev.target.value)}
          onBlur={submit}
          onKeyDown={(ev) => ev.key === "Enter" && submit()}
          placeholder="Nome do envelope (ex: Hospedagem)…"
          className="h-8 text-sm"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Envelope
        </button>
      )}
    </div>
  );
}

function ContributeDialog({ envelope, onContribute }: { envelope: EnvelopeRow; onContribute: (amount: number) => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  function submit() {
    const value = Number(amount.replace(",", "."));
    if (!value || value <= 0) {
      notify.error("Valor inválido");
      return;
    }
    onContribute(value);
    setOpen(false);
    setAmount("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          + Guardar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Guardar em {envelope.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quanto você quer guardar agora?</Label>
            <Input autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LinksList({ items, projectId, onChange }: { items: LinkRow[]; projectId: string; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  async function submit() {
    if (!url.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), label: label.trim() || null }),
    });
    setUrl("");
    setLabel("");
    setAdding(false);
    onChange();
  }

  async function remove(id: string) {
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-1.5">
      {items.length === 0 && !adding && <p className="text-sm text-muted-foreground">Nenhum link salvo ainda.</p>}
      {items.map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-primary hover:underline">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{l.label || l.url}</span>
          </a>
          <DeleteButton label={l.label || l.url} onDelete={() => remove(l.id)} />
        </div>
      ))}
      {adding ? (
        <div className="space-y-1.5 rounded-lg bg-muted/40 p-2">
          <Input autoFocus value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-8 text-sm" />
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome (opcional)" className="h-8 text-sm" onKeyDown={(e) => e.key === "Enter" && submit()} />
          <Button size="sm" className="h-7 w-full text-xs" onClick={submit}>
            Salvar link
          </Button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Link
        </button>
      )}
    </div>
  );
}

function DecisionsList({ items, projectId, onChange }: { items: NoteRow[]; projectId: string; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [body, setBody] = useState("");

  async function submit() {
    if (!body.trim()) {
      setAdding(false);
      return;
    }
    await fetch(`/api/projects/${projectId}/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: body.trim() }),
    });
    setBody("");
    setAdding(false);
    onChange();
  }

  async function remove(decisionId: string) {
    await fetch(`/api/decisions/${decisionId}`, { method: "DELETE" });
    onChange();
  }

  return (
    <div className="space-y-2">
      {items.map((d) => (
        <div key={d.id} className="flex items-start justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <div className="flex-1">
            <p className="text-[11px] text-muted-foreground">{dateFmt.format(new Date(d.createdAt))}</p>
            <p>{d.body}</p>
          </div>
          <DeleteButton label="decisão" onDelete={() => remove(d.id)} />
        </div>
      ))}
      {adding ? (
        <Input
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ex: orçamento definido em R$1.500"
          className="h-8 text-sm"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Decisão
        </button>
      )}
    </div>
  );
}
