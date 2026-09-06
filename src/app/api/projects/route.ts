import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionQuery, notionCreatePage, DB, title, richText, selectProp, checkboxProp, plainTitle, plainSelect, plainText, plainCheckbox } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

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

  const pages = await notionQuery(DB.projects);
  return ok({ projects: pages.map(toProject) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.name) return bad("name is required");
  if (!body.area) return bad("area is required");

  const page = await notionCreatePage(DB.projects, {
    Nome: title(body.name),
    "Área": selectProp(body.area),
    ...(body.statusNote ? { Status: richText(body.statusNote) } : {}),
    "Precisa decisão": checkboxProp(!!body.needsDecision),
    "Tem alerta": checkboxProp(!!body.hasAlert),
  });
  return ok(toProject(page));
}
