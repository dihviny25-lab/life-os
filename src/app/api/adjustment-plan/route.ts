import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import {
  ADJUSTMENT_PLAN_MARKER,
  ADJUSTMENT_PLAN_NAME,
  ADJUSTMENT_STAGES,
  DEVELOPMENT_WIP_LIMIT,
  OPERATING_RULES,
} from "@/lib/adjustment-plan";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function getPlanData(userId: string) {
  const [plan, developmentProjects, finance, weeklyBudgets] = await Promise.all([
    db.project.findFirst({
      where: {
        userId,
        statusNote: ADJUSTMENT_PLAN_MARKER,
        archived: false,
      },
      include: {
        stages: {
          orderBy: { order: "asc" },
          include: { tasks: { orderBy: { order: "asc" } } },
        },
        decisions: { orderBy: { createdAt: "asc" } },
      },
    }),
    db.project.findMany({
      where: {
        userId,
        area: "desenvolvimento",
        archived: false,
        status: { notIn: ["concluido", "descartado"] },
      },
      orderBy: [{ prioridade: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        status: true,
        prioridade: true,
        prazo: true,
      },
    }),
    db.finance.findUnique({
      where: { userId },
      select: { weeklyBaseIncome: true },
    }),
    db.weeklyBudget.findMany({
      where: { userId },
      select: { amount: true, kind: true },
    }),
  ]);

  const weeklyBaseIncome = finance?.weeklyBaseIncome ?? 1500;
  const weeklyBudgetTotal = weeklyBudgets.reduce((sum, item) => sum + item.amount, 0);
  const activeDevelopment = developmentProjects.filter((project) => project.status === "ativo");

  if (!plan) {
    return {
      initialized: false as const,
      system: {
        weeklyBaseIncome,
        weeklyBudgetTotal,
        developmentWipLimit: DEVELOPMENT_WIP_LIMIT,
        activeDevelopmentCount: activeDevelopment.length,
        developmentProjects,
      },
    };
  }

  const stages = plan.stages.map((stage) => {
    const definition = ADJUSTMENT_STAGES[stage.order];
    const done = stage.tasks.filter((task) => task.done).length;
    return {
      id: stage.id,
      key: definition?.key ?? `ajuste-${stage.order + 1}`,
      title: stage.name,
      summary: definition?.summary ?? "",
      objective: definition?.objective ?? "presenca",
      order: stage.order,
      progress: {
        done,
        total: stage.tasks.length,
        percent: stage.tasks.length === 0 ? 0 : Math.round((done / stage.tasks.length) * 100),
      },
      tasks: stage.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        done: task.done,
      })),
    };
  });

  const allTasks = stages.flatMap((stage) => stage.tasks);
  const completedTasks = allTasks.filter((task) => task.done).length;

  return {
    initialized: true as const,
    plan: {
      id: plan.id,
      name: plan.name,
      deadline: plan.prazo,
      progress: {
        done: completedTasks,
        total: allTasks.length,
        percent: allTasks.length === 0 ? 0 : Math.round((completedTasks / allTasks.length) * 100),
      },
      stages,
      rules: plan.decisions.map((decision) => ({ id: decision.id, body: decision.body })),
    },
    system: {
      weeklyBaseIncome,
      weeklyBudgetTotal,
      developmentWipLimit: DEVELOPMENT_WIP_LIMIT,
      activeDevelopmentCount: activeDevelopment.length,
      developmentProjects,
    },
  };
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  return ok(await getPlanData(session.userId));
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const projectId = await db.$transaction(async (tx) => {
    const existing = await tx.project.findFirst({
      where: {
        userId: session.userId,
        statusNote: ADJUSTMENT_PLAN_MARKER,
        archived: false,
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 90);

    const project = await tx.project.create({
      data: {
        userId: session.userId,
        name: ADJUSTMENT_PLAN_NAME,
        area: "pessoal",
        objetivo:
          "Reduzir fragmentação, estabilizar as finanças, transformar desenvolvimento em renda e recuperar presença com a família.",
        statusNote: ADJUSTMENT_PLAN_MARKER,
        status: "ativo",
        prioridade: "alta",
        prazo: deadline,
        stages: {
          create: ADJUSTMENT_STAGES.map((stage, stageIndex) => ({
            name: stage.title,
            order: stageIndex,
          })),
        },
        decisions: {
          create: OPERATING_RULES.map((body) => ({ body })),
        },
      },
      include: { stages: { orderBy: { order: "asc" } } },
    });

    for (const stage of project.stages) {
      await tx.task.createMany({
          data: ADJUSTMENT_STAGES[stage.order].tasks.map((title, taskIndex) => ({
            projectId: project.id,
            stageId: stage.id,
            title,
            order: taskIndex,
          })),
      });
    }

    return project.id;
  });

  return ok({ projectId }, { status: 201 });
}
