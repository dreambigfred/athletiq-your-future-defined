import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

async function callAI(messages: Array<{ role: string; content: string }>, jsonMode = false) {
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": process.env.LOVABLE_API_KEY ?? "",
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${txt}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const COACH_SYSTEM = `You are athletIQ, a warm, direct, no-fluff career readiness coach for college athletes navigating life beyond sport. You speak like a trusted mentor: concise, confident, empowering. You ask one focused question at a time. You translate athletic experience into professional language. You help with: career clarity, resume, LinkedIn, networking, identity beyond sport, mental transitions. Avoid generic life-coach speak. Keep replies under 180 words unless asked. Use plain text, no markdown headers.`;

// Chat with the coach
export const chatWithCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      athleteId: z.string().uuid(),
      message: z.string().min(1).max(4000),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // verify athlete belongs to user
    const { data: profile, error: pErr } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("id", data.athleteId)
      .single();
    if (pErr || !profile) throw new Error("Profile not found");

    // load history
    const { data: history } = await supabase
      .from("conversations")
      .select("role, content")
      .eq("athlete_id", data.athleteId)
      .order("created_at", { ascending: true })
      .limit(40);

    const profileSummary = `Athlete context: ${profile.name ?? "(unknown)"}, ${profile.sport ?? "?"} at ${profile.school ?? "?"}, ${profile.year_in_school ?? "?"}. Archetype: ${profile.athlete_archetype ?? "n/a"}. Career interests: ${profile.career_interests ?? "n/a"}. Post-sport fear: ${profile.post_sport_fear ?? "n/a"}.`;

    const messages = [
      { role: "system", content: COACH_SYSTEM + "\n\n" + profileSummary },
      ...(history ?? []).map((h: any) => ({ role: h.role, content: h.content })),
      { role: "user", content: data.message },
    ];

    const reply = await callAI(messages);

    await supabase.from("conversations").insert([
      { athlete_id: data.athleteId, role: "user", content: data.message },
      { athlete_id: data.athleteId, role: "assistant", content: reply },
    ]);

    return { reply };
  });

// Generate the full assessment after onboarding
export const generateAssessment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ athleteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: profile, error } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("id", data.athleteId)
      .single();
    if (error || !profile) throw new Error("Profile not found");

    const prompt = `You are athletIQ's assessment engine. Given this athlete's onboarding data, generate a transition-readiness assessment as STRICT JSON with these exact keys:
{
  "archetype": "short 2-4 word archetype name (e.g. 'The Quiet Strategist')",
  "archetype_description": "2-3 sentence description of this archetype",
  "top_strengths": "3 transferable strengths as a comma-separated list with brief notes",
  "transition_readiness_score": integer 0-100,
  "score_summary": "1-2 sentences explaining the score",
  "suggested_career_paths": "3 career paths as a comma-separated list with one-line rationale each",
  "weekly_mission": "one single concrete action they should do this week",
  "recommended_skills": "3 skills to build, comma-separated",
  "nil_volunteer_translations": "if they have NIL/volunteer experience, translate it into 2 professional bullet points; otherwise empty string"
}

Athlete data:
${JSON.stringify(profile, null, 2)}

Return ONLY the JSON object. No prose, no markdown.`;

    const raw = await callAI(
      [
        { role: "system", content: "You output only valid JSON. No prose." },
        { role: "user", content: prompt },
      ],
      true,
    );

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : {};
    }

    // store assessment
    await supabase.from("assessment_results").insert({
      athlete_id: data.athleteId,
      archetype: parsed.archetype ?? null,
      archetype_description: parsed.archetype_description ?? null,
      top_strengths: parsed.top_strengths ?? null,
      transition_readiness_score: parsed.transition_readiness_score ?? null,
      score_summary: parsed.score_summary ?? null,
      suggested_career_paths: parsed.suggested_career_paths ?? null,
      weekly_mission: parsed.weekly_mission ?? null,
      recommended_skills: parsed.recommended_skills ?? null,
      nil_volunteer_translations: parsed.nil_volunteer_translations ?? null,
    });

    // mirror summary onto profile
    await supabase
      .from("athlete_profiles")
      .update({
        athlete_archetype: parsed.archetype ?? null,
        strength_profile: parsed.top_strengths ?? null,
        transition_readiness_score: parsed.transition_readiness_score ?? null,
        suggested_career_paths: parsed.suggested_career_paths ?? null,
        onboarding_complete: true,
      })
      .eq("id", data.athleteId);

    return { ok: true };
  });
