# An – AI tư vấn các mối quan hệ

Web app chat (Next.js 15) dùng DeepSeek làm lõi, tư vấn chuyện tình cảm, gia đình, bạn bè, đồng nghiệp.

## Chạy local
```bash
npm install
cp .env.example .env      # điền DEEPSEEK_API_KEY, DEEPSEEK_MODEL, AUTH_SECRET
npx prisma db push
npm run dev               # http://localhost:3000
```

## Tính năng
- **Tư vấn**: system prompt trong `lib/prompts.ts` (Gottman, NVC, thuyết gắn bó, CBT; giọng ấm áp, tiếng Việt).
- **Bộ nhớ dài hạn**: cứ mỗi 4 lượt người dùng, `lib/memory.ts` cho AI tóm tắt lại "sổ ghi nhớ" về người dùng và các mối quan hệ của họ. Sổ này được đưa vào mọi cuộc trò chuyện mới. Người dùng xem, sửa, xóa được qua nút "Điều An nhớ".
- **Phát hiện khủng hoảng**: `lib/crisis.ts` quét từ khóa tự hại hoặc bạo lực → chèn chỉ dẫn ưu tiên an toàn vào prompt và hiện banner đường dây nóng.
- **Tài khoản**: email/mật khẩu (bcrypt), session JWT trong cookie httpOnly; middleware chặn `/chat` và các API.

## Cấu trúc
```
app/api/chat           streaming chat + kích hoạt cập nhật bộ nhớ
app/api/auth/*         đăng ký / đăng nhập / đăng xuất
app/api/conversations  danh sách, xem, xóa cuộc trò chuyện
app/api/memory         xem / sửa bộ nhớ
lib/                   prompts, crisis, memory, llm, session, db
```

## Trước khi ra mắt
- Kiểm tra lại các số đường dây nóng trong `lib/crisis.ts`.
- Deploy Vercel: thêm Prisma Postgres, điền `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `AUTH_SECRET`; bảng được tạo tự động lúc build (`vercel-build`).
- Thêm giới hạn tần suất (rate limit) cho `/api/chat` và đăng nhập.
- Cân nhắc mã hóa nội dung tin nhắn, có chính sách quyền riêng tư và điều khoản sử dụng rõ ràng.
