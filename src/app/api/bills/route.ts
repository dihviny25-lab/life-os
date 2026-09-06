import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionQuery, notionCreatePage, DB, title, dateProp, numberProp, plainTitle, plainDate, plainNumber, plainCheckbox } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function toBill(page: any) {
  return {
    id: page.id,
    title: plainTitle(page.properties["Título"]),
    amount: plainNumber(page.properties["Valor"]),
    dueDate: plainDate(page.properties["Vencimento"]),
    paid: plainCheckbox(page.properties["Paga"]),
  };
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const pages = await notionQuery(DB.bills, {
    sorts: [{ property: "Vencimento", direction: "ascending" }],
  });
  return ok({ bills: pages.map(toBill) });
}

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  if (!body.title) return bad("title is required");
  if (!body.dueDate) return bad("dueDate is required");

  const page = await notionCreatePage(DB.bills, {
    "Título": title(body.title),
    "Valor": numberProp(Number(body.amount) || 0),
    "Vencimento": dateProp(new Date(body.dueDate).toISOString()),
  });
  return ok(toBill(page));
}
