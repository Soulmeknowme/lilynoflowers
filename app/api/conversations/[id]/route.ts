import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  const conv = await db.conversation.findFirst({
    where: { id, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, crisis: true },
      },
    },
  });
  if (!conv) return Response.json({ error: "Không tìm thấy" }, { status: 404 });
  return Response.json({ conversation: conv });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const { id } = await params;
  await db.conversation.deleteMany({ where: { id, userId } });
  return Response.json({ ok: true });
}
