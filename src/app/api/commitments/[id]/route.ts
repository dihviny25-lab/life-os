import { ok, bad } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionArchivePage } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id } = await params;

  await notionArchivePage(id);
  return ok({ deleted: true });
}
