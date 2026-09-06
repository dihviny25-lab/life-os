import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionUpdatePage, notionArchivePage, title, dateProp, numberProp, checkboxProp } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const body = await parseBody(req);
  const properties: Record<string, any> = {};
  if (typeof body.paid === "boolean") properties["Paga"] = checkboxProp(body.paid);
  if (typeof body.title === "string") properties["Título"] = title(body.title);
  if (body.amount !== undefined) properties["Valor"] = numberProp(Number(body.amount) || 0);
  if (body.dueDate) properties["Vencimento"] = dateProp(new Date(body.dueDate).toISOString());

  await notionUpdatePage(id, properties);
  return ok({ updated: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  await notionArchivePage(id);
  return ok({ deleted: true });
}
