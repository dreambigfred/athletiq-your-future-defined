import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateAssessment } from "@/lib/ai.functions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — athletIQ" },
      { name: "description", content: "Tell us about your sport, story, and goals." },
    ],
  }),
  component: Onboarding,
});

type QType = "text" | "single" | "multi" | "scale" | "select";
type Question = {
  id: string;
  field: string;
  prompt: string;
  type: QType;
  step: number;
  options?: string[];
  placeholder?: string;
  toPatch?: (value: any) => Record<string, any>;
  skipIf?: (data: Record<string, any>) => boolean;
};

const SPORTS = [
  "Football","Basketball","Soccer","Baseball","Softball","Track & Field",
  "Swimming & Diving","Volleyball","Tennis","Golf","Lacrosse","Wrestling",
  "Cross Country","Gymnastics","Rowing","Other",
];

const MAJORS = [
  "Business Administration","Marketing","Finance","Accounting","Economics",
  "Communications","Journalism","Psychology","Sociology","Political Science",
  "Computer Science","Engineering","Biology","Kinesiology","Exercise Science",
  "Education","Nursing","Pre-Med","Pre-Law","English","History",
  "Sports Management","Undecided","Other",
];

const QUESTIONS: Question[] = [
  // STEP 1 — Basic Info
  { id: "q1", step: 1, field: "name", prompt: "Full Name", type: "text", placeholder: "Enter your full name" },
  { id: "q2", step: 1, field: "sport", prompt: "What sport do you play?", type: "select", options: SPORTS },
  { id: "q3", step: 1, field: "position_role", prompt: "What position or role do you play?", type: "text", placeholder: "e.g. Point Guard, Goalkeeper, Sprinter" },
  { id: "q4", step: 1, field: "school", prompt: "What school do you attend?", type: "text", placeholder: "University or School Name" },
  { id: "q5", step: 1, field: "division", prompt: "What division do you compete in?", type: "select", options: ["D1","D2","D3","NAIA","JUCO","High School"] },
  { id: "q6", step: 1, field: "class_year", prompt: "What year are you in?", type: "select", options: ["Freshman","Sophomore","Junior","Senior","Graduate Student"] },
  {
    id: "q7", step: 1, field: "graduation_year",
    prompt: "When do you graduate?",
    type: "select",
    options: ["2025","2026","2027","2028","2029","2030"],
    toPatch: (v: string) => ({ graduation_year: v ? parseInt(v, 10) : null }),
  },

  // STEP 2 — Career Direction
  {
    id: "q8", step: 2, field: "career_interest_areas",
    prompt: "Career Interest Areas",
    type: "multi",
    options: ["Sports Business","Media & Broadcasting","Finance & Banking","Technology","Law & Legal","Healthcare","Education & Coaching","Entrepreneurship","Military & Government","Still Figuring It Out"],
    toPatch: (v: string[]) => ({ career_interest_areas: (v ?? []).join(", ") }),
  },
  {
    id: "q9", step: 2, field: "dream_role_industry",
    prompt: "What dream role or industry interests you most?",
    type: "select",
    options: ["Front Office / Team Operations","Sports Media & Journalism","Marketing & Brand Management","Finance & Wealth Management","Tech & Product","Law & Compliance","Owning My Own Business","Public Service","Healthcare & Sports Medicine","Not Sure Yet"],
  },
  {
    id: "q10", step: 2, field: "industry_interests",
    prompt: "What industries interest you most?",
    type: "multi",
    options: ["Sports","Tech","Finance","Healthcare","Entertainment","Real Estate","Government","Education"],
    toPatch: (v: string[]) => ({ industry_interests: (v ?? []).join(", ") }),
  },
  {
    id: "q11", step: 2, field: "pro_career_goal",
    prompt: "Do you plan to pursue a professional playing career?",
    type: "select",
    options: ["Yes — that's the goal","Maybe — keeping options open","No — focused on life after sport"],
  },
  {
    id: "q12", step: 2, field: "work_style",
    prompt: "In your future career, you'd rather:",
    type: "single",
    options: ["Lead teams","Create things","Analyze data","Sell ideas","Teach or coach","Build companies"],
  },

  // STEP 3 — Your Capital
  {
    id: "q13", step: 3, field: "leadership_roles",
    prompt: "Which leadership roles have you held?",
    type: "multi",
    options: ["Team Captain","Co-Captain","SAAC","Peer Mentor","Community Volunteer","Student Government","None Yet"],
    toPatch: (v: string[]) => ({ leadership_roles: (v ?? []).join(", ") }),
  },
  { id: "q14", step: 3, field: "academic_major", prompt: "What is your academic major?", type: "select", options: MAJORS },
  {
    id: "q15", step: 3, field: "work_internship_experience",
    prompt: "What work or internship experience do you have?",
    type: "select",
    options: ["None yet","Part-time job","Internship (1)","Multiple internships","Full-time experience before college"],
  },
  {
    id: "q16", step: 3, field: "has_nil_or_volunteer",
    prompt: "Do you have any NIL deals or volunteer experience?",
    type: "select",
    options: ["Yes — NIL deals","Yes — Volunteer work","Both","Not yet"],
    toPatch: (v: string) => ({ has_nil_or_volunteer: v === "Not yet" ? "none" : v }),
  },
  {
    id: "q17", step: 3, field: "nil_volunteer_description",
    prompt: "Briefly describe it — brand, what you did, and how long.",
    type: "text",
    placeholder: "Describe your experience",
    skipIf: (d) => !d.has_nil_or_volunteer || d.has_nil_or_volunteer === "none",
  },
  { id: "q18", step: 3, field: "confidence_strengths", prompt: "What are you most confident in?", type: "text", placeholder: "Leading people, communicating, being creative..." },
  { id: "q19", step: 3, field: "interests_outside_sport", prompt: "What do you enjoy most outside of sports?", type: "text", placeholder: "Music, business, art, gaming — whatever it is" },
  {
    id: "q20", step: 3, field: "has_resume",
    prompt: "Have you updated your resume in the last year?",
    type: "select",
    options: ["Yes","No","I don't have one"],
    toPatch: (v: string) => ({ has_resume: v === "Yes" }),
  },

  // STEP 4 — Your Presence
  {
    id: "q21", step: 4, field: "has_linkedin",
    prompt: "Do you have a LinkedIn profile?",
    type: "select",
    options: ["Yes","No — need to create one","Not sure"],
    toPatch: (v: string) => ({ has_linkedin: v === "Yes" }),
  },
  {
    id: "q22", step: 4, field: "linkedin_url",
    prompt: "Add your LinkedIn URL",
    type: "text",
    placeholder: "https://linkedin.com/in/yourname",
    skipIf: (d) => d.has_linkedin !== true,
  },
  { id: "q23", step: 4, field: "instagram_handle", prompt: "What is your Instagram handle? (Optional)", type: "text", placeholder: "@username" },

  // STEP 5 — Where You're Headed
  {
    id: "q24", step: 5, field: "biggest_career_concern",
    prompt: "What is your biggest career concern right now?",
    type: "select",
    options: [
      "I don't know what career path fits me",
      "I have no professional network",
      "My résumé is empty",
      "I don't know how to talk about my athletic experience in interviews",
      "I'm behind on internships",
      "I don't have time to figure this out",
      "I just want a starting point",
    ],
  },
  {
    id: "q25", step: 5, field: "success_in_6_months",
    prompt: "What does success look like in 6 months?",
    type: "select",
    options: [
      "Land an internship",
      "Build my LinkedIn presence",
      "Know what career path I want",
      "Have a résumé I'm proud of",
      "Make my first professional connection",
      "Get a job offer lined up before graduation",
    ],
  },
  {
    id: "q26", step: 5, field: "preferred_communication_style",
    prompt: "How would you like your Career Agent to communicate with you?",
    type: "select",
    options: ["Keep it short and direct","Give me detail and context","Motivate me","Just tell me what to do next"],
  },
  { id: "q27", step: 5, field: "post_sport_fear", prompt: "What scares you most about life after sports?", type: "text", placeholder: "Be honest — this helps us help you" },
  {
    id: "q28", step: 5, field: "time_management_style",
    prompt: "How do you manage your time outside of sport?",
    type: "single",
    options: ["I have a system","I figure it out day by day","I struggle without structure","I rely on my schedule"],
  },
  {
    id: "q29", step: 5, field: "structure_without_sport",
    prompt: "How structured do you feel during the offseason?",
    type: "single",
    options: ["Very structured","Somewhat","Not very","Lost without sport"],
  },
  { id: "q30", step: 5, field: "stress_level", prompt: "How stressed do you feel on a weekly basis?", type: "scale" },
  { id: "q31", step: 5, field: "hardest_emotionally", prompt: "What's hardest emotionally about being a student-athlete?", type: "text", placeholder: "Take your time with this one" },
];

