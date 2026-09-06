import { db } from "@/lib/db";
import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ area: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { area } = await params;

  const [commitments, bills, projects] = await Promise.all([
    db.commitment.findMany({ where: { userId: session.userId, area, archived: false }, orderBy: { startAt: "asc" } }),
    db.bill.findMany({ where: { userId: session.userId, area }, orderBy: { dueDate: "asc" } }),
    db.project.findMany({
      where: { userId: session.userId, area, archived: false },
      orderBy: { createdAt: "asc" },
      include: { tasks: { orderBy: { createdAt: "asc" } } },
    }),
  ]);

  return ok({ commitments, bills, projects });
}
