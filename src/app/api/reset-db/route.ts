import { db } from "@/lib/db";
import { ok, bad, getUserFromRequest } from "@/lib/auth-utils";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getUserFromRequest(req);
  if (!session) return bad("Unauthorized", 401);
  if (process.env.NODE_ENV === "production") return bad("Database reset is disabled in production", 403);

  try {
    const items = await db.item.findMany({ where: { userId: session.userId }, select: { id: true } });
    const itemIds = items.map((item) => item.id);
    const reviews = await db.review.findMany({ where: { userId: session.userId }, select: { id: true } });
    const reviewIds = reviews.map((review) => review.id);

    if (itemIds.length) {
      await db.habitLog.deleteMany({ where: { itemId: { in: itemIds } } });
      await db.reviewItem.deleteMany({ where: { OR: [{ itemId: { in: itemIds } }, ...(reviewIds.length ? [{ reviewId: { in: reviewIds } }] : [])] } });
      await db.link.deleteMany({ where: { OR: [{ fromId: { in: itemIds } }, { toId: { in: itemIds } }] } });
      await db.tagOnItem.deleteMany({ where: { itemId: { in: itemIds } } });
    } else if (reviewIds.length) {
      await db.reviewItem.deleteMany({ where: { reviewId: { in: reviewIds } } });
    }

    await db.review.deleteMany({ where: { userId: session.userId } });
    await db.item.deleteMany({ where: { userId: session.userId } });
    await db.project.deleteMany({ where: { userId: session.userId } });
    await db.tag.deleteMany({ where: { userId: session.userId } });
    await db.domain.deleteMany({ where: { userId: session.userId } });
    await db.setting.deleteMany({ where: { userId: session.userId } });

    return ok({ success: true, message: "Your development data was cleared. Other users were preserved." });
  } catch (e: any) {
    return bad(`Reset failed: ${e.message}`, 500);
  }
}
