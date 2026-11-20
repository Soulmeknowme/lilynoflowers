import OpenAI from "openai";

// DeepSeek dùng API tương thích OpenAI
export const llm = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
});

export const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
