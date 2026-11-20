import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { llm, MODEL } from "@/lib/llm";
import { currentUserId, unauthorized } from "@/lib/auth";
import { detectCrisis } from "@/lib/crisis";
import { systemPrompt } from "@/lib/prompts";
import { updateMemory } from "@/lib/memory";

const Body = z.object({
  conversationId: z.string().optional(),
  message: z.string().trim().min(1).max(4000),
});

const HISTORY_LIMIT = 30; // số tin nhắn gần nhất gửi kèm cho model
const MEMORY_EVERY = 4; // cập nhật sổ ghi nhớ sau mỗi N tin nhắn của người dùng

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return unauthorized();

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Tin nhắn không hợp lệ" }, { status: 400 });
  const { message } = parsed.data;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return unauthorized();

  // Lấy hoặc tạo cuộc trò chuyện
  let conversation = parsed.data.conversationId
    ? await db.conversation.findFirst({ where: { id: parsed.data.conversationId, userId } })
    : null;
  if (!conversation) {
    conversation = await db.conversation.create({
      data: { userId, title: message.slice(0, 60) },
    });
  }
  const conversationId = conversation.id;

  const crisis = detectCrisis(message);
  await db.message.create({ data: { conversationId, role: "user", content: message, crisis } });

  const history = (
    await db.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    })
  ).reverse();

  let completion;
  try {
    completion = await llm.chat.completions.create({
      model: MODEL,
      stream: true,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt({ name: user.name, memory: user.memory, crisis }) },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
    });
  } catch (err) {
    console.error("LLM error", err);
    return Response.json({ error: "Không kết nối được với AI, hãy thử lại." }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } catch (err) {
        console.error("Stream error", err);
        controller.enqueue(encoder.encode("\n\n[Kết nối bị gián đoạn, bạn thử gửi lại nhé.]"));
      } finally {
        if (full) {
          await db.message.create({ data: { conversationId, role: "assistant", content: full } });
          await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        }
        controller.close();
      }
    },
  });

  // Cập nhật bộ nhớ dài hạn sau khi đã trả lời xong, không làm chậm phản hồi
  const userTurns = history.filter((m) => m.role === "user").length;
  if (userTurns % MEMORY_EVERY === 0 || crisis) {
    after(async () => {
      await updateMemory(userId, conversationId).catch((e) => console.error("Memory error", e));
    });
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": conversationId,
      ...(crisis ? { "X-Crisis": crisis } : {}),
    },
  });
}
