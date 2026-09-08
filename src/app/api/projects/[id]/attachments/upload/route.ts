import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Client uploads go straight to Blob storage — this route only ever
// authorizes the upload token (onBeforeGenerateToken). The Attachment row
// itself is created by the client right after upload() resolves (see
// POST /api/projects/[id]/attachments), not here — Vercel's onUploadCompleted
// webhook needs a publicly reachable URL and isn't reliable to build against
// during development.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        const session = await getUserFromRequest(req);
        if (!session) throw new Error("Unauthorized");
        const project = await db.project.findFirst({ where: { id: projectId, userId: session.userId } });
        if (!project) throw new Error("Not found");

        return {
          addRandomSuffix: true,
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"],
          tokenPayload: JSON.stringify({ projectId }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
