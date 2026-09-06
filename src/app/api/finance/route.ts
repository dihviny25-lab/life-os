import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { notionQuery, notionCreatePage, notionUpdatePage, DB, title, numberProp, dateProp, plainNumber } from "@/lib/notion";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function latestFinanceRow() {
  const pages = await notionQuery(DB.finance, {
    sorts: [{ timestamp: "created_time", direction: "descending" }],
    page_size: 1,
  });
  return pages[0] || null;
}

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const row = await latestFinanceRow();
  return ok({ availableBalance: row ? plainNumber(row.properties["Disponível"]) : 0 });
}

export async function PUT(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);

  const body = await parseBody(req);
  const availableBalance = Number(body.availableBalance);
  if (Number.isNaN(availableBalance)) return bad("availableBalance must be a number");

  const now = new Date();
  const row = await latestFinanceRow();
  if (row) {
    await notionUpdatePage(row.id, {
      "Disponível": numberProp(availableBalance),
      "Atualizado em": dateProp(now.toISOString()),
    });
  } else {
    await notionCreatePage(DB.finance, {
      Semana: title(now.toISOString().slice(0, 10)),
      "Disponível": numberProp(availableBalance),
      "Atualizado em": dateProp(now.toISOString()),
    });
  }
  return ok({ availableBalance });
}
