import { db } from "./db";
import { llm, MODEL } from "./llm";
import { MEMORY_PROMPT } from "./prompts";

/** Cập nhật sổ ghi nhớ dài hạn của người dùng từ các tin nhắn gần nhất. */
export async function updateMemory(userId: string, conversationId: string) {
  const [user, recent] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { memory: true } }),
    db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 12,
    }),
  ]);
  if (!user) return;

  const transcript = recent
    .reverse()
    .map((m) => `${m.role === "user" ? "Người dùng" : "Trợ lý"}: ${m.content}`)
    .join("\n");

  const res = await llm.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: "system", content: MEMORY_PROMPT },
      {
        role: "user",
        content: `## Sổ ghi nhớ hiện tại\n${user.memory || "(trống)"}\n\n## Hội thoại mới\n${transcript}`,
      },
    ],
  });

  const memory = res.choices[0]?.message?.content?.trim();
  if (memory) await db.user.update({ where: { id: userId }, data: { memory } });
}
