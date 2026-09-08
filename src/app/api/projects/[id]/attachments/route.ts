import { db } from "@/lib/db";
import { ok, bad, parseBody } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Called by the client right after upload() resolves, with the blob's own
// metadata — this is what actually creates the Attachment row (see the
// upload/ route for why we don't rely on Vercel's onUploadCompleted webhook).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  const { id: projectId } = await params;

  const project = await db.project.findFirst({ where: { id: projectId, userId: session.userId } });
  if (!project) return bad("Not found", 404);

  const body = await parseBody(req);
  if (!body.url || !body.pathname || !body.fileName) return bad("url, pathname and fileName are required");

  const attachment = await db.attachment.create({
    data: {
      projectId,
      fileName: body.fileName,
      url: body.url,
      pathname: body.pathname,
      contentType: body.contentType || null,
      size: typeof body.size === "number" ? body.size : null,
    },
  });
  return ok(attachment);
}
