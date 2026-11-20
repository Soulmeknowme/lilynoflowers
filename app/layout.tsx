import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "An – Người đồng hành về các mối quan hệ",
  description: "AI lắng nghe và tư vấn về tình yêu, gia đình, bạn bè và đồng nghiệp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
