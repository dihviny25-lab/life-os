import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { computeProjectProgress, orderTasks } from "@/lib/projects";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const project = await db.project.findFirst({
    where: { id, userId: session.userId },
    include: {
      tasks: true,
      stages: { orderBy: { order: "asc" } },
      notes: { orderBy: { createdAt: "desc" } },
      decisions: { orderBy: { createdAt: "desc" } },
      commitments: { orderBy: { startAt: "asc" } },
      bills: { orderBy: { dueDate: "asc" } },
      transactions: { orderBy: { date: "desc" } },
      envelopes: { orderBy: { createdAt: "asc" } },
      links: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return bad("Not found", 404);

  const { tasks, stages, notes, decisions, commitments, bills, transactions, envelopes, links, ...rest } = project;
  const progress = computeProjectProgress(tasks, stages);
  const ordered = orderTasks(tasks, stages);
  const stagesWithTasks = stages.map((s) => ({ ...s, tasks: ordered.filter((t) => t.stageId === s.id) }));
  const tasksSemEtapa = ordered.filter((t) => !t.stageId);

  const comprometido = bills.filter((b) => !b.paid).reduce((sum, b) => sum + b.amount, 0);
  const gasto = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const guardado = envelopes.reduce((sum, e) => sum + e.allocated, 0);

  return ok({
    project: rest,
    progress,
    stages: stagesWithTasks,
    tasksSemEtapa,
    notes,
    decisions,
    commitments,
    bills,
    transactions,
    envelopes,
    links,
    financeiro: {
      orcamento: rest.orcamento,
      comprometido,
      gasto,
      guardado,
      faltaGuardar: rest.orcamento != null ? Math.max(0, rest.orcamento - guardado) : null,
      disponivel: rest.orcamento != null ? rest.orcamento - comprometido - gasto : null,
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.area === "string") data.area = body.area;
  if (body.objetivo !== undefined) data.objetivo = body.objetivo || null;
  if (body.statusNote !== undefined) data.statusNote = body.statusNote || null;
  if (typeof body.status === "string") data.status = body.status;
  if (body.esperandoMotivo !== undefined) data.esperandoMotivo = body.esperandoMotivo || null;
  if (typeof body.prioridade === "string") data.prioridade = body.prioridade;
  if (body.prazo !== undefined) data.prazo = body.prazo ? new Date(body.prazo) : null;
  if (body.orcamento !== undefined) data.orcamento = typeof body.orcamento === "number" ? body.orcamento : null;
  if (body.metaContribuicao !== undefined) data.metaContribuicao = typeof body.metaContribuicao === "number" ? body.metaContribuicao : null;
  if (body.metaFrequencia !== undefined) data.metaFrequencia = body.metaFrequencia || null;
  if (typeof body.hasAlert === "boolean") data.hasAlert = body.hasAlert;
  if (typeof body.archived === "boolean") data.archived = body.archived;

  const project = await db.project.update({ where: { id }, data });
  return ok(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.project.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.project.delete({ where: { id } });
  return ok({ deleted: true });
}
