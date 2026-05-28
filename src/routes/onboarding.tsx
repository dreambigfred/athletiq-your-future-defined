import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateAssessment } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Onboarding — athletIQ" }, { name: "description", content: "Tell us about your sport, story, and goals." }] }),
  component: Onboarding,
});

type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "bool" | "url";
  options?: string[];
  placeholder?: string;
};

const STEPS: { title: string; subtitle: string; fields: FieldDef[] }[] = [
  {
    title: "Who you are",
    subtitle: "The basics. Quick.",
    fields: [
      { key: "name", label: "Full name", placeholder: "Jordan Reyes" },
      { key: "sport", label: "Primary sport", placeholder: "Soccer, basketball, track..." },
      { key: "school", label: "School", placeholder: "University of..." },
      { key: "year_in_school", label: "Year", type: "select", options: ["Freshman","Sophomore","Junior","Senior","Grad","Recent grad"] },
      { key: "graduation_year", label: "Graduation year", type: "number", placeholder: "2026" },
    ],
  },
  {
    title: "Identity & story",
    subtitle: "Who are you when the jersey comes off?",
    fields: [
      { key: "interests_outside_sport", label: "Interests outside your sport", type: "textarea" },
      { key: "confidence_strengths", label: "What are you most confident in?", type: "textarea" },
      { key: "motivation", label: "What drives you?", type: "textarea" },
      { key: "post_sport_fear", label: "What scares you about life after sport?", type: "textarea" },
    ],
  },
  {
    title: "Career direction",
    subtitle: "Even rough is enough.",
    fields: [
      { key: "career_interests", label: "Career fields you're curious about", type: "textarea" },
      { key: "industry_interests", label: "Industries that pull you in", type: "textarea" },
      { key: "work_style", label: "Work style", type: "select", options: ["Solo focused","Small team","Big team","Leading others","Doesn't matter yet"] },
    ],
  },
  {
    title: "Where you stand",
    subtitle: "Be honest. No judgment.",
    fields: [
      { key: "has_resume", label: "Do you have a resume?", type: "bool" },
      { key: "has_linkedin", label: "Do you have a LinkedIn profile?", type: "bool" },
      { key: "linkedin_url", label: "LinkedIn URL (optional)", type: "url" },
      { key: "has_networked", label: "Have you done any professional networking?", type: "bool" },
      { key: "has_nil_or_volunteer", label: "Any NIL deals or volunteer work?", type: "select", options: ["Yes","No","Not sure"] },
      { key: "nil_volunteer_description", label: "If yes, describe briefly", type: "textarea" },
    ],
  },
  {
    title: "Mind & life",
    subtitle: "The stuff people don't ask about.",
    fields: [
      { key: "time_management_style", label: "How do you manage your time?", type: "textarea" },
      { key: "structure_without_sport", label: "Imagine no practice tomorrow — what does your day look like?", type: "textarea" },
      { key: "stress_level", label: "Current stress level", type: "select", options: ["Low","Manageable","High","Burning out"] },
      { key: "hardest_emotionally", label: "Hardest thing emotionally right now", type: "textarea" },
      { key: "connection_outside_team", label: "Who do you have outside of your team?", type: "textarea" },
    ],
  },
];

function FieldInput({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const base = "w-full rounded-md border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary";
  if (f.type === "textarea")
    return <textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base} />;
  if (f.type === "select")
    return (
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={base}>
        <option value="">Select...</option>
        {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  if (f.type === "bool")
    return (
      <div className="flex gap-2">
        {["Yes","No"].map((v) => (
          <button key={v} type="button"
            onClick={() => onChange(v === "Yes")}
            className={`flex-1 rounded-md border px-4 py-3 text-sm transition-colors ${
              (value === true && v === "Yes") || (value === false && v === "No")
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            }`}>
            {v}
          </button>
        ))}
      </div>
    );
  if (f.type === "number")
    return <input type="number" value={value ?? ""} placeholder={f.placeholder}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)} className={base} />;
  return <input type={f.type === "url" ? "url" : "text"} value={value ?? ""} placeholder={f.placeholder}
    onChange={(e) => onChange(e.target.value)} className={base} />;
}

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const runAssess = useServerFn(generateAssessment);

  useEffect(() => { if (!loading && !user) navigate({ to: "/login", replace: true }); }, [user, loading, navigate]);

  // hydrate existing draft
  useEffect(() => {
    if (!user) return;
    supabase.from("athlete_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data: p }) => {
        if (p) {
          if (p.onboarding_complete) { navigate({ to: "/chat", replace: true }); return; }
          setData(p);
        }
      });
  }, [user, navigate]);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  function setField(k: string, v: any) { setData((d) => ({ ...d, [k]: v })); }

  async function next() {
    if (!user) return;
    setSubmitting(true);
    try {
      // upsert profile
      const payload = { ...data, user_id: user.id };
      let athleteId = (data as any).id as string | undefined;
      if (athleteId) {
        const { error } = await supabase.from("athlete_profiles").update(payload).eq("id", athleteId);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("athlete_profiles").insert(payload).select("id").single();
        if (error) throw error;
        athleteId = ins!.id;
        setData((d) => ({ ...d, id: athleteId }));
      }

      if (!isLast) { setStep((s) => s + 1); return; }

      toast.message("Building your assessment...");
      await runAssess({ data: { athleteId: athleteId! } });
      navigate({ to: "/chat", replace: true });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-5 py-8">
      <header className="mx-auto flex max-w-2xl items-center justify-between">
        <Logo />
        <span className="label-mono">Step {step + 1} / {STEPS.length}</span>
      </header>

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="h-[2px] w-full bg-border overflow-hidden rounded">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <main className="mx-auto mt-12 max-w-2xl">
        <p className="label-mono text-primary">{current.title}</p>
        <h1 className="mt-2 font-display text-4xl">{current.subtitle}</h1>

        <div className="mt-10 space-y-6">
          {current.fields.map((f) => (
            <div key={f.key}>
              <label className="label-mono mb-2 block">{f.label}</label>
              <FieldInput f={f} value={(data as any)[f.key]} onChange={(v) => setField(f.key, v)} />
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep((s) => s - 1)}
              className="h-12 flex-1 rounded-md border border-border text-foreground hover:border-primary">
              Back
            </button>
          )}
          <button onClick={next} disabled={submitting}
            className="h-12 flex-[2] rounded-md bg-primary font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
            {submitting ? "Working..." : isLast ? "Build my assessment" : "Continue"}
          </button>
        </div>
      </main>
    </div>
  );
}
