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
import type { Bill } from "@/lib/types";

const CATEGORIA_LABELS: Record<string, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  saude: "Saúde",
  lazer: "Lazer",
  educacao: "Educação",
  outros: "Outros",
};

export function AddTransactionDialog({ type, onAdded }: { type: "income" | "expense"; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState("");

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!title || !value || value <= 0) {
      notify.error("Preencha título e um valor válido");
      return;
    }
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        title,
        amount: value,
        date,
        ...(type === "expense" && { categoria: categoria || null }),
      }),
    });
    setOpen(false);
    setTitle("");
    setAmount("");
    setCategoria("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + {type === "income" ? "Entrada" : "Gasto"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{type === "income" ? "Registrar entrada" : "Registrar gasto"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "income" ? "Ex: Barbearia" : "Ex: Mercado"} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Valor</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" />
            </div>
            <div className="flex-1">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {type === "expense" && (
            <div>
              <Label>Categoria (opcional)</Label>
              <Select value={categoria || "none"} onValueChange={(v) => setCategoria(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione (opcional)</SelectItem>
                  {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTransactionDialog({
  transaction,
  onSaved,
}: {
  transaction: { id: string; title: string; amount: number; date: string; type: string; categoria?: string | null };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [date, setDate] = useState(transaction.date.slice(0, 10));
  const [categoria, setCategoria] = useState(transaction.categoria || "");

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!title || !value || value <= 0) {
      notify.error("Preencha título e um valor válido");
      return;
    }
    await fetch(`/api/transactions/${transaction.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        amount: value,
        date,
        ...(transaction.type === "expense" && { categoria: categoria || null }),
      }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) {
          setTitle(transaction.title);
          setAmount(String(transaction.amount));
          setDate(transaction.date.slice(0, 10));
          setCategoria(transaction.categoria || "");
        }
      }}
    >
      <DialogTrigger asChild>
        <EditTrigger label={transaction.title} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {transaction.type === "income" ? "entrada" : "gasto"}</DialogTitle>
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
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          {transaction.type === "expense" && (
            <div>
              <Label>Categoria (opcional)</Label>
              <Select value={categoria || "none"} onValueChange={(v) => setCategoria(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione (opcional)</SelectItem>
                  {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTrigger({ label }: { label: string }) {
  return (
    <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Editar ${label}`}>
      <Pencil className="h-3.5 w-3.5" />
    </button>
  );
}

function KindSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>Tipo</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ceiling">Teto (ex: mercado, combustível — sobra não é livre)</SelectItem>
          <SelectItem value="fixed">Fixo (ex: provisão de carro/casa — sempre comprometido)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function AddWeeklyBudgetDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("ceiling");

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!name || !value || value <= 0) {
      notify.error("Preencha nome e um valor válido");
      return;
    }
    await fetch("/api/weekly-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: value, kind }),
    });
    setOpen(false);
    setName("");
    setAmount("");
    setKind("ceiling");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Custo semanal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo custo semanal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Mercado" />
          </div>
          <div>
            <Label>Valor por semana</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <KindSelect value={kind} onChange={setKind} />
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditWeeklyBudgetDialog({
  weeklyBudget,
  onSaved,
}: {
  weeklyBudget: { id: string; name: string; amount: number; kind: string };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(weeklyBudget.name);
  const [amount, setAmount] = useState(String(weeklyBudget.amount));
  const [kind, setKind] = useState(weeklyBudget.kind);

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!name || !value || value <= 0) {
      notify.error("Preencha nome e um valor válido");
      return;
    }
    await fetch(`/api/weekly-budgets/${weeklyBudget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: value, kind }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EditTrigger label={weeklyBudget.name} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar custo semanal</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Valor por semana</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
          </div>
          <KindSelect value={kind} onChange={setKind} />
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LogActualDialog({
  weeklyBudget,
  onSaved,
}: {
  weeklyBudget: { id: string; name: string; amount: number; actualThisWeek: number };
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [actual, setActual] = useState(String(weeklyBudget.actualThisWeek || ""));

  async function submit() {
    const value = Number(actual.replace(",", "."));
    if (Number.isNaN(value) || value < 0) {
      notify.error("Valor inválido");
      return;
    }
    await fetch(`/api/weekly-budgets/${weeklyBudget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actualThisWeek: value }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          Já gastei
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quanto já gastou com {weeklyBudget.name} essa semana?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Valor gasto (planejado: {weeklyBudget.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })})</Label>
            <Input autoFocus value={actual} onChange={(e) => setActual(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddEnvelopeDialog({ bills, onAdded }: { bills: Bill[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [allocated, setAllocated] = useState("");
  const [billId, setBillId] = useState("");

  async function submit() {
    if (!name) {
      notify.error("Preencha o nome do envelope");
      return;
    }
    await fetch("/api/envelopes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, allocated: Number(allocated.replace(",", ".")) || 0, billId: billId || null }),
    });
    setOpen(false);
    setName("");
    setAllocated("");
    setBillId("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Separar dinheiro
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Separar dinheiro</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Carro" />
          </div>
          <div>
            <Label>Valor separado</Label>
            <Input value={allocated} onChange={(e) => setAllocated(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <div>
            <Label>Para qual conta? (opcional)</Label>
            <Select value={billId || "none"} onValueChange={(v) => setBillId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {bills.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Separar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditEnvelopeDialog({
  envelope,
  bills,
  onSaved,
}: {
  envelope: { id: string; name: string; allocated: number; billId: string | null };
  bills: Bill[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(envelope.name);
  const [allocated, setAllocated] = useState(String(envelope.allocated));
  const [billId, setBillId] = useState(envelope.billId || "");

  async function submit() {
    if (!name) {
      notify.error("Preencha o nome do envelope");
      return;
    }
    await fetch(`/api/envelopes/${envelope.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, allocated: Number(allocated.replace(",", ".")) || 0, billId: billId || null }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <EditTrigger label={envelope.name} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar dinheiro separado</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Valor separado</Label>
            <Input value={allocated} onChange={(e) => setAllocated(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label>Para qual conta? (opcional)</Label>
            <Select value={billId || "none"} onValueChange={(v) => setBillId(v === "none" ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {bills.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
