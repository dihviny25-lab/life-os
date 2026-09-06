// Minimal Notion API client for the app's dashboard data
// (commitments, bills, projects, finance). Requires NOTION_TOKEN.

const NOTION_VERSION = "2022-06-28";
const BASE = "https://api.notion.com/v1";

export const DB = {
  commitments: "8970c30dba3148af97fe82d93ddded07",
  bills: "e5490772ba924289bf062f33995c77e5",
  projects: "1233b96b7c0e425e8cadb708fbc0ea6d",
  finance: "b48057dd126047c380b2510e6d4e08eb",
};

function headers() {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error("NOTION_TOKEN não configurado");
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

export async function notionQuery(databaseId: string, body: Record<string, any> = {}) {
  const res = await fetch(`${BASE}/databases/${databaseId}/query`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Notion query failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.results as any[];
}

export async function notionCreatePage(databaseId: string, properties: Record<string, any>) {
  const res = await fetch(`${BASE}/pages`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ parent: { database_id: databaseId }, properties }),
  });
  if (!res.ok) throw new Error(`Notion create failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function notionUpdatePage(pageId: string, properties: Record<string, any>) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ properties }),
  });
  if (!res.ok) throw new Error(`Notion update failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function notionArchivePage(pageId: string) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ archived: true }),
  });
  if (!res.ok) throw new Error(`Notion archive failed: ${res.status} ${await res.text()}`);
  return res.json();
}

// property builders
export const title = (s: string) => ({ title: [{ text: { content: s } }] });
export const richText = (s: string) => ({ rich_text: [{ text: { content: s } }] });
export const dateProp = (iso: string) => ({ date: { start: iso } });
export const numberProp = (n: number) => ({ number: n });
export const checkboxProp = (b: boolean) => ({ checkbox: b });
export const selectProp = (name: string) => ({ select: { name } });

// property readers
export const plainTitle = (prop: any): string => prop?.title?.[0]?.plain_text || "";
export const plainText = (prop: any): string => prop?.rich_text?.[0]?.plain_text || "";
export const plainDate = (prop: any): string | null => prop?.date?.start || null;
export const plainNumber = (prop: any): number => (typeof prop?.number === "number" ? prop.number : 0);
export const plainCheckbox = (prop: any): boolean => !!prop?.checkbox;
export const plainSelect = (prop: any): string => prop?.select?.name || "";
