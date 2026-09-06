import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionUpdatePage, notionArchivePage, title, richText, selectProp, checkboxProp } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  const body = await parseBody(req);
  const properties: Record<string, any> = {};
  if (typeof body.name === "string") properties["Nome"] = title(body.name);
  if (typeof body.area === "string") properties["Área"] = selectProp(body.area);
  if (body.statusNote !== undefined) properties["Status"] = richText(body.statusNote || "");
  if (typeof body.needsDecision === "boolean") properties["Precisa decisão"] = checkboxProp(body.needsDecision);
  if (typeof body.hasAlert === "boolean") properties["Tem alerta"] = checkboxProp(body.hasAlert);

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
