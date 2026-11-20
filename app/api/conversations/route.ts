import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });
  return Response.json({ conversations });
}
