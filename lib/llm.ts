import OpenAI from "openai";

// DeepSeek dùng API tương thích OpenAI.
// Tạo client khi cần (không tạo lúc build, vì khi đó có thể chưa có API key).
let client: OpenAI | null = null;

export function getLLM() {
  if (!client) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY chưa được cấu hình");
    client = new OpenAI({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });
  }
  return client;
}

export const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
