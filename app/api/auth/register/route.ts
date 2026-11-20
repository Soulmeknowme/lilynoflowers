import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, cookieOptions, signSession } from "@/lib/session";

const Body = z.object({
  name: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Thông tin không hợp lệ (mật khẩu tối thiểu 8 ký tự)" }, { status: 400 });
  }
  const { name, email, password } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return Response.json({ error: "Email đã được sử dụng" }, { status: 409 });
  }
  const user = await db.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
  });

  (await cookies()).set(SESSION_COOKIE, await signSession(user.id), cookieOptions);
  return Response.json({ ok: true });
}
