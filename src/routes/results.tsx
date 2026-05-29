import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/results")({
  head: () => ({ meta: [{ title: "Your Assessment — athletIQ" }] }),
  component: Results,
});

function Results() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);

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

  if (!ready) return <div className="min-h-screen bg-background" />;

  const score = result?.transition_readiness_score ?? 0;

  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Logo />
        <Link to="/chat" className="label-mono text-primary hover:text-primary-hover">
          Open coach →
        </Link>
      </header>

      <main className="mx-auto mt-16 max-w-3xl space-y-12">
        <section>
          <p className="label-mono text-primary">Your archetype</p>
          <h1 className="mt-2 font-display text-5xl text-foreground">
            {result?.archetype ?? "—"}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            {result?.archetype_description}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-8">
          <p className="label-mono text-muted-foreground">Transition Readiness</p>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="font-display text-7xl text-primary">{score}</span>
            <span className="text-2xl text-muted-foreground">/ 100</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full bg-primary transition-all" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-4 text-muted-foreground">{result?.score_summary}</p>
        </section>

        <Block label="Top strengths" body={result?.top_strengths} />
        <Block label="Suggested career paths" body={result?.suggested_career_paths} />
        <Block label="Recommended skills" body={result?.recommended_skills} />
        {result?.nil_volunteer_translations && (
          <Block label="NIL / volunteer translation" body={result.nil_volunteer_translations} />
        )}

        <section className="rounded-xl border border-primary/40 bg-primary/5 p-8">
          <p className="label-mono text-primary">This week's mission</p>
          <p className="mt-3 font-display text-2xl text-foreground">
            {result?.weekly_mission}
          </p>
        </section>

        <div className="pt-4">
          <Link
            to="/chat"
            className="inline-block h-12 rounded-md bg-primary px-8 leading-[3rem] font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Talk to your coach
          </Link>
        </div>
      </main>
    </div>
  );
}

function Block({ label, body }: { label: string; body?: string | null }) {
  if (!body) return null;
  return (
    <section>
      <p className="label-mono text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-line text-lg text-foreground">{body}</p>
    </section>
  );
}
