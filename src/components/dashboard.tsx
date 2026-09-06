"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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

interface Commitment {
  id: string;
  title: string;
  startAt: string;
  location: string | null;
}
interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}
interface Project {
  id: string;
  name: string;
  area: string;
  statusNote: string | null;
  needsDecision: boolean;
  hasAlert: boolean;
}
interface DashboardData {
  today: { commitments: Commitment[]; bills: Bill[] };
  upcomingCommitments: Commitment[];
  finance: { availableBalance: number; billsUntilSunday: number; projectedAfterCommitments: number };
  projects: Project[];
  church: Project[];
  dev: { needsDecision: number; alerts: number };
}

const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string) {
  const d = new Date(iso);
  const label = weekdayFmt.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function Dashboard() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) router.replace("/login");
        else setEmail(d.email);
      });
    load();
  }, [router, load]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    notify.success("Sessão encerrada");
    router.replace("/login");
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background px-4 py-8 text-foreground">
      <header className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">O que precisa da minha atenção?</h1>
          {email && <p className="text-xs text-muted-foreground">{email}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sair
        </Button>
      </header>

      <div className="space-y-8">
        <TodaySection data={data} onChange={load} />
        <UpcomingSection commitments={data.upcomingCommitments} />
        <FinanceSection finance={data.finance} onChange={load} />
        <ProjectsSection title="PROJETOS" projects={data.projects} onChange={load} />
        <ProjectsSection title="IGREJA & MINISTÉRIO" projects={data.church} onChange={load} defaultArea="igreja_ministerio" />
        <DevSection dev={data.dev} />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
}

function TodaySection({ data, onChange }: { data: DashboardData; onChange: () => void }) {
  const { commitments, bills } = data.today;
  const empty = commitments.length === 0 && bills.length === 0;

  async function markPaid(id: string) {
    await fetch(`/api/bills/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: true }),
    });
    onChange();
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>Hoje</SectionTitle>
        <div className="flex gap-1">
          <AddCommitmentDialog onAdded={onChange} />
          <AddBillDialog onAdded={onChange} />
        </div>
      </div>
      {empty ? (
        <p className="text-sm text-muted-foreground">Nada marcado para hoje.</p>
      ) : (
        <ul className="space-y-1.5">
          {commitments.map((c) => (
            <li key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 tabular-nums text-muted-foreground">{timeFmt.format(new Date(c.startAt))}</span>
              <span>{c.title}</span>
            </li>
          ))}
          {bills.map((b) => (
            <li key={b.id} className="flex items-center gap-3 text-sm">
              <Checkbox className="shrink-0" onCheckedChange={() => markPaid(b.id)} />
              <span className="font-bold text-rose-500">!</span>
              <span>Conta {b.title.toLowerCase()} vence hoje</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UpcomingSection({ commitments }: { commitments: Commitment[] }) {
  return (
    <section>
      <SectionTitle>Próximos compromissos</SectionTitle>
      {commitments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum compromisso futuro marcado.</p>
      ) : (
        <ul className="space-y-1.5">
          {commitments.map((c) => (
            <li key={c.id} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-muted-foreground">
                {dayLabel(c.startAt)} {timeFmt.format(new Date(c.startAt))}
              </span>
              <span>{c.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FinanceSection({ finance, onChange }: { finance: DashboardData["finance"]; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(finance.availableBalance));

  async function save() {
    const availableBalance = Number(value.replace(",", "."));
    if (Number.isNaN(availableBalance)) {
      notify.error("Valor inválido");
      return;
    }
    await fetch("/api/finance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableBalance }),
    });
    setEditing(false);
    onChange();
  }

  return (
    <section>
      <SectionTitle>Financeiro</SectionTitle>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span>Disponível esta semana</span>
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
              {currency(finance.availableBalance)}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span>Contas até domingo</span>
          <span className="font-medium text-rose-500">{currency(finance.billsUntilSunday)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Previsto após compromissos</span>
          <span className={`font-medium ${finance.projectedAfterCommitments >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
            {currency(finance.projectedAfterCommitments)}
          </span>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({
  title,
  projects,
  onChange,
  defaultArea,
}: {
  title: string;
  projects: Project[];
  onChange: () => void;
  defaultArea?: string;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        <AddProjectDialog onAdded={onChange} defaultArea={defaultArea} />
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id} className="text-sm">
              <p className="font-medium">{p.name}</p>
              {p.statusNote && <p className="text-muted-foreground">→ {p.statusNote}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function DevSection({ dev }: { dev: DashboardData["dev"] }) {
  if (dev.needsDecision === 0 && dev.alerts === 0) {
    return (
      <section>
        <SectionTitle>Desenvolvimento</SectionTitle>
        <p className="text-sm text-muted-foreground">Nada pendente.</p>
      </section>
    );
  }
  return (
    <section>
      <SectionTitle>Desenvolvimento</SectionTitle>
      <ul className="space-y-1 text-sm">
        {dev.needsDecision > 0 && (
          <li>
            {dev.needsDecision} {dev.needsDecision === 1 ? "projeto precisa" : "projetos precisam"} de decisão
          </li>
        )}
        {dev.alerts > 0 && (
          <li>
            {dev.alerts} {dev.alerts === 1 ? "deploy com problema" : "deploys com problema"}
          </li>
        )}
      </ul>
    </section>
  );
}

function AddCommitmentDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  async function submit() {
    if (!title || !date || !time) {
      notify.error("Preencha título, data e hora");
      return;
    }
    await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, startAt: new Date(`${date}T${time}`).toISOString() }),
    });
    setOpen(false);
    setTitle("");
    setDate("");
    setTime("");
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
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBillDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function submit() {
    if (!title || !dueDate) {
      notify.error("Preencha título e vencimento");
      return;
    }
    await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, amount: Number(amount.replace(",", ".")) || 0, dueDate }),
    });
    setOpen(false);
    setTitle("");
    setAmount("");
    setDueDate("");
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
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddProjectDialog({ onAdded, defaultArea }: { onAdded: () => void; defaultArea?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState(defaultArea || AREAS[0].key);
  const [statusNote, setStatusNote] = useState("");

  async function submit() {
    if (!name) {
      notify.error("Preencha o nome do projeto");
      return;
    }
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, area, statusNote }),
    });
    setOpen(false);
    setName("");
    setStatusNote("");
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
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Central de Comando" />
          </div>
          {!defaultArea && (
            <div>
              <Label>Área</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a.key} value={a.key}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>Status</Label>
            <Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Ex: aguardando validação" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
