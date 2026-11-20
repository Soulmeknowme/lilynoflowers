"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) router.replace("/chat");
    else setError((await res.json().catch(() => ({}))).error || "Có lỗi xảy ra");
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="auth">
      <form className="auth-card" onSubmit={submit}>
        <h1>Chào bạn 🌿</h1>
        <p className="sub">Mình là An, luôn sẵn sàng lắng nghe chuyện các mối quan hệ của bạn.</p>
        {mode === "register" && (
          <label className="field">
            Tên bạn muốn được gọi
            <input value={form.name} onChange={set("name")} required maxLength={50} />
          </label>
        )}
        <label className="field">
          Email
          <input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
        </label>
        <label className="field">
          Mật khẩu
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
        {error && <div className="error">{error}</div>}
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
        </button>
        <p style={{ textAlign: "center", marginTop: 14 }}>
          {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button type="button" className="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "Đăng ký" : "Đăng nhập"}
          </button>
        </p>
        <p className="disclaimer">
          An là AI hỗ trợ, không thay thế chuyên gia tâm lý. Nếu bạn đang gặp nguy hiểm, hãy gọi 115 hoặc 113.
        </p>
      </form>
    </div>
  );
}
