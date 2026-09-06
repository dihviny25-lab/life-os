import { db } from "@/lib/db";
import { bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function csvEscape(v: any): string { if (v == null) return ""; const s = String(v); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; }
function toCSV(rows: (string | number)[][], headers: string[]): string { return [headers.map(csvEscape).join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n"); }
function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const type = req.nextUrl.searchParams.get("type") || "finance";

  if (type === "finance") {
    const items = await db.item.findMany({ where: { userId: session.userId, type: "finance" }, orderBy: { dueDate: "asc" }, include: { domain: true, project: { select: { name: true } } } });
    const rows = items.map((it) => { const meta = it.metadata ? safeParse(it.metadata) : {}; return [it.title, meta.kind || "", meta.amount || "", meta.recurring || "one-time", it.dueDate ? new Date(it.dueDate).toISOString().slice(0, 10) : "", it.status, it.domain?.name || "", it.project?.name || ""]; });
    return new Response(toCSV(rows, ["Title", "Kind", "Amount", "Recurrence", "Date", "Status", "Domain", "Project"]), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="lifeos-finances-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }

  if (type === "reviews") {
    const reviews = await db.review.findMany({ where: { userId: session.userId }, orderBy: { date: "desc" } });
    const rows = reviews.map((r) => [r.type, new Date(r.date).toISOString().slice(0, 10), r.mood || "", r.energy || "", r.wins || "", r.challenges || "", r.learnings || "", r.gratitude || "", r.priorities ? safeParse(r.priorities).join(" | ") : "", r.notes || ""]);
    return new Response(toCSV(rows, ["Type", "Date", "Mood", "Energy", "Wins", "Challenges", "Learnings", "Gratitude", "Priorities", "Notes"]), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="lifeos-reviews-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }

  if (type === "items") {
    const items = await db.item.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" }, include: { domain: true, project: { select: { name: true } } }, take: 1000 });
    const rows = items.map((it) => [it.type, it.title, it.status, it.priority, it.domain?.name || "", it.project?.name || "", it.dueDate ? new Date(it.dueDate).toISOString().slice(0, 10) : "", it.completedAt ? new Date(it.completedAt).toISOString().slice(0, 10) : "", (it.content || "").replace(/\n/g, " ").slice(0, 200)]);
    return new Response(toCSV(rows, ["Type", "Title", "Status", "Priority", "Domain", "Project", "DueDate", "CompletedDate", "Content"]), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="lifeos-items-${new Date().toISOString().slice(0, 10)}.csv"` } });
  }
  return bad("Unknown export type. Use finance, reviews, or items.");
}
