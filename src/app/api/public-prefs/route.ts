import { ok } from "@/lib/api";

export const dynamic = "force-dynamic";

// Public endpoint intentionally exposes only global, non-sensitive feature flags.
// QR login remains disabled until its authentication flow is redesigned for
// serverless execution and verified against 2FA requirements.
export async function GET() {
  return ok({ qrLoginEnabled: false });
}
