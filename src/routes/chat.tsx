import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { chatWithCoach } from "@/lib/ai.functions";
import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Your Agent — athletIQ" }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; created_at?: string };

function AgentAvatar() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground">
      AQ
    </div>
  );
}

function formatTime(ts?: string) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const send = useServerFn(chatWithCoach);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase
        .from("athlete_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!p) return navigate({ to: "/onboarding", replace: true });
      if (!p.onboarding_complete) return navigate({ to: "/onboarding", replace: true });
      setProfile(p);
      const { data: msgs } = await supabase
        .from("conversations")
        .select("*")
        .eq("athlete_id", p.id)
        .order("created_at", { ascending: true });
      setMessages((msgs ?? []) as any);
    })();
  }, [user, navigate]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [profile]);

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || !profile || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text, created_at: new Date().toISOString() }]);
    setSending(true);
    try {
      const { reply } = await send({ data: { athleteId: profile.id, message: text } });
      setMessages((m) => [...m, { role: "assistant", content: reply, created_at: new Date().toISOString() }]);
    } catch (e: any) {
      toast.error(e.message ?? "Agent unavailable");
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Logo /></div>;
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>

      {/* Top bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <Link to="/results"><Logo /></Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{profile.name}</span>
          <button
            onClick={async () => { await signOut(); navigate({ to: "/" }); }}
            className="label-mono hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-5 py-8">
          {messages.length === 0 && !sending ? (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary font-mono text-lg font-bold text-primary-foreground">
                AQ
              </div>
              <p className="mt-6 font-display text-3xl text-foreground">Your agent is ready.</p>
              <p className="mt-2 text-sm text-muted-foreground">It already knows who you are.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) =>
                m.role === "assistant" ? (
                  <div key={i} className="flex gap-3">
                    <AgentAvatar />
                    <div className="max-w-[85%]">
                      <div
                        className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-[15px] leading-relaxed text-foreground"
                      >
                        {m.content}
                      </div>
                      <p className="mt-1 pl-1 text-[11px] text-muted-foreground">{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                ) : (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%]">
                      <div
                        className="whitespace-pre-wrap rounded-2xl rounded-br-sm border-l-2 border-primary px-4 py-3 text-[15px] leading-relaxed text-foreground"
                        style={{ background: "#1A1A1A" }}
                      >
                        {m.content}
                      </div>
                      <p className="mt-1 pr-1 text-right text-[11px] text-muted-foreground">{formatTime(m.created_at)}</p>
                    </div>
                  </div>
                )
              )}

              {sending && (
                <div className="flex gap-3">
                  <AgentAvatar />
                  <div>
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-card px-4 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
                          style={{ animation: `dotPulse 1.4s ${i * 0.2}s infinite ease-in-out` }}
                        />
                      ))}
                    </div>
                    <p className="mt-1 pl-1 text-[11px] text-muted-foreground">athletIQ is thinking...</p>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={onSend}
        className="shrink-0 border-t border-border"
        style={{ background: "#0D0D0D", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2 px-5 py-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            placeholder="Ask your agent anything..."
            className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            style={{ maxHeight: 140 }}
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-40"
            aria-label="Send"
          >
            <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
