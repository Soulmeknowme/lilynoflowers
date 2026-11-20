import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./session";

/** Trả về userId của phiên hiện tại hoặc null */
export async function currentUserId() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export function unauthorized() {
  return Response.json({ error: "Chưa đăng nhập" }, { status: 401 });
}
