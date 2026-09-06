import { db } from "@/lib/db";
import { ok, bad, parseBody, getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_PREFS = {
  aiEnabled: true,
  aiSmartInbox: true,
  aiProvider: "z-ai-sdk",
  aiApiKey: "",
  aiBaseUrl: "",
  aiModel: "",
  qrLoginEnabled: true,
  notificationsEnabled: false,
};

export async function GET(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const setting = await db.setting.findUnique({ where: { userId_key: { userId: session.userId, key: "preferences" } } });
  const prefs = setting ? { ...DEFAULT_PREFS, ...JSON.parse(setting.value) } : DEFAULT_PREFS;
  const { aiApiKey, ...safePrefs } = prefs;
  return ok({ ...safePrefs, hasApiKey: !!aiApiKey });
}

export async function PATCH(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const body = await parseBody(req);
  const existing = await db.setting.findUnique({ where: { userId_key: { userId: session.userId, key: "preferences" } } });
  const current = existing ? JSON.parse(existing.value) : DEFAULT_PREFS;
  const merged = { ...current, ...body };
  if (body.aiApiKey === "") merged.aiApiKey = current.aiApiKey || "";
  await db.setting.upsert({
    where: { userId_key: { userId: session.userId, key: "preferences" } },
    update: { value: JSON.stringify(merged) },
    create: { userId: session.userId, key: "preferences", value: JSON.stringify(merged) },
  });
  const { aiApiKey, ...safePrefs } = merged;
  return ok({ ...safePrefs, hasApiKey: !!aiApiKey });
}
