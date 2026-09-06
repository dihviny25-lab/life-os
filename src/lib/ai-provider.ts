// AI Provider abstraction — supports z-ai-sdk, OpenAI-compatible, and custom endpoints
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { getUserFromRequest } from "./auth-utils";
import type { NextRequest } from "next/server";

export interface AIPrefs {
  aiEnabled: boolean;
  aiProvider: "z-ai-sdk" | "openai-compatible" | "custom";
  aiApiKey: string;
  aiBaseUrl: string;
  aiModel: string;
}

const DEFAULT_PREFS: AIPrefs = { aiEnabled: true, aiProvider: "z-ai-sdk", aiApiKey: "", aiBaseUrl: "", aiModel: "" };
const DISABLED_PREFS: AIPrefs = { ...DEFAULT_PREFS, aiEnabled: false };

export async function getAIPrefs(req: NextRequest): Promise<AIPrefs> {
  const session = await getUserFromRequest(req);
  if (!session) return DISABLED_PREFS;

  const setting = await db.setting.findUnique({
    where: { userId_key: { userId: session.userId, key: "preferences" } },
  });
  if (!setting) return DEFAULT_PREFS;

  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(setting.value) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function aiChatCompletion(prefs: AIPrefs, messages: { role: string; content: string }[]): Promise<string> {
  if (!prefs.aiEnabled) throw new Error("AI features are disabled");
  if (prefs.aiProvider === "z-ai-sdk" || (!prefs.aiApiKey && !prefs.aiBaseUrl)) {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({ messages: messages as any, thinking: { type: "disabled" } });
    return completion.choices[0]?.message?.content || "";
  }
  if (prefs.aiProvider === "openai-compatible" || prefs.aiProvider === "custom") {
    const baseUrl = prefs.aiBaseUrl || "https://api.openai.com/v1";
    const model = prefs.aiModel || "gpt-4o-mini";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (prefs.aiApiKey) headers["Authorization"] = `Bearer ${prefs.aiApiKey}`;
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST", headers,
      body: JSON.stringify({ model, messages: messages.map((m) => ({ role: m.role, content: m.content })), temperature: 0.7 }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI API error (${res.status}): ${err.slice(0, 200)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "";
  }
  throw new Error(`Unknown AI provider: ${prefs.aiProvider}`);
}
