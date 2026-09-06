import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday, isThisWeek, parseISO, differenceInCalendarDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function fmtDate(d: string | Date | null | undefined, fmt = "d MMM") {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return format(date, fmt, { locale: ptBR });
}

export function fmtRelative(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
}

export function smartDate(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  if (isYesterday(date)) return "Ontem";
  if (isThisWeek(date)) return format(date, "EEEE", { locale: ptBR });
  const diff = differenceInCalendarDays(date, new Date());
  if (diff > 0 && diff < 30) return `Em ${diff} dias`;
  if (diff < 0 && diff > -30) return `${Math.abs(diff)} dias atrás`;
  return format(date, "d MMM", { locale: ptBR });
}

export function dateColor(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = differenceInCalendarDays(target, today);
  if (diff < 0) return "text-rose-500";
  if (diff === 0) return "text-amber-500";
  if (diff <= 2) return "text-orange-500";
  return "text-muted-foreground";
}

export function toISODate(d: Date) {
  return d.toISOString();
}

export function fromDateInput(v: string): string | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function toDateInput(d: string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? parseISO(d) : d;
  if (isNaN(date.getTime())) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
}
