import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { chatWithCoach } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Coach — athletIQ" }, { name: "description", content: "Your assessment, coach, and weekly mission." }] }),
  component: ChatPage,
});

type Profile = any;
type Assess = any;
type Msg = { role: "user" | "assistant"; content: string; id?: string };

function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assess, setAssess] = useState<Assess | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const send = useServerFn(chatWithCoach);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("athlete_profiles").select("*").eq("user_id", user.id).maybeSingle();
      if (!p) { navigate({ to: "/onboarding", replace: true }); return; }
      if (!p.onboarding_complete) { navigate({ to: "/onboarding", replace: true }); return; }
      setProfile(p);
      const { data: a } = await supabase.from("assessment_results").select("*").eq("athlete_id", p.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      setAssess(a);
      const { data: msgs } = await supabase.from("conversations").select("*").eq("athlete_id", p.id).order("created_at", { ascending: true });
      setMessages((msgs ?? []) as any);
    })();
  }, [user, navigate]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !profile || sending) return;
    const text = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const { reply } = await send({ data: { athleteId: profile.id, message: text } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast.error(e.message ?? "Coach unavailable");
    } finally {
      setSending(false);
    }
  }

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Logo /></div>;
  }

  const score = assess?.transition_readiness_score ?? profile.transition_readiness_score ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo />
          <button onClick={async () => { await signOut(); navigate({ to: "/" }); }} className="label-mono hover:text-primary">
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT — assessment */}
        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <p className="label-mono text-primary">Your archetype</p>
            <h2 className="mt-2 font-display text-4xl">{assess?.archetype ?? "—"}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{assess?.archetype_description}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <p className="label-mono">Transition readiness</p>
            <div className="mt-3 flex items-end gap-3">
              <span className="font-display text-6xl text-primary leading-none">{score}</span>
              <span className="label-mono mb-2">/ 100</span>
            </div>
            <div className="mt-4 h-[3px] w-full bg-border overflow-hidden rounded">
              <div className="h-full bg-primary" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{assess?.score_summary}</p>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <p className="label-mono text-primary">This week's mission</p>
            <p className="mt-3 text-lg text-foreground">{assess?.weekly_mission ?? "—"}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <InfoBlock title="Top strengths" body={assess?.top_strengths} />
            <InfoBlock title="Career paths" body={assess?.suggested_career_paths} />
            <InfoBlock title="Skills to build" body={assess?.recommended_skills} />
            {assess?.nil_volunteer_translations ? (
              <InfoBlock title="NIL / volunteer → resume" body={assess.nil_volunteer_translations} />
            ) : null}
          </div>
        </section>

        {/* RIGHT — chat */}
        <section className="flex h-[calc(100vh-180px)] flex-col rounded-lg border border-border bg-card lg:sticky lg:top-6 lg:self-start">
          <div className="border-b border-border p-5">
            <p className="label-mono text-primary">Your coach</p>
            <h3 className="mt-1 font-display text-2xl">Ask anything.</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Try:</p>
                <Suggest setInput={setInput} text="Help me write a LinkedIn headline." />
                <Suggest setInput={setInput} text="Translate my captain experience into resume language." />
                <Suggest setInput={setInput} text="I'm scared about life after my last season. Where do I start?" />
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                <div className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground"
                    : "max-w-[90%] text-sm text-foreground whitespace-pre-wrap leading-relaxed"
                }>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && <div className="text-sm text-muted-foreground">Coach is thinking...</div>}
            <div ref={endRef} />
          </div>

          <form onSubmit={onSend} className="border-t border-border p-3">
            <div className="flex gap-2">
              <input
                value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary"
              />
              <button disabled={sending || !input.trim()}
                className="rounded-md bg-primary px-5 font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
                Send
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function InfoBlock({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="label-mono">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">{body ?? "—"}</p>
    </div>
  );
}

function Suggest({ text, setInput }: { text: string; setInput: (s: string) => void }) {
  return (
    <button onClick={() => setInput(text)}
      className="block w-full rounded-md border border-border px-3 py-2 text-left text-sm text-muted-foreground hover:border-primary hover:text-foreground">
      {text}
    </button>
  );
}
