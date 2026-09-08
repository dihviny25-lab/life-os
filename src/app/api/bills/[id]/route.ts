import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { logBalanceHistory } from "@/lib/finance";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.bill.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  const body = await parseBody(req);
  const data: Record<string, any> = {};
  if (typeof body.paid === "boolean") data.paid = body.paid;
  if (typeof body.title === "string") data.title = body.title;
  if (body.amount !== undefined) data.amount = Number(body.amount) || 0;
  if (body.dueDate) data.dueDate = new Date(body.dueDate);
  if (typeof body.priority === "string") data.priority = body.priority;
  if (body.area !== undefined) data.area = body.area || null;
  if (body.recurring !== undefined) {
    data.recurring = body.recurring || null;
    if (!body.recurring) {
      data.installments = null;
      data.installmentNumber = null;
    }
  }
  if (body.installments !== undefined) {
    data.installments = Number(body.installments) > 0 ? Number(body.installments) : null;
    data.installmentNumber = data.installments ? existing.installmentNumber || 1 : null;
  }

  const bill = await db.bill.update({ where: { id }, data });

  // Paying a bill is real money leaving the account — move it out of the
  // static saldo, and release any envelope that had been set aside for it
  // (that money is now spent, not "committed" anymore). Undoing a paid mark
  // credits the amount back, though the original envelope isn't restored.
  if (data.paid === true && !existing.paid) {
    data.paidAt = new Date();
    const finance = await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: -existing.amount },
      update: { currentBalance: { decrement: existing.amount } },
    });
    await logBalanceHistory(session.userId, finance.currentBalance);
    await db.envelope.deleteMany({ where: { billId: id } });
  } else if (data.paid === false && existing.paid) {
    data.paidAt = null;
    const finance = await db.finance.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, currentBalance: existing.amount },
      update: { currentBalance: { increment: existing.amount } },
    });
    await logBalanceHistory(session.userId, finance.currentBalance);
  }

  // Marking a recurring bill as paid rolls the next occurrence forward
  // automatically — unless it's on a fixed number of parcelas and this was
  // the last one, in which case the series just ends (nothing left to roll).
  const nextInstallmentNumber = existing.installments ? (existing.installmentNumber || 1) + 1 : null;
  const seriesFinished = existing.installments != null && nextInstallmentNumber != null && nextInstallmentNumber > existing.installments;

  if (data.paid === true && existing.recurring && !seriesFinished) {
    const next = new Date(existing.dueDate);
    if (existing.recurring === "monthly") next.setMonth(next.getMonth() + 1);
    else if (existing.recurring === "weekly") next.setDate(next.getDate() + 7);
    await db.bill.create({
      data: {
        userId: session.userId,
        title: existing.title,
        amount: existing.amount,
        dueDate: next,
        area: existing.area,
        priority: existing.priority,
        recurring: existing.recurring,
        installments: existing.installments,
        installmentNumber: nextInstallmentNumber,
      },
    });
  }

  return ok(bill);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const existing = await db.bill.findFirst({ where: { id, userId: session.userId } });
  if (!existing) return bad("Not found", 404);

  await db.bill.delete({ where: { id } });
  return ok({ deleted: true });
}
