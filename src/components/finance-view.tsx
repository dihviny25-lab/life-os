"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/dashboard";
import { AddTransactionDialog, AddEnvelopeDialog } from "@/components/finance-dialogs";
import { AddBillDialog } from "@/components/entry-dialogs";
import { notify } from "@/lib/toast";
import type { Bill } from "@/lib/types";

interface Envelope {
  id: string;
  name: string;
  allocated: number;
  billId: string | null;
}
interface BillWithStatus extends Bill {
  separated: number;
  missing: number;
  status: "pago" | "atrasado" | "separado" | "parcial" | "sem_cobertura";
  priority: string;
}
interface Overview {
  situacao: { currentBalance: number; committed: number; free: number; status: "atencao" | "ok" };
  atencao: BillWithStatus[];
  semana: { recebido: number; gasto: number; contas: number; livre: number };
  projecao30d: { entradas: number; contas: number; margem: number };
}

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  atrasado: { label: "Atrasado", color: "text-rose-500" },
  sem_cobertura: { label: "Sem cobertura", color: "text-rose-500" },
  parcial: { label: "Parcialmente separado", color: "text-amber-500" },
  separado: { label: "Separado", color: "text-emerald-600" },
  pago: { label: "Pago", color: "text-emerald-600" },
};

export function FinanceView() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [envelopes, setEnvelopes] = useState<Envelope[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [overviewRes, billsRes, envelopesRes] = await Promise.all([
      fetch("/api/finance/overview"),
      fetch("/api/bills"),
      fetch("/api/envelopes"),
    ]);
    if (overviewRes.status === 401) {
      router.replace("/login");
      return;
    }
    setOverview(await overviewRes.json());
    setBills((await billsRes.json()).bills);
    setEnvelopes((await envelopesRes.json()).envelopes);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !overview) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-xl font-bold">Financeiro</h1>

      <div className="space-y-8">
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <SectionTitle>Situação atual</SectionTitle>
          <SituacaoAtual situacao={overview.situacao} onChange={load} />
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Precisa da sua atenção</SectionTitle>
            <AddBillDialog onAdded={load} />
          </div>
          {overview.atencao.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tudo coberto.</p>
          ) : (
            <ul className="space-y-2">
              {overview.atencao.map((b) => (
                <li key={b.id} className="rounded-lg border border-border/60 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.title}</span>
                    <span className="font-medium">{currency(b.amount)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{dateFmt.format(new Date(b.dueDate))}</span>
                    <span className={STATUS_LABEL[b.status]?.color}>
                      {STATUS_LABEL[b.status]?.label} {b.separated > 0 && `(${currency(b.separated)} separados)`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Esta semana</SectionTitle>
            <div className="flex gap-1">
              <AddTransactionDialog type="income" onAdded={load} />
              <AddTransactionDialog type="expense" onAdded={load} />
            </div>
          </div>
          <div className="space-y-1.5 text-sm">
            <Row label="Recebido" value={currency(overview.semana.recebido)} />
            <Row label="Gastos" value={currency(overview.semana.gasto)} valueClass="text-rose-500" />
            <Row label="Contas da semana" value={currency(overview.semana.contas)} valueClass="text-rose-500" />
            <Row
              label="Livre"
              value={currency(overview.semana.livre)}
              valueClass={overview.semana.livre >= 0 ? "text-emerald-600" : "text-rose-500"}
              bold
            />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionTitle>Próximos 30 dias</SectionTitle>
          <div className="space-y-1.5 text-sm">
            <Row label="Entradas (últimos 30 dias)" value={currency(overview.projecao30d.entradas)} />
            <Row label="Contas previstas" value={currency(overview.projecao30d.contas)} valueClass="text-rose-500" />
            <Row
              label="Margem projetada"
              value={currency(overview.projecao30d.margem)}
              valueClass={overview.projecao30d.margem >= 0 ? "text-emerald-600" : "text-rose-500"}
              bold
            />
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="mb-2 flex items-center justify-between">
            <SectionTitle>Dinheiro separado (envelopes)</SectionTitle>
            <AddEnvelopeDialog bills={bills} onAdded={load} />
          </div>
          {envelopes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada separado ainda.</p>
          ) : (
            <ul className="space-y-1.5">
              {envelopes.map((e) => {
                const bill = bills.find((b) => b.id === e.billId);
                return (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span>
                      {e.name}
                      {bill && <span className="text-muted-foreground"> → {bill.title}</span>}
                    </span>
                    <span className="font-medium">{currency(e.allocated)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>
      </div>
    </div>
  );
}

function Row({ label, value, valueClass, bold }: { label: string; value: string; valueClass?: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-medium" : ""}>{label}</span>
      <span className={`${bold ? "font-semibold" : "font-medium"} ${valueClass || ""}`}>{value}</span>
    </div>
  );
}

function SituacaoAtual({
  situacao,
  onChange,
}: {
  situacao: Overview["situacao"];
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(situacao.currentBalance));

  async function save() {
    const currentBalance = Number(value.replace(",", "."));
    if (Number.isNaN(currentBalance)) {
      notify.error("Valor inválido");
      return;
    }
    await fetch("/api/finance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentBalance }),
    });
    setEditing(false);
    onChange();
  }

  return (
    <div className="space-y-1.5 text-sm">
      <div className="flex items-center justify-between">
        <span>Saldo total</span>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <Input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-7 w-28 text-right"
              inputMode="decimal"
            />
            <Button size="sm" className="h-7 px-2" onClick={save}>
              Salvar
            </Button>
          </div>
        ) : (
          <button className="font-medium hover:underline" onClick={() => setEditing(true)}>
            {currency(situacao.currentBalance)}
          </button>
        )}
      </div>
      <Row label="Já comprometido" value={`-${currency(situacao.committed)}`} valueClass="text-rose-500" />
      <Row
        label="Disponível de verdade"
        value={currency(situacao.free)}
        valueClass={situacao.free >= 0 ? "text-emerald-600" : "text-rose-500"}
        bold
      />
      <p className={`pt-1 text-xs font-semibold uppercase tracking-wide ${situacao.status === "atencao" ? "text-rose-500" : "text-emerald-600"}`}>
        Status: {situacao.status === "atencao" ? "Atenção" : "Ok"}
      </p>
    </div>
  );
}
