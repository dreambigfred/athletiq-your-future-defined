import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateAssessment } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — athletIQ" },
      { name: "description", content: "Tell us about your sport, story, and goals." },
    ],
  }),
  component: Onboarding,
});

type QType = "text" | "single" | "multi" | "scale";
type Question = {
  id: string;
  field: string;
  prompt: string;
  type: QType;
  options?: string[];
  placeholder?: string;
  // transforms raw selection -> patch object for athlete_profiles
  toPatch?: (value: any) => Record<string, any>;
  // skip the question entirely based on collected data
  skipIf?: (data: Record<string, any>) => boolean;
};

const QUESTIONS: Question[] = [
  { id: "q1", field: "sport", prompt: "What sport do you play?", type: "text", placeholder: "e.g. Basketball, Track & Field, Soccer" },
  { id: "q2", field: "year_in_school", prompt: "What year are you in?", type: "single", options: ["Freshman", "Sophomore", "Junior", "Senior"] },
  { id: "q3", field: "school", prompt: "What school do you attend?", type: "text", placeholder: "University name" },
  {
    id: "q4",
    field: "graduation_year",
    prompt: "When do you graduate?",
    type: "single",
    options: ["2025", "2026", "2027", "2028", "2029"],
    toPatch: (v: string) => ({ graduation_year: v ? parseInt(v, 10) : null }),
  },
  { id: "q5", field: "interests_outside_sport", prompt: "What do you enjoy most outside of sports?", type: "text", placeholder: "Music, business, art, gaming — whatever it is" },
  { id: "q6", field: "confidence_strengths", prompt: "What are you most confident in?", type: "text", placeholder: "Leading people, communicating, being creative..." },
  { id: "q7", field: "motivation", prompt: "What motivates you most?", type: "text", placeholder: "What drives you to keep going?" },
  { id: "q8", field: "post_sport_fear", prompt: "What scares you most about life after sports?", type: "text", placeholder: "Be honest — this helps us help you" },
  {
    id: "q9",
    field: "career_interests",
    prompt: "What careers interest you?",
    type: "multi",
    options: ["Sports Business", "Brand & Marketing", "Media & Broadcasting", "Finance", "Tech", "Healthcare", "Law", "Education", "Entrepreneurship", "Not sure yet"],
    toPatch: (v: string[]) => ({ career_interests: (v ?? []).join(", ") }),
  },
  {
    id: "q10",
    field: "has_resume",
    prompt: "Have you updated your resume in the last year?",
    type: "single",
    options: ["Yes", "No", "I don't have one"],
    toPatch: (v: string) => ({ has_resume: v === "Yes" }),
  },
  {
    id: "q11",
    field: "has_linkedin",
    prompt: "Do you have a LinkedIn profile?",
    type: "single",
    options: ["Yes", "No"],
    toPatch: (v: string) => ({ has_linkedin: v === "Yes" }),
  },
  {
    id: "q11b",
    field: "linkedin_url",
    prompt: "Add your LinkedIn URL",
    type: "text",
    placeholder: "https://linkedin.com/in/...",
    skipIf: (d) => d.has_linkedin !== true,
  },
  {
    id: "q12",
    field: "has_networked",
    prompt: "Have you networked with professionals outside of sport?",
    type: "single",
    options: ["Yes, regularly", "A few times", "Never"],
    toPatch: (v: string) => ({ has_networked: v !== "Never" }),
  },
  {
    id: "q13",
    field: "industry_interests",
    prompt: "What industries interest you most?",
    type: "multi",
    options: ["Sports", "Tech", "Finance", "Healthcare", "Entertainment", "Real Estate", "Government", "Education"],
    toPatch: (v: string[]) => ({ industry_interests: (v ?? []).join(", ") }),
  },
  {
    id: "q14",
    field: "work_style",
    prompt: "In your future career, you'd rather:",
    type: "single",
    options: ["Lead teams", "Create things", "Analyze data", "Sell ideas", "Teach or coach", "Build companies"],
  },
  {
    id: "q15",
    field: "has_nil_or_volunteer",
    prompt: "Do you have any NIL deals or volunteer experience?",
    type: "single",
    options: ["Yes — NIL deals", "Yes — Volunteer work", "Both", "Not yet"],
    toPatch: (v: string) => ({ has_nil_or_volunteer: v === "Not yet" ? "none" : v }),
  },
  {
    id: "q15b",
    field: "nil_volunteer_description",
    prompt: "Briefly describe it — brand, what you did, how long.",
    type: "text",
    placeholder: "A short description is plenty",
    skipIf: (d) => !d.has_nil_or_volunteer || d.has_nil_or_volunteer === "none",
  },
  {
    id: "q16",
    field: "time_management_style",
    prompt: "How do you manage your time outside of sport?",
    type: "single",
    options: ["I have a system", "I figure it out day by day", "I struggle without structure", "I rely on my schedule"],
  },
  {
    id: "q17",
    field: "structure_without_sport",
    prompt: "How structured do you feel during the offseason?",
    type: "single",
    options: ["Very structured", "Somewhat", "Not very", "Lost without sport"],
  },
  {
    id: "q18",
    field: "stress_level",
    prompt: "How stressed do you feel on a weekly basis?",
    type: "scale",
  },
  { id: "q19", field: "hardest_emotionally", prompt: "What's hardest emotionally about being a student-athlete?", type: "text", placeholder: "Take your time with this one" },
  {
    id: "q20",
    field: "connection_outside_team",
    prompt: "How connected do you feel to people outside your team?",
    type: "single",
    options: ["Very connected", "Somewhat connected", "Mostly just my team", "Pretty isolated"],
  },
];

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const runAssess = useServerFn(generateAssessment);

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});
  const [athleteId, setAthleteId] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<any>(""); // current question's pending answer
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  // hydrate
  useEffect(() => {
    if (!user) return;
    supabase
      .from("athlete_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: p }) => {
        if (p) {
          if (p.onboarding_complete) {
            navigate({ to: "/chat", replace: true });
            return;
          }
          setAthleteId(p.id);
          setData(p);
        }
        setHydrated(true);
      });
  }, [user, navigate]);

  // Visible questions (after skipIf evaluation against current data)
  const visible = useMemo(
    () => QUESTIONS.filter((q) => !q.skipIf || !q.skipIf(data)),
    [data],
  );
  const current = visible[stepIdx];
  const isLast = stepIdx === visible.length - 1;
  const progress = Math.round(((stepIdx + 1) / visible.length) * 100);

  // Initialize draft when question changes
  const lastQid = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!current) return;
    if (lastQid.current === current.id) return;
    lastQid.current = current.id;
    const existing = data[current.field];
    if (current.type === "multi") {
      setDraft(Array.isArray(existing) ? existing : typeof existing === "string" && existing ? existing.split(", ").filter(Boolean) : []);
    } else if (current.field === "graduation_year") {
      setDraft(existing ? String(existing) : "");
    } else if (current.field === "has_resume") {
      setDraft(existing === true ? "Yes" : existing === false ? "" : "");
    } else if (current.field === "has_linkedin") {
      setDraft(existing === true ? "Yes" : existing === false ? "No" : "");
    } else if (current.field === "has_networked") {
      setDraft(existing === true ? "" : existing === false ? "Never" : "");
    } else {
      setDraft(existing ?? "");
    }
  }, [current, data]);

  async function saveAndAdvance() {
    if (!user || !current) return;
    const patch = current.toPatch ? current.toPatch(draft) : { [current.field]: draft };
    const next = { ...data, ...patch };
    setSaving(true);
    try {
      let id = athleteId;
      if (!id) {
        const { data: ins, error } = await supabase
          .from("athlete_profiles")
          .insert({ user_id: user.id, ...patch })
          .select("id")
          .single();
        if (error) throw error;
        id = ins!.id;
        setAthleteId(id);
      } else {
        const { error } = await supabase.from("athlete_profiles").update(patch as any).eq("id", id);
        if (error) throw error;
      }
      setData(next);

      if (!isLast) {
        setStepIdx((s) => s + 1);
      } else {
        setAssessing(true);
        await runAssess({ data: { athleteId: id! } });
        navigate({ to: "/results", replace: true });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
      setAssessing(false);
    } finally {
      setSaving(false);
    }
  }

  function back() {
    if (stepIdx > 0) setStepIdx((s) => s - 1);
  }

  const canContinue = useMemo(() => {
    if (!current) return false;
    if (current.type === "multi") return Array.isArray(draft) && draft.length > 0;
    if (current.type === "scale") return !!draft;
    return typeof draft === "string" && draft.trim().length > 0;
  }, [current, draft]);

  if (!hydrated || loading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (assessing) {
    return <BuildingScreen />;
  }

  if (!current) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-10 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-8">
        <Logo />
        <span className="label-mono text-muted-foreground">
          {stepIdx + 1} / {visible.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
        <div key={current.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <h1 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
            {current.prompt}
          </h1>

          <div className="mt-10">
            {current.type === "text" && (
              <input
                autoFocus
                type="text"
                value={draft}
                placeholder={current.placeholder}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canContinue && !saving) saveAndAdvance();
                }}
                className="w-full border-0 border-b-2 border-border bg-transparent pb-3 text-2xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
            )}

            {current.type === "single" && (
              <div className="flex flex-col gap-3">
                {current.options!.map((opt) => {
                  const selected = draft === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setDraft(opt)}
                      className={`group w-full rounded-lg border px-5 py-4 text-left text-lg transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "multi" && (
              <div className="flex flex-wrap gap-2">
                {current.options!.map((opt) => {
                  const arr: string[] = Array.isArray(draft) ? draft : [];
                  const selected = arr.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setDraft(
                          selected ? arr.filter((x) => x !== opt) : [...arr, opt],
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-sm transition-all ${
                        selected
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === "scale" && (
              <div>
                <div className="flex justify-between gap-2">
                  {["1", "2", "3", "4", "5"].map((n) => {
                    const selected = draft === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setDraft(n)}
                        className={`h-16 flex-1 rounded-lg border font-display text-2xl transition-all ${
                          selected
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex justify-between text-sm text-muted-foreground">
                  <span>1 — Calm</span>
                  <span>5 — Very stressed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mx-auto flex w-full max-w-2xl items-center justify-between px-6 pb-10">
        {stepIdx > 0 ? (
          <button
            onClick={back}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={saveAndAdvance}
          disabled={!canContinue || saving}
          className="h-12 min-w-[160px] rounded-md bg-primary px-6 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : isLast ? "Finish" : "Continue"}
        </button>
      </footer>
    </div>
  );
}

function BuildingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="relative mb-10 h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
        <div className="absolute inset-0 flex items-center justify-center rounded-full border border-primary/50 bg-primary/10">
          <span className="font-display text-xl text-primary">AQ</span>
        </div>
      </div>
      <h2 className="font-display text-3xl text-foreground">
        Building your athlete profile...
      </h2>
      <p className="mt-3 text-muted-foreground">This takes about 15 seconds.</p>
    </div>
  );
}
