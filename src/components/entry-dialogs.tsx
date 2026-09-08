"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { notify } from "@/lib/toast";
import { AREAS } from "@/lib/areas";
import type { Commitment, Bill, Project } from "@/lib/types";

function EditTrigger({ label }: { label: string }) {
  return (
    <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Editar ${label}`}>
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

function AreaSelect({ value, onChange, allowNone = true }: { value: string; onChange: (v: string) => void; allowNone?: boolean }) {
  return (
    <div>
      <Label>Área</Label>
      <Select value={value || "none"} onValueChange={(v) => onChange(v === "none" ? "" : v)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value="none">Nenhuma</SelectItem>}
          {AREAS.map((a) => (
            <SelectItem key={a.key} value={a.key}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function AddCommitmentDialog({ onAdded, defaultArea, defaultDate }: { onAdded: () => void; defaultArea?: string; defaultDate?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [time, setTime] = useState("");
  const [area, setArea] = useState(defaultArea || "");
  const [recurring, setRecurring] = useState("");

  async function submit() {
    if (!title || !date || !time) {
      notify.error("Preencha título, data e hora");
      return;
    }
    await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startAt: new Date(`${date}T${time}`).toISOString(),
        area: area || null,
        recurring: recurring || null,
      }),
    });
    setOpen(false);
    setTitle("");
    setDate(defaultDate || "");
    setTime("");
    setRecurring("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Compromisso
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo compromisso</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Reunião com cliente" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Recorrência</Label>
            <Select value={recurring || "none"} onValueChange={(v) => setRecurring(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não recorrente</SelectItem>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="weekdays">Dias de semana (seg a sex)</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!defaultArea && <AreaSelect value={area} onChange={setArea} />}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditCommitmentDialog({ commitment, onSaved }: { commitment: Commitment; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const start = new Date(commitment.startAt);
  const [title, setTitle] = useState(commitment.title);
  const [date, setDate] = useState(start.toISOString().slice(0, 10));
  const [time, setTime] = useState(start.toTimeString().slice(0, 5));
  const [area, setArea] = useState(commitment.area || "");
  const [recurring, setRecurring] = useState(commitment.recurring || "");

  async function submit() {
    if (!title || !date || !time) {
      notify.error("Preencha título, data e hora");
      return;
    }
    await fetch(`/api/commitments/${commitment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        startAt: new Date(`${date}T${time}`).toISOString(),
        area: area || null,
        recurring: recurring || null,
      }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EditTrigger label={commitment.title} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar compromisso</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Recorrência</Label>
            <Select value={recurring || "none"} onValueChange={(v) => setRecurring(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não recorrente</SelectItem>
                <SelectItem value="daily">Todos os dias</SelectItem>
                <SelectItem value="weekdays">Dias de semana (seg a sex)</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AreaSelect value={area} onChange={setArea} />
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DurationSelect({
  installments,
  onChange,
}: {
  installments: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>Duração</Label>
      <Select value={installments ? "parcelas" : "indeterminado"} onValueChange={(v) => onChange(v === "parcelas" ? "1" : "")}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="indeterminado">Indeterminado (até cancelar — ex: streaming)</SelectItem>
          <SelectItem value="parcelas">Número de parcelas (ex: financiamento)</SelectItem>
        </SelectContent>
      </Select>
      {installments && (
        <Input
          className="mt-1.5"
          value={installments}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          placeholder="Ex: 60"
        />
      )}
    </div>
  );
}

export function AddBillDialog({ onAdded, defaultArea }: { onAdded: () => void; defaultArea?: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [area, setArea] = useState(defaultArea || "");
  const [recurring, setRecurring] = useState("");
  const [installments, setInstallments] = useState("");

  async function submit() {
    if (!title || !dueDate) {
      notify.error("Preencha título e vencimento");
      return;
    }
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: Number(amount.replace(",", ".")) || 0,
        dueDate,
        area: area || null,
        recurring: recurring || null,
        installments: recurring ? Number(installments) || null : null,
      }),
    });
    setOpen(false);
    setTitle("");
    setAmount("");
    setDueDate("");
    setRecurring("");
    setInstallments("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: energia" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Valor</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
            <div className="flex-1">
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Recorrência</Label>
            <Select value={recurring || "none"} onValueChange={(v) => setRecurring(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não recorrente</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recurring && <DurationSelect installments={installments} onChange={setInstallments} />}
          {!defaultArea && <AreaSelect value={area} onChange={setArea} />}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditBillDialog({ bill, onSaved }: { bill: Bill; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(bill.title);
  const [amount, setAmount] = useState(String(bill.amount));
  const [dueDate, setDueDate] = useState(new Date(bill.dueDate).toISOString().slice(0, 10));
  const [area, setArea] = useState(bill.area || "");
  const [recurring, setRecurring] = useState(bill.recurring || "");
  const [installments, setInstallments] = useState(bill.installments ? String(bill.installments) : "");

  async function submit() {
    if (!title || !dueDate) {
      notify.error("Preencha título e vencimento");
      return;
    }
    await fetch(`/api/bills/${bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: Number(amount.replace(",", ".")) || 0,
        dueDate,
        area: area || null,
        recurring: recurring || null,
        installments: recurring ? Number(installments) || null : null,
      }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EditTrigger label={bill.title} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar conta</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Valor</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </div>
            <div className="flex-1">
              <Label>Vencimento</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Recorrência</Label>
            <Select value={recurring || "none"} onValueChange={(v) => setRecurring(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não recorrente</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {recurring && <DurationSelect installments={installments} onChange={setInstallments} />}
          {bill.installments && recurring && (
            <p className="text-xs text-muted-foreground">Parcela atual: {bill.installmentNumber || 1} de {bill.installments}</p>
          )}
          <AreaSelect value={area} onChange={setArea} />
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const PROJECT_STATUSES = [
  { value: "planejado", label: "Planejado" },
  { value: "ativo", label: "Ativo" },
  { value: "esperando", label: "Esperando" },
  { value: "bloqueado", label: "Bloqueado" },
  { value: "concluido", label: "Concluído" },
];

const PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

export function AddProjectDialog({ onAdded, defaultArea }: { onAdded: () => void; defaultArea?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState(defaultArea || AREAS[0].key);
  const [objetivo, setObjetivo] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [prazo, setPrazo] = useState("");

  async function submit() {
    if (!name) {
      notify.error("Preencha o nome do projeto");
      return;
    }
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, area, objetivo, prioridade, prazo: prazo || null }),
    });
    setOpen(false);
    setName("");
    setObjetivo("");
    setPrazo("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Viagem em família" />
          </div>
          {!defaultArea && <AreaSelect value={area} onChange={setArea} allowNone={false} />}
          <div>
            <Label>Objetivo (opcional)</Label>
            <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="O que você quer alcançar com isso?" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Prazo (opcional)</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditProjectDialog({ project, onSaved }: { project: Project; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [area, setArea] = useState(project.area);
  const [objetivo, setObjetivo] = useState(project.objetivo || "");
  const [status, setStatus] = useState(project.status);
  const [esperandoMotivo, setEsperandoMotivo] = useState(project.esperandoMotivo || "");
  const [prioridade, setPrioridade] = useState(project.prioridade || "media");
  const [prazo, setPrazo] = useState(project.prazo ? project.prazo.slice(0, 10) : "");
  const [orcamento, setOrcamento] = useState(project.orcamento != null ? String(project.orcamento) : "");

  async function submit() {
    if (!name) {
      notify.error("Preencha o nome do projeto");
      return;
    }
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        area,
        objetivo,
        status,
        esperandoMotivo: status === "esperando" ? esperandoMotivo : "",
        prioridade,
        prazo: prazo || null,
        orcamento: orcamento ? Number(orcamento.replace(",", ".")) : null,
      }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EditTrigger label={project.name} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar projeto</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <AreaSelect value={area} onChange={setArea} allowNone={false} />
          <div>
            <Label>Objetivo</Label>
            <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="O que você quer alcançar com isso?" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {status === "esperando" && (
            <div>
              <Label>Esperando o quê?</Label>
              <Input value={esperandoMotivo} onChange={(e) => setEsperandoMotivo(e.target.value)} placeholder="Ex: validação do PR" />
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Prazo (opcional)</Label>
              <Input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
            </div>
            <div className="flex-1">
              <Label>Orçamento (opcional)</Label>
              <Input value={orcamento} onChange={(e) => setOrcamento(e.target.value)} placeholder="Ex: 1500" inputMode="decimal" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
