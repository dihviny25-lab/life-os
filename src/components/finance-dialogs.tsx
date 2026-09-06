"use client";

import { useState } from "react";
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

export function AddTransactionDialog({ type, onAdded }: { type: "income" | "expense"; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!title || !value || value <= 0) {
      notify.error("Preencha título e um valor válido");
      return;
    }
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, title, amount: value, date }),
    });
    setOpen(false);
    setTitle("");
    setAmount("");
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
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddWeeklyBudgetDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!name || !value || value <= 0) {
      notify.error("Preencha nome e um valor válido");
      return;
    }
    await fetch("/api/weekly-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount: value }),
    });
    setOpen(false);
    setName("");
    setAmount("");
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
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
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
