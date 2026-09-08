"use client";

import { useEffect, useState, useCallback } from "react";
import { HandCoins, Pencil } from "lucide-react";
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
import { SectionCard } from "@/components/section-card";
import { DeleteButton } from "@/components/delete-button";
import { notify } from "@/lib/toast";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface DebtPayment {
  id: string;
  valor: number;
  metodo: string;
  nota: string | null;
  date: string;
}
interface Debt {
  id: string;
  pessoa: string;
  nota: string | null;
  saldo: number;
  pagamentos: DebtPayment[];
}

// Dívidas informais (sem prazo, sem parcela fixa) — deliberadamente fora do
// resto do financeiro: nunca soma em "comprometido", nunca vira alerta.
// Só um saldo tranquilo que você acompanha quando quiser.
export function DebtsCard() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/debts");
    const json = await res.json();
    setDebts(json.debts || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  return (
    <SectionCard title="Dívidas com pessoas" icon={HandCoins} color="#a855f7" actions={<AddDebtDialog onAdded={load} />}>
      {debts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui.</p>
      ) : (
        <ul className="space-y-2">
          {debts.map((d) => (
            <li key={d.id} className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-y-1.5">
                <div className="min-w-0">
                  <p className="font-medium">{d.pessoa}</p>
                  {d.nota && <p className="truncate text-xs text-muted-foreground">{d.nota}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums">{currency(d.saldo)}</span>
                  <PayDebtDialog debt={d} onPaid={load} />
                  <EditDebtDialog debt={d} onSaved={load} />
                  <DeleteButton label={d.pessoa} onDelete={async () => { await fetch(`/api/debts/${d.id}`, { method: "DELETE" }); load(); }} />
                </div>
              </div>
              {d.pagamentos.length > 0 && (
                <ul className="mt-1.5 space-y-1 border-t border-border/50 pt-1.5">
                  {d.pagamentos.map((p) => (
                    <li key={p.id} className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
                      <span className="shrink-0">{new Date(p.date).toLocaleDateString("pt-BR")}</span>
                      <span className="min-w-0 flex-1 truncate">{currency(p.valor)} ({p.metodo})</span>
                      <span className="flex shrink-0 items-center">
                        <EditDebtPaymentDialog debtId={d.id} payment={p} onSaved={load} />
                        <DeleteButton
                          label="pagamento"
                          onDelete={async () => {
                            await fetch(`/api/debts/${d.id}/payments/${p.id}`, { method: "DELETE" });
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

function AddDebtDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [pessoa, setPessoa] = useState("");
  const [saldo, setSaldo] = useState("");
  const [nota, setNota] = useState("");

  async function submit() {
    const value = Number(saldo.replace(",", "."));
    if (!pessoa || !value || value <= 0) {
      notify.error("Preencha a pessoa e um valor válido");
      return;
    }
    await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pessoa, saldo: value, nota: nota || null }),
    });
    setOpen(false);
    setPessoa("");
    setSaldo("");
    setNota("");
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          + Dívida
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova dívida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pessoa</Label>
            <Input value={pessoa} onChange={(e) => setPessoa(e.target.value)} placeholder="Ex: Fabrício" />
          </div>
          <div>
            <Label>Valor devido</Label>
            <Input value={saldo} onChange={(e) => setSaldo(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex: roupas" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDebtDialog({ debt, onSaved }: { debt: Debt; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [pessoa, setPessoa] = useState(debt.pessoa);
  const [saldo, setSaldo] = useState(String(debt.saldo));
  const [nota, setNota] = useState(debt.nota || "");

  async function submit() {
    const value = Number(saldo.replace(",", "."));
    if (!pessoa || value < 0) {
      notify.error("Preencha a pessoa e um valor válido");
      return;
    }
    await fetch(`/api/debts/${debt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pessoa, saldo: value, nota: nota || null }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setPessoa(debt.pessoa); setSaldo(String(debt.saldo)); setNota(debt.nota || ""); } }}>
      <DialogTrigger asChild>
        <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label={`Editar ${debt.pessoa}`}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar dívida</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Pessoa</Label>
            <Input value={pessoa} onChange={(e) => setPessoa(e.target.value)} />
          </div>
          <div>
            <Label>Saldo devido</Label>
            <Input value={saldo} onChange={(e) => setSaldo(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label>Nota (opcional)</Label>
            <Input value={nota} onChange={(e) => setNota(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDebtPaymentDialog({ debtId, payment, onSaved }: { debtId: string; payment: DebtPayment; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(String(payment.valor));
  const [metodo, setMetodo] = useState(payment.metodo);

  async function submit() {
    const value = Number(valor.replace(",", "."));
    if (!value || value <= 0) {
      notify.error("Preencha um valor válido");
      return;
    }
    await fetch(`/api/debts/${debtId}/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: value, metodo }),
    });
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) { setValor(String(payment.valor)); setMetodo(payment.metodo); } }}>
      <DialogTrigger asChild>
        <button className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Editar pagamento">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar pagamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Valor</Label>
            <Input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" />
          </div>
          <div>
            <Label>Forma</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro (desconta do saldo)</SelectItem>
                <SelectItem value="permuta">Permuta (não mexe no saldo)</SelectItem>
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

function PayDebtDialog({ debt, onPaid }: { debt: Debt; onPaid: () => void }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState("dinheiro");

  async function submit() {
    const value = Number(valor.replace(",", "."));
    if (!value || value <= 0) {
      notify.error("Preencha um valor válido");
      return;
    }
    await fetch(`/api/debts/${debt.id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: value, metodo }),
    });
    notify.success(metodo === "dinheiro" ? `${currency(value)} pago a ${debt.pessoa} — descontado do saldo` : `${currency(value)} abatido de ${debt.pessoa} (permuta)`);
    setOpen(false);
    setValor("");
    setMetodo("dinheiro");
    onPaid();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Pagar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar {debt.pessoa}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Quanto você deve a {debt.pessoa} agora</Label>
            <p className="text-sm text-muted-foreground">{currency(debt.saldo)}</p>
          </div>
          <div>
            <Label>Valor do pagamento</Label>
            <Input autoFocus value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" inputMode="decimal" />
          </div>
          <div>
            <Label>Forma</Label>
            <Select value={metodo} onValueChange={setMetodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dinheiro">Dinheiro (desconta do saldo)</SelectItem>
                <SelectItem value="permuta">Permuta (não mexe no saldo)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Registrar pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
