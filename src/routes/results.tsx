import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your Athlete Profile — athletIQ" }] }),
  component: Results,
});

function splitLines(text?: string | null): string[] {
  if (!text) return [];
  // First split on hard separators (newlines, bullets, semicolons, numbered lists)
  const chunks = text.split(/\r?\n|•|\u2022|;|(?:^|\n)\s*\d+[\.\)]\s+/g);
  const out: string[] = [];
  for (const chunk of chunks) {
    // Then split on top-level commas (ignore commas inside parentheses)
    let depth = 0;
    let buf = "";
    for (const ch of chunk) {
      if (ch === "(" || ch === "[") depth++;
      else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) {
        out.push(buf);
        buf = "";
      } else {
        buf += ch;
      }
    }
    out.push(buf);
  }
  return out
    .map((s) => s.replace(/^[-*◆→□✓\s]+/, "").trim())
    .filter(Boolean);
}

function Reveal({ delay, children }: { delay: number; children: React.ReactNode }) {
  return (
    <section
      className="opacity-0 animate-[fadeUp_700ms_ease-out_forwards]"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="label-mono text-primary" style={{ color: "var(--primary)" }}>
      {children}
    </p>
  );
}

function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

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
      if (!p) {
        navigate({ to: "/onboarding", replace: true });
        return;
      }
      setProfile(p);
      const { data: r } = await supabase
        .from("assessment_results")
        .select("*")
        .eq("athlete_id", p.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setResult(r);
      setReady(true);
    })();
  }, [user, navigate]);

  const strengths = useMemo(() => splitLines(result?.top_strengths).slice(0, 4), [result]);
  const careers = useMemo(() => splitLines(result?.suggested_career_paths).slice(0, 4), [result]);
  const mission = useMemo(() => splitLines(result?.weekly_mission).slice(0, 3), [result]);
  const skills = useMemo(() => splitLines(result?.recommended_skills).slice(0, 4), [result]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  const score = result?.transition_readiness_score ?? 0;
  const showNil = profile?.has_nil_or_volunteer && profile.has_nil_or_volunteer !== "none" && result?.nil_volunteer_translations;

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mx-auto max-w-2xl space-y-14">
        {/* A — Header */}
        <Reveal delay={0}>
          <Label>Your Athlete Profile</Label>
          <div className="mt-3 gold-line" />
        </Reveal>

        {/* B — Archetype */}
        <Reveal delay={300}>
          <Label>Athlete Archetype</Label>
          <h1 className="mt-3 font-display text-5xl leading-tight text-foreground">
            {result?.archetype ?? "—"}
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            {result?.archetype_description}
          </p>
        </Reveal>

        {/* C — Strengths */}
        <Reveal delay={600}>
          <Label>Your Strengths</Label>
          <ul className="mt-4 space-y-3">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-4 text-foreground">
                <span className="text-primary mt-[2px] shrink-0">◆</span>
                <span className="flex-1 text-[15px] leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* D — Score */}
        <Reveal delay={900}>
          <Label>Transition Readiness Score</Label>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-8xl leading-none text-primary">{score}</span>
            <span className="font-mono text-lg text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-5 h-[2px] w-full overflow-hidden bg-border">
            <div
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${score}%` }}
            />
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            {result?.score_summary}
          </p>
        </Reveal>

        {/* E — Career paths */}
        <Reveal delay={1200}>
          <Label>Your Top Career Paths</Label>
          <ul className="mt-4 space-y-3">
            {careers.map((c, i) => (
              <li key={i} className="flex items-start gap-4 text-foreground">
                <span className="text-primary mt-[2px] shrink-0">→</span>
                <span className="flex-1 text-[15px] leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* F — Weekly mission */}
        <Reveal delay={1500}>
          <Label>Your First Week</Label>
          <ul className="mt-4 space-y-4">
            {mission.map((m, i) => {
              const isChecked = !!checked[i];
              const id = `mission-${i}`;
              return (
                <li key={i} className="flex items-start gap-4">
                  <Checkbox
                    id={id}
                    checked={isChecked}
                    onCheckedChange={() =>
                      setChecked((c) => ({ ...c, [i]: !c[i] }))
                    }
                    className="mt-[3px] h-5 w-5 shrink-0 rounded-sm"
                  />
                  <label
                    htmlFor={id}
                    className={`flex-1 cursor-pointer text-[15px] leading-relaxed transition-colors ${
                      isChecked ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {m}
                  </label>
                </li>
              );
            })}
          </ul>
        </Reveal>

        {/* G — Skills */}
        <Reveal delay={1800}>
          <Label>Skills to Build</Label>
          <ul className="mt-4 space-y-3">
            {skills.map((s, i) => (
              <li key={i} className="flex items-start gap-4 text-foreground">
                <span className="text-primary mt-[2px] shrink-0">→</span>
                <span className="flex-1 text-[15px] leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        {/* H — NIL/volunteer */}
        {showNil && (
          <Reveal delay={2100}>
            <Label>Your Experience, Translated</Label>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-foreground">
              {result.nil_volunteer_translations}
            </p>
          </Reveal>
        )}

        {/* I — CTA */}
        <Reveal delay={showNil ? 2400 : 2100}>
          <div className="pt-4 text-center">
            <button
              onClick={() => navigate({ to: "/chat" })}
              className="inline-flex h-14 items-center justify-center rounded-md bg-primary px-10 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              Talk To Your Agent →
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              Your agent already knows who you are.
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
