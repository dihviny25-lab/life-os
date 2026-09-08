"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Receipt, Repeat } from "lucide-react";
import { AddCommitmentDialog, EditCommitmentDialog, EditBillDialog } from "@/components/entry-dialogs";
import { DeleteButton } from "@/components/delete-button";
import { Checkbox } from "@/components/ui/checkbox";
import { AREAS } from "@/lib/areas";
import { startOfWeekMonday } from "@/lib/finance";

interface CalEvent {
  id: string;
  title: string;
  date: string;
  type: "commitment" | "bill";
  area: string | null;
  location?: string | null;
  recurring?: string | null;
  done?: boolean;
  amount?: number;
  paid?: boolean;
  installments?: number | null;
  installmentNumber?: number | null;
}

type ViewMode = "month" | "week" | "day";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function areaColor(area: string | null) {
  return AREAS.find((a) => a.key === area)?.color || "#71717a";
}

export function CalendarView() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const { rangeStart, rangeEnd, gridStart, gridEnd } = useMemo(() => {
    if (view === "day") {
      return { rangeStart: startOfDay(cursor), rangeEnd: endOfDay(cursor), gridStart: null, gridEnd: null };
    }
    if (view === "week") {
      const ws = startOfWeekMonday(cursor);
      return { rangeStart: ws, rangeEnd: endOfDay(addDays(ws, 6)), gridStart: null, gridEnd: null };
    }
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthEnd = endOfDay(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));
    const gs = startOfWeekMonday(monthStart);
    const ge = endOfDay(addDays(startOfWeekMonday(monthEnd), 6));
    return { rangeStart: gs, rangeEnd: ge, gridStart: gs, gridEnd: ge };
  }, [view, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?start=${rangeStart.toISOString()}&end=${rangeEnd.toISOString()}`);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    const json = await res.json();
    setEvents(json.events || []);
    setLoading(false);
  }, [router, rangeStart, rangeEnd]);

  useEffect(() => {
    load();
  }, [load]);

  async function markCommitmentDone(id: string) {
    await fetch(`/api/commitments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });
    load();
  }

  async function deleteCommitment(id: string) {
    await fetch(`/api/commitments/${id}`, { method: "DELETE" });
    load();
  }

  async function deleteBill(id: string) {
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    load();
  }

  function step(dir: 1 | -1) {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else setCursor((c) => addMonths(c, dir));
  }

  const label = useMemo(() => {
    if (view === "day") return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(cursor);
    if (view === "week") {
      const ws = startOfWeekMonday(cursor);
      const we = addDays(ws, 6);
      const f = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
      return `${f.format(ws)} – ${f.format(we)}`;
    }
    return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(cursor);
  }, [view, cursor]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="font-display text-[26px] font-semibold capitalize tracking-tight">{label}</h1>
        <AddCommitmentDialog onAdded={load} defaultDate={view === "day" ? toISODate(cursor) : undefined} />
      </div>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {(["month", "week", "day"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                view === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => step(-1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted">
            Hoje
          </button>
          <button onClick={() => step(1)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Próximo">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : view === "month" && gridStart && gridEnd ? (
        <MonthGrid gridStart={gridStart} gridEnd={gridEnd} monthRef={cursor} events={events} onPickDay={(d) => { setCursor(d); setView("day"); }} />
      ) : view === "week" ? (
        <WeekList weekStart={startOfWeekMonday(cursor)} events={events} onPickDay={(d) => { setCursor(d); setView("day"); }} onMarkDone={markCommitmentDone} onDeleteCommitment={deleteCommitment} onDeleteBill={deleteBill} onChange={load} />
      ) : (
        <DayAgenda day={cursor} events={events} onDeleteCommitment={deleteCommitment} onDeleteBill={deleteBill} onMarkDone={markCommitmentDone} onChange={load} />
      )}
    </div>
  );
}

function EventDot({ event }: { event: CalEvent }) {
  const color = event.type === "bill" ? "#f43f5e" : areaColor(event.area);
  return <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />;
}

function MonthGrid({
  gridStart,
  gridEnd,
  monthRef,
  events,
  onPickDay,
}: {
  gridStart: Date;
  gridEnd: Date;
  monthRef: Date;
  events: CalEvent[];
  onPickDay: (d: Date) => void;
}) {
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d));
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const dayEvents = events.filter((e) => isSameDay(new Date(e.date), d));
          const inMonth = d.getMonth() === monthRef.getMonth();
          const isToday = isSameDay(d, today);
          return (
            <motion.button
              key={i}
              onClick={() => onPickDay(d)}
              whileTap={{ scale: 0.96 }}
              className={`flex min-h-[72px] flex-col items-start gap-1 border-b border-r border-border p-1.5 text-left last:border-r-0 sm:min-h-[92px] ${
                inMonth ? "bg-card" : "bg-muted/20"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex w-full flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <span key={e.id + e.date} className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                    <EventDot event={e} /> <span className="truncate">{e.title}</span>
                  </span>
                ))}
                {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} mais</span>}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function WeekList({
  weekStart,
  events,
  onPickDay,
  onMarkDone,
  onDeleteCommitment,
  onDeleteBill,
  onChange,
}: {
  weekStart: Date;
  events: CalEvent[];
  onPickDay: (d: Date) => void;
  onMarkDone: (id: string) => Promise<void>;
  onDeleteCommitment: (id: string) => Promise<void>;
  onDeleteBill: (id: string) => Promise<void>;
  onChange: () => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const dayLabelFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });

  return (
    <div className="space-y-2.5">
      {days.map((d) => {
        const dayEvents = events.filter((e) => isSameDay(new Date(e.date), d));
        return (
          <div
            key={d.toISOString()}
            className={`block w-full rounded-lg border border-border p-3 text-left transition-colors ${isSameDay(d, today) ? "bg-primary/5" : "bg-card"}`}
          >
            <p className="mb-1.5 text-xs font-medium capitalize text-muted-foreground">{dayLabelFmt.format(d)}</p>
            {dayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground/60">Nada marcado</p>
            ) : (
              <ul className="space-y-1">
                {dayEvents.map((e) => {
                  const atrasado = e.type === "commitment" && !e.recurring && !e.done && new Date(e.date) < new Date();
                  return (
                    <li
                      key={e.id + e.date}
                      className={`flex flex-wrap items-center gap-1.5 text-sm rounded px-2 py-1 ${atrasado ? "border border-rose-500/20 bg-rose-500/5" : ""}`}
                    >
                      {e.type === "commitment" && !e.recurring && (
                        <Checkbox
                          className="shrink-0"
                          checked={!!e.done}
                          onCheckedChange={async () => {
                            await onMarkDone(e.id);
                          }}
                          onClick={(event) => event.stopPropagation()}
                        />
                      )}
                      <EventDot event={e} />
                      <span className={`min-w-0 truncate ${e.done ? "line-through text-muted-foreground" : ""}`}>{e.title}</span>
                      {e.type === "commitment" && e.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                      {atrasado && <span className="shrink-0 text-xs font-medium text-rose-500">Atrasado</span>}
                      {e.type === "commitment" && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeFmt.format(new Date(e.date))}</span>}
                      {e.type === "bill" && <span className="ml-auto shrink-0 text-xs text-rose-500">{currency(e.amount || 0)}</span>}
                      <span className="flex shrink-0 items-center" onClick={(event) => event.stopPropagation()}>
                        {e.type === "commitment" ? (
                          <>
                            <EditCommitmentDialog commitment={{ id: e.id, title: e.title, startAt: e.date, location: e.location ?? null, area: e.area, recurring: e.recurring }} onSaved={onChange} />
                            <DeleteButton label={e.title} onDelete={() => onDeleteCommitment(e.id)} />
                          </>
                        ) : (
                          <>
                            <EditBillDialog
                              bill={{
                                id: e.id,
                                title: e.title,
                                amount: e.amount || 0,
                                dueDate: e.date,
                                paid: !!e.paid,
                                area: e.area,
                                recurring: e.recurring ?? null,
                                installments: e.installments ?? null,
                                installmentNumber: e.installmentNumber ?? null,
                              }}
                              onSaved={onChange}
                            />
                            <DeleteButton label={e.title} onDelete={() => onDeleteBill(e.id)} />
                          </>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayAgenda({
  day,
  events,
  onDeleteCommitment,
  onDeleteBill,
  onMarkDone,
  onChange,
}: {
  day: Date;
  events: CalEvent[];
  onDeleteCommitment: (id: string) => Promise<void>;
  onDeleteBill: (id: string) => Promise<void>;
  onMarkDone: (id: string) => Promise<void>;
  onChange: () => void;
}) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.date), day)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (dayEvents.length === 0) {
    return <p className="text-sm text-muted-foreground">Nada marcado para esse dia.</p>;
  }

  return (
    <ul className="space-y-2">
      {dayEvents.map((e) => {
        const atrasado = e.type === "commitment" && !e.recurring && !e.done && new Date(e.date) < new Date();
        return (
          <li key={e.id + e.date} className={`flex items-center gap-3 rounded-lg border bg-card p-3 text-sm ${atrasado ? "border-rose-500/20 bg-rose-500/5" : "border-border"}`}>
            {e.type === "commitment" && !e.recurring && (
              <Checkbox
                className="shrink-0"
                checked={!!e.done}
                onCheckedChange={async () => {
                  await onMarkDone(e.id);
                }}
              />
            )}
            {e.type === "bill" ? <Receipt className="h-4 w-4 shrink-0 text-rose-500" /> : <EventDot event={e} />}
            <div className="min-w-0 flex-1">
              <p className={`truncate font-medium ${e.done ? "line-through text-muted-foreground" : ""}`}>{e.title}</p>
              {e.location && <p className="truncate text-xs text-muted-foreground">{e.location}</p>}
            </div>
            {e.type === "commitment" ? (
              <>
                {e.recurring && <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                {atrasado && <span className="shrink-0 text-xs font-medium text-rose-500">Atrasado</span>}
                <span className="shrink-0 text-muted-foreground">{timeFmt.format(new Date(e.date))}</span>
                <EditCommitmentDialog commitment={{ id: e.id, title: e.title, startAt: e.date, location: e.location ?? null, area: e.area, recurring: e.recurring }} onSaved={onChange} />
                <DeleteButton label={e.title} onDelete={() => onDeleteCommitment(e.id)} />
              </>
            ) : (
              <>
                <span className={`shrink-0 font-semibold tabular-nums ${e.paid ? "text-emerald-500" : "text-rose-500"}`}>{currency(e.amount || 0)}</span>
                <EditBillDialog
                  bill={{
                    id: e.id,
                    title: e.title,
                    amount: e.amount || 0,
                    dueDate: e.date,
                    paid: !!e.paid,
                    area: e.area,
                    recurring: e.recurring ?? null,
                    installments: e.installments ?? null,
                    installmentNumber: e.installmentNumber ?? null,
                  }}
                  onSaved={onChange}
                />
                <DeleteButton label={e.title} onDelete={() => onDeleteBill(e.id)} />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
