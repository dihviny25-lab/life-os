import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionQuery, DB, plainTitle, plainDate, plainText, plainNumber, plainCheckbox, plainSelect } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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
// The nearest Sunday on or after `from` (today counts if it's already Sunday)
function upcomingSunday(from: Date) {
  const d = endOfDay(from);
  const day = d.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function toCommitment(page: any) {
  return {
    id: page.id,
    title: plainTitle(page.properties["Título"]),
    startAt: plainDate(page.properties["Data e hora"]),
  };
}
function toBill(page: any) {
  return {
    id: page.id,
    title: plainTitle(page.properties["Título"]),
    amount: plainNumber(page.properties["Valor"]),
    dueDate: plainDate(page.properties["Vencimento"]),
  };
}
function toProject(page: any) {
  return {
    id: page.id,
    name: plainTitle(page.properties["Nome"]),
    area: plainSelect(page.properties["Área"]),
    statusNote: plainText(page.properties["Status"]) || null,
    needsDecision: plainCheckbox(page.properties["Precisa decisão"]),
    hasAlert: plainCheckbox(page.properties["Tem alerta"]),
  };
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const sunday = upcomingSunday(now);

  const [commitmentPages, billPages, projectPages, financePages] = await Promise.all([
    notionQuery(DB.commitments, { sorts: [{ property: "Data e hora", direction: "ascending" }] }),
    notionQuery(DB.bills, {
      filter: { property: "Paga", checkbox: { equals: false } },
      sorts: [{ property: "Vencimento", direction: "ascending" }],
    }),
    notionQuery(DB.projects),
    notionQuery(DB.finance, { sorts: [{ timestamp: "created_time", direction: "descending" }], page_size: 1 }),
  ]);

  const commitments = commitmentPages.map(toCommitment).filter((c) => c.startAt);
  const bills = billPages.map(toBill).filter((b) => b.dueDate);
  const projects = projectPages.map(toProject);

  const todayCommitments = commitments.filter((c) => {
    const t = new Date(c.startAt as string);
    return t >= todayStart && t <= todayEnd;
  });
  const upcomingCommitments = commitments
    .filter((c) => new Date(c.startAt as string) > todayEnd)
    .slice(0, 10);
  const billsToday = bills.filter((b) => {
    const t = new Date(b.dueDate as string);
    return t >= todayStart && t <= todayEnd;
  });
  const billsUntilSunday = bills.filter((b) => {
    const t = new Date(b.dueDate as string);
    return t >= todayStart && t <= sunday;
  });
  const billsUntilSundayTotal = billsUntilSunday.reduce((sum, b) => sum + b.amount, 0);

  const availableBalance = financePages[0] ? plainNumber(financePages[0].properties["Disponível"]) : 0;
  const projectedAfterCommitments = availableBalance - billsUntilSundayTotal;

  const churchProjects = projects.filter((p) => p.area === "igreja_ministerio");
  const devProjects = projects.filter((p) => p.area === "desenvolvimento");
  const devNeedsDecision = devProjects.filter((p) => p.needsDecision).length;
  const devAlerts = devProjects.filter((p) => p.hasAlert).length;

  return ok({
    today: { commitments: todayCommitments, bills: billsToday },
    upcomingCommitments,
    finance: {
      availableBalance,
      billsUntilSunday: billsUntilSundayTotal,
      projectedAfterCommitments,
    },
    projects: projects.filter((p) => p.area !== "igreja_ministerio"),
    church: churchProjects,
    dev: { needsDecision: devNeedsDecision, alerts: devAlerts },
  });
}
