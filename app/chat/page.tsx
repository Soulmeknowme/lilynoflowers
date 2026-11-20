"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { id?: string; role: "user" | "assistant"; content: string; crisis?: string | null };
type Conv = { id: string; title: string };

const HOTLINES = [
  ["Cấp cứu y tế", "115"],
  ["Công an", "113"],
  ["Tổng đài bảo vệ trẻ em", "111"],
  ["Đường dây nóng Ngày Mai (tâm lý)", "096 306 1414"],
];

const STARTERS = [
  "Mình và người yêu hay cãi nhau vì chuyện nhỏ",
  "Bố mẹ áp lực chuyện cưới xin",
  "Mình thấy cô đơn dù có nhiều bạn",
  "Đồng nghiệp hay lấn át mình",
];

export default function ChatPage() {
  const router = useRouter();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [crisis, setCrisis] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const res = await fetch("/api/conversations");
    if (res.status === 401) return router.replace("/login");
    setConvs((await res.json()).conversations);
  }, [router]);

  useEffect(() => { loadConvs(); }, [loadConvs]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function openConv(id: string) {
    setSidebarOpen(false);
    if (streaming) return;
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const { conversation } = await res.json();
    setActiveId(id);
    setMessages(conversation.messages);
    setCrisis(conversation.messages.some((m: Msg) => m.crisis));
  }

  function newConv() {
    setSidebarOpen(false);
    if (streaming) return;
    setActiveId(null);
    setMessages([]);
    setCrisis(false);
  }

  async function deleteConv(id: string) {
    if (!confirm("Xóa cuộc trò chuyện này?")) return;
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (id === activeId) newConv();
    loadConvs();
  }

  async function send(text: string) {
    text = text.trim();
    if (!text || streaming) return;
    setInput("");
    setStreaming(true);
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: activeId, message: text }),
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))).error || "Có lỗi xảy ra, bạn thử lại nhé.";
        setMessages((m) => [...m.slice(0, -1), { role: "assistant", content: err }]);
        return;
      }
      if (res.headers.get("X-Crisis")) setCrisis(true);
      const newId = res.headers.get("X-Conversation-Id");
      if (newId && newId !== activeId) setActiveId(newId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const last = m[m.length - 1];
          return [...m.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      }
      loadConvs();
    } finally {
      setStreaming(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="app">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-head">
          <strong>🌿 An</strong>
          <button className="btn" onClick={newConv}>+ Cuộc trò chuyện mới</button>
        </div>
        <div className="conv-list">
          {convs.map((c) => (
            <div key={c.id} className={`conv ${c.id === activeId ? "active" : ""}`} onClick={() => openConv(c.id)}>
              <span>{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }} aria-label="Xóa">✕</button>
            </div>
          ))}
        </div>
        <div className="sidebar-foot">
          <button className="btn" onClick={() => setMemoryOpen(true)}>Điều An nhớ</button>
          <button className="btn" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="main" onClick={() => sidebarOpen && setSidebarOpen(false)}>
        <div className="topbar">
          <button className="btn" onClick={(e) => { e.stopPropagation(); setSidebarOpen(true); }}>☰</button>
          <strong>An</strong>
        </div>

        <div className="messages">
          {crisis && (
            <div className="crisis" role="alert">
              <strong>Bạn không phải một mình. Nếu bạn đang gặp nguy hiểm, hãy liên hệ ngay:</strong>
              <ul>
                {HOTLINES.map(([n, num]) => (
                  <li key={num}>{n}: <a href={`tel:${num.replace(/\s/g, "")}`}>{num}</a></li>
                ))}
              </ul>
            </div>
          )}
          <div className="messages-inner">
            {messages.length === 0 ? (
              <div className="welcome">
                <h2>Hôm nay bạn muốn chia sẻ điều gì?</h2>
                <p>Chuyện tình cảm, gia đình, bạn bè hay nơi làm việc — mình ở đây để lắng nghe, không phán xét.</p>
                <div className="starters">
                  {STARTERS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id ?? i} className={`msg ${m.role}`}>
                  {m.content || <span className="typing">An đang suy nghĩ…</span>}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="composer">
          <form onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <textarea
              rows={1}
              value={input}
              placeholder="Viết điều bạn đang nghĩ…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send(input);
                }
              }}
            />
            <button className="send" disabled={streaming || !input.trim()}>Gửi</button>
          </form>
          <div className="note">An là AI, có thể sai sót và không thay thế chuyên gia tâm lý.</div>
        </div>
      </main>

      {memoryOpen && <MemoryModal onClose={() => setMemoryOpen(false)} />}
    </div>
  );
}

function MemoryModal({ onClose }: { onClose: () => void }) {
  const [memory, setMemory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/memory").then((r) => r.json()).then((d) => setMemory(d.memory ?? ""));
  }, []);

  async function save(value: string) {
    setSaving(true);
    await fetch("/api/memory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memory: value }),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Điều An ghi nhớ về bạn</h3>
        <p>An tự ghi chú sau các cuộc trò chuyện để hiểu bạn hơn. Bạn có thể sửa hoặc xóa bất kỳ lúc nào.</p>
        <textarea
          value={memory ?? "Đang tải…"}
          disabled={memory === null}
          onChange={(e) => setMemory(e.target.value)}
          placeholder="(Chưa có ghi chú nào)"
        />
        <div className="modal-actions">
          <button className="btn" onClick={() => { if (confirm("Xóa toàn bộ ghi nhớ?")) save(""); }}>Xóa hết</button>
          <button className="btn" onClick={onClose}>Đóng</button>
          <button className="btn btn-primary" style={{ width: "auto" }} disabled={saving || memory === null} onClick={() => save(memory ?? "")}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
