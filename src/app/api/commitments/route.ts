import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionQuery, notionCreatePage, DB, title, dateProp, richText, plainTitle, plainDate, plainText } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function toCommitment(page: any) {
  return {
    id: page.id,
    title: plainTitle(page.properties["Título"]),
    startAt: plainDate(page.properties["Data e hora"]),
    location: plainText(page.properties["Local"]) || null,
  };
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const pages = await notionQuery(DB.commitments, {
    sorts: [{ property: "Data e hora", direction: "ascending" }],
  });
  return ok({ commitments: pages.map(toCommitment) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (!body.startAt) return bad("startAt is required");

  const page = await notionCreatePage(DB.commitments, {
    "Título": title(body.title),
    "Data e hora": dateProp(new Date(body.startAt).toISOString()),
    ...(body.location ? { Local: richText(body.location) } : {}),
  });
  return ok(toCommitment(page));
}
