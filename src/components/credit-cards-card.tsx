"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard as CreditCardIcon, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionCard } from "@/components/section-card";
import { DeleteButton } from "@/components/delete-button";
import { notify } from "@/lib/toast";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

interface Purchase {
  id: string;
  title: string;
  amount: number;
  date: string;
  billId: string | null;
}
interface Card {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  faturaAtual: number;
  purchases: Purchase[];
}

// A credit card's monthly invoice — purchases pile up here until the cycle
// closes and turns into a Bill automatically (see lib/creditCard.ts). This
// card only ever shows the still-open, unbilled purchases; once billed, they
// live on as a normal Bill everywhere Bills already show up.
export function CreditCardsCard() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/credit-cards");
    const json = await res.json();
    setCards(json.cards || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  return (
    <SectionCard title="Cartões de crédito" icon={CreditCardIcon} color="#6366f1" actions={<AddCardDialog onAdded={load} />}>
      {cards.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum cartão cadastrado.</p>
      ) : (
        <ul className="space-y-3">
          {cards.map((c) => (
            <li key={c.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-y-1.5">
                <div className="min-w-0">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Fecha dia {c.closingDay} · vence dia {c.dueDay}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums">{currency(c.faturaAtual)}</span>
                  <AddPurchaseDialog card={c} onAdded={load} />
                  <EditCardDialog card={c} onSaved={load} />
                  <DeleteButton label={c.name} onDelete={async () => { await fetch(`/api/credit-cards/${c.id}`, { method: "DELETE" }); load(); }} />
                </div>
              </div>
              {c.purchases.length > 0 && (
                <ul className="mt-1.5 space-y-1 border-t border-border/50 pt-1.5">
                  {c.purchases.map((p) => (
                    <li key={p.id} className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      <span className="shrink-0">{dateFmt.format(new Date(p.date))}</span>
                      <span className="min-w-0 flex-1 truncate">{p.title}</span>
                      <span className="shrink-0 font-medium">{currency(p.amount)}</span>
                      <span className="flex shrink-0 items-center">
                        <EditPurchaseDialog purchase={p} onSaved={load} />
                        <DeleteButton
                          label={p.title}
                          onDelete={async () => {
                            await fetch(`/api/credit-card-purchases/${p.id}`, { method: "DELETE" });
                            load();
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function AddCardDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");

  async function submit() {
    const closing = Number(closingDay);
    const due = Number(dueDay);
    if (!name || !closing || closing < 1 || closing > 28 || !due || due < 1 || due > 28) {
      notify.error("Preencha nome e dias entre 1 e 28");
      return;
    }
    await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, closingDay: closing, dueDay: due }),
    });
    setOpen(false);
    setName("");
    setClosingDay("");
    setDueDay("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Cartão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cartão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Dia do fechamento</Label>
              <Input value={closingDay} onChange={(e) => setClosingDay(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 25" inputMode="numeric" />
            </div>
            <div className="flex-1">
              <Label>Dia do vencimento</Label>
              <Input value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 5" inputMode="numeric" />
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

function EditCardDialog({ card, onSaved }: { card: Card; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(card.name);
  const [closingDay, setClosingDay] = useState(String(card.closingDay));
  const [dueDay, setDueDay] = useState(String(card.dueDay));

  async function submit() {
    const closing = Number(closingDay);
    const due = Number(dueDay);
    if (!name || !closing || closing < 1 || closing > 28 || !due || due < 1 || due > 28) {
      notify.error("Preencha nome e dias entre 1 e 28");
      return;
    }
    await fetch(`/api/credit-cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, closingDay: closing, dueDay: due }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setName(card.name); setClosingDay(String(card.closingDay)); setDueDay(String(card.dueDay)); } }}>
      <DialogTrigger asChild>
        <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Editar ${card.name}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar cartão</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Label>Dia do fechamento</Label>
              <Input value={closingDay} onChange={(e) => setClosingDay(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
            </div>
            <div className="flex-1">
              <Label>Dia do vencimento</Label>
              <Input value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ""))} inputMode="numeric" />
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

function AddPurchaseDialog({ card, onAdded }: { card: Card; onAdded: () => void }) {
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
    await fetch(`/api/credit-cards/${card.id}/purchases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: value, date }),
    });
    setOpen(false);
    setTitle("");
    setAmount("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          + Compra
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar compra — {card.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título</Label>
            <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mercado" />
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
          <Button onClick={submit}>Lançar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPurchaseDialog({ purchase, onSaved }: { purchase: Purchase; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(purchase.title);
  const [amount, setAmount] = useState(String(purchase.amount));
  const [date, setDate] = useState(purchase.date.slice(0, 10));

  async function submit() {
    const value = Number(amount.replace(",", "."));
    if (!title || !value || value <= 0) {
      notify.error("Preencha título e um valor válido");
      return;
    }
    await fetch(`/api/credit-card-purchases/${purchase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: value, date }),
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
          setTitle(purchase.title);
          setAmount(String(purchase.amount));
          setDate(purchase.date.slice(0, 10));
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Editar ${purchase.title}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
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
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