const STEP_LABELS: Record<number, string> = {
  1: "Basic Info",
  2: "Career Direction",
  3: "Your Capital",
  4: "Your Presence",
  5: "Where You're Headed",
};

function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const runAssess = useServerFn(generateAssessment);

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<Record<string, any>>({});
  const [athleteId, setAthleteId] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<any>("");
  const [saving, setSaving] = useState(false);
  const [assessing, setAssessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

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

  const visible = useMemo(
    () => QUESTIONS.filter((q) => !q.skipIf || !q.skipIf(data)),
    [data],
  );
  const current = visible[stepIdx];
  const isLast = stepIdx === visible.length - 1;
  const progress = Math.round(((stepIdx + 1) / visible.length) * 100);

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
      setDraft(existing === true ? "Yes" : existing === false ? "No" : "");
    } else if (current.field === "has_linkedin") {
      setDraft(existing === true ? "Yes" : existing === false ? "No — need to create one" : "");
    } else {
      setDraft(existing ?? "");
    }
  }, [current, data]);

  async function saveAndAdvance() {
    if (!user || !current) return;
    // Instagram is optional — allow blank advance
    const isOptional = current.field === "instagram_handle";
    if (!isOptional && !canContinue) return;

    const patch = current.toPatch ? current.toPatch(draft) : { [current.field]: draft };
    const next = { ...data, ...patch };
    setSaving(true);
    try {
      let id = athleteId;
      if (!id) {
        const { data: ins, error } = await supabase
          .from("athlete_profiles")
          .insert({ user_id: user.id, ...patch } as any)
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
    if (current.field === "instagram_handle") return true;
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
      <div className="fixed left-0 right-0 top-0 z-10 h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-8">
        <Logo />
        <div className="flex flex-col items-end gap-1">
          <span className="label-mono text-xs text-primary">
            Step {current.step} / 5 · {STEP_LABELS[current.step]}
          </span>
          <span className="label-mono text-xs text-muted-foreground">
            {stepIdx + 1} / {visible.length}
          </span>
        </div>
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
                  if (e.key === "Enter" && (canContinue || current.field === "instagram_handle") && !saving) saveAndAdvance();
                }}
                className="w-full border-0 border-b-2 border-border bg-transparent pb-3 text-2xl text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />
            )}

            {current.type === "select" && (
              <Select value={draft || undefined} onValueChange={(v) => setDraft(v)}>
                <SelectTrigger className="h-14 w-full border-border bg-card text-lg text-foreground">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {current.options!.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-base">
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          disabled={(!canContinue && current.field !== "instagram_handle") || saving}
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
