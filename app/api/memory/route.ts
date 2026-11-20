import { z } from "zod";
import { db } from "@/lib/db";
import { currentUserId, unauthorized } from "@/lib/auth";

// Người dùng có quyền xem, sửa và xóa những gì AI ghi nhớ về họ
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, memory: true } });
  if (!user) return unauthorized();
  return Response.json(user);
}

export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();
  const parsed = z.object({ memory: z.string().max(5000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Không hợp lệ" }, { status: 400 });
  await db.user.update({ where: { id: userId }, data: { memory: parsed.data.memory } });
  return Response.json({ ok: true });
}
