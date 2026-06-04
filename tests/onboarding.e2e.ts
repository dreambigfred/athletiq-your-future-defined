/**
 * End-to-end test for the onboarding flow.
 *
 * Simulates a real athlete completing all 31 onboarding questions:
 *  1. Creates a confirmed test user via the Supabase admin API.
 *  2. Signs the user in to obtain a bearer token.
 *  3. Inserts then incrementally updates `athlete_profiles` exactly the
 *     same way `src/routes/onboarding.tsx` does as each question is answered.
 *  4. Invokes the `generateAssessment` server function on the deployed
 *     TanStack Start app with the user's bearer token.
 *  5. Verifies:
 *      - `assessment_results` row was created for the athlete
 *      - `athlete_profiles.onboarding_complete = true`
 *      - The mirrored archetype/score fields are populated
 *      - `/results` is reachable for this authenticated profile
 *  6. Cleans up the test user (cascades to profile/assessment via RLS owner cleanup).
 *
 * Run:
 *   bun tests/onboarding.e2e.ts
 *
 * Required env (already present in the Lovable sandbox):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PUBLISHABLE_KEY
 *   APP_URL (optional, defaults to the preview URL)
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PUBLISHABLE = process.env.SUPABASE_PUBLISHABLE_KEY!;
const APP_URL =
  process.env.APP_URL ??
  "https://id-preview--80a2e599-6a9a-4bad-a277-0cb51ce0e7dd.lovable.app";

if (!SUPABASE_URL || !SERVICE_ROLE || !PUBLISHABLE) {
  throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_PUBLISHABLE_KEY");
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Step = { patch: Record<string, any>; label: string };

// Mirrors the 31 onboarding questions in src/routes/onboarding.tsx
const STEPS: Step[] = [
  { label: "q1 name",                     patch: { name: "Test Athlete" } },
  { label: "q2 sport",                    patch: { sport: "Basketball" } },
  { label: "q3 position_role",            patch: { position_role: "Point Guard" } },
  { label: "q4 school",                   patch: { school: "Test University" } },
  { label: "q5 division",                 patch: { division: "D1" } },
  { label: "q6 class_year",               patch: { class_year: "Junior" } },
  { label: "q7 graduation_year",          patch: { graduation_year: 2027 } },
  { label: "q8 career_interest_areas",    patch: { career_interest_areas: "Sports Business, Technology" } },
  { label: "q9 dream_role_industry",      patch: { dream_role_industry: "Front Office / Team Operations" } },
  { label: "q10 industry_interests",      patch: { industry_interests: "Sports, Tech" } },
  { label: "q11 pro_career_goal",         patch: { pro_career_goal: "Maybe — keeping options open" } },
  { label: "q12 work_style",              patch: { work_style: "Lead teams" } },
  { label: "q13 leadership_roles",        patch: { leadership_roles: "Team Captain, SAAC" } },
  { label: "q14 academic_major",          patch: { academic_major: "Business Administration" } },
  { label: "q15 work_internship_exp",     patch: { work_internship_experience: "Internship (1)" } },
  { label: "q16 has_nil_or_volunteer",    patch: { has_nil_or_volunteer: "Both" } },
  { label: "q17 nil_volunteer_desc",      patch: { nil_volunteer_description: "Local apparel NIL deal + youth clinic volunteer" } },
  { label: "q18 confidence_strengths",    patch: { confidence_strengths: "Leading people, staying composed under pressure" } },
  { label: "q19 interests_outside_sport", patch: { interests_outside_sport: "Music production and entrepreneurship" } },
  { label: "q20 has_resume",              patch: { has_resume: true } },
  { label: "q21 has_linkedin",            patch: { has_linkedin: true } },
  { label: "q22 linkedin_url",            patch: { linkedin_url: "https://linkedin.com/in/test-athlete" } },
  { label: "q23 instagram_handle",        patch: { instagram_handle: "@test.athlete" } },
  { label: "q24 biggest_career_concern",  patch: { biggest_career_concern: "I don't know what career path fits me" } },
  { label: "q25 success_in_6_months",     patch: { success_in_6_months: "Land an internship" } },
  { label: "q26 preferred_comm_style",    patch: { preferred_communication_style: "Keep it short and direct" } },
  { label: "q27 post_sport_fear",         patch: { post_sport_fear: "Losing identity and routine" } },
  { label: "q28 time_management_style",   patch: { time_management_style: "I have a system" } },
  { label: "q29 structure_without_sport", patch: { structure_without_sport: "Somewhat" } },
  { label: "q30 stress_level",            patch: { stress_level: "3" } },
  { label: "q31 hardest_emotionally",     patch: { hardest_emotionally: "Balancing academics, training, and personal life" } },
];

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error("ASSERT FAIL: " + msg);
}

async function main() {
  const email = `e2e+${Date.now()}@athletiq.test`;
  const password = "Passw0rd!" + Math.random().toString(36).slice(2);

  console.log(`\n▶ creating test user ${email}`);
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) throw new Error("createUser failed: " + createErr?.message);
  const userId = created.user.id;

  let assessmentId: string | undefined;
  let athleteId: string | undefined;

  try {
    console.log("▶ signing user in");
    const userClient = createClient(SUPABASE_URL, PUBLISHABLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signin, error: signErr } = await userClient.auth.signInWithPassword({ email, password });
    if (signErr || !signin.session) throw new Error("signIn failed: " + signErr?.message);
    const accessToken = signin.session.access_token;

    console.log("▶ walking 31 onboarding answers (insert → update loop)");
    for (let i = 0; i < STEPS.length; i++) {
      const step = STEPS[i];
      if (!athleteId) {
        const { data: ins, error } = await userClient
          .from("athlete_profiles")
          .insert({ user_id: userId, ...step.patch } as any)
          .select("id")
          .single();
        if (error) throw new Error(`insert (${step.label}) failed: ${error.message}`);
        athleteId = ins!.id;
        console.log(`  · ${step.label} → created profile ${athleteId}`);
      } else {
        const { error } = await userClient
          .from("athlete_profiles")
          .update(step.patch as any)
          .eq("id", athleteId);
        if (error) throw new Error(`update (${step.label}) failed: ${error.message}`);
        console.log(`  · ${step.label} → saved`);
      }
    }

    assert(athleteId, "athleteId should be set after walking steps");

    console.log("▶ verifying saved profile fields against DB");
    const { data: savedProfile, error: fetchErr } = await admin
      .from("athlete_profiles")
      .select("*")
      .eq("id", athleteId)
      .single();
    if (fetchErr || !savedProfile) throw new Error("could not read back profile: " + fetchErr?.message);

    for (const step of STEPS) {
      for (const [k, v] of Object.entries(step.patch)) {
        assert(
          (savedProfile as any)[k] === v ||
            String((savedProfile as any)[k]) === String(v),
          `${k} should be saved as ${JSON.stringify(v)} (got ${JSON.stringify((savedProfile as any)[k])})`,
        );
      }
    }
    console.log("  ✓ all 31 fields persisted correctly");

    console.log("▶ invoking generateAssessment server function as the user");
    const fnRes = await fetch(`${APP_URL}/_serverFn/src_lib_ai_functions_ts--generateAssessment_createServerFn_handler`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ data: { athleteId } }),
    });
    const fnBody = await fnRes.text();
    if (!fnRes.ok) {
      throw new Error(`generateAssessment failed (${fnRes.status}): ${fnBody}`);
    }
    console.log(`  ✓ server fn returned 200 (${fnBody.slice(0, 120)}…)`);

    console.log("▶ verifying assessment_results was inserted");
    const { data: assess, error: aErr } = await admin
      .from("assessment_results")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (aErr) throw new Error("assessment lookup failed: " + aErr.message);
    assert(assess, "assessment_results row should exist for the athlete");
    assessmentId = assess.id;
    assert(assess.archetype && String(assess.archetype).length > 0, "archetype should be populated");
    assert(typeof assess.transition_readiness_score === "number", "score should be a number");
    console.log(`  ✓ archetype="${assess.archetype}" score=${assess.transition_readiness_score}`);

    console.log("▶ verifying profile was flipped to onboarding_complete + mirrored");
    const { data: after } = await admin
      .from("athlete_profiles")
      .select("onboarding_complete, athlete_archetype, transition_readiness_score, suggested_career_paths")
      .eq("id", athleteId)
      .single();
    assert(after?.onboarding_complete === true, "onboarding_complete should be true");
    assert(after?.athlete_archetype, "athlete_archetype should be mirrored onto profile");
    console.log("  ✓ profile finalized");

    console.log("▶ verifying /results route serves the authenticated user");
    const resultsRes = await fetch(`${APP_URL}/results`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "manual",
    });
    assert(
      resultsRes.status === 200 || resultsRes.status === 304,
      `/results should return 200 (got ${resultsRes.status})`,
    );
    console.log(`  ✓ /results returned ${resultsRes.status}`);

    console.log("\n✅ ONBOARDING E2E PASSED");
  } finally {
    console.log("\n▶ cleaning up test data");
    if (assessmentId) await admin.from("assessment_results").delete().eq("id", assessmentId);
    if (athleteId)  await admin.from("athlete_profiles").delete().eq("id", athleteId);
    await admin.auth.admin.deleteUser(userId);
    console.log("  ✓ cleanup done");
  }
}

main().catch((err) => {
  console.error("\n❌ ONBOARDING E2E FAILED");
  console.error(err);
  process.exit(1);
});
