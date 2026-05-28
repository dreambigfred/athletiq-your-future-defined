
CREATE TABLE public.athlete_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  sport text,
  year_in_school text,
  school text,
  graduation_year integer,
  interests_outside_sport text,
  confidence_strengths text,
  motivation text,
  post_sport_fear text,
  career_interests text,
  has_resume boolean DEFAULT false,
  has_linkedin boolean DEFAULT false,
  linkedin_url text,
  has_networked boolean DEFAULT false,
  work_style text,
  industry_interests text,
  has_nil_or_volunteer text,
  nil_volunteer_description text,
  time_management_style text,
  structure_without_sport text,
  stress_level text,
  hardest_emotionally text,
  connection_outside_team text,
  athlete_archetype text,
  strength_profile text,
  transition_readiness_score integer,
  suggested_career_paths text,
  onboarding_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.athlete_profiles TO authenticated;
GRANT ALL ON public.athlete_profiles TO service_role;
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own profile select" ON public.athlete_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own profile insert" ON public.athlete_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own profile update" ON public.athlete_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own conv select" ON public.conversations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles p WHERE p.id = athlete_id AND p.user_id = auth.uid()));
CREATE POLICY "own conv insert" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.athlete_profiles p WHERE p.id = athlete_id AND p.user_id = auth.uid()));

CREATE TABLE public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id uuid NOT NULL REFERENCES public.athlete_profiles(id) ON DELETE CASCADE,
  archetype text,
  archetype_description text,
  top_strengths text,
  transition_readiness_score integer,
  score_summary text,
  suggested_career_paths text,
  weekly_mission text,
  recommended_skills text,
  nil_volunteer_translations text,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT ON public.assessment_results TO authenticated;
GRANT ALL ON public.assessment_results TO service_role;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own assess select" ON public.assessment_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.athlete_profiles p WHERE p.id = athlete_id AND p.user_id = auth.uid()));
CREATE POLICY "own assess insert" ON public.assessment_results FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.athlete_profiles p WHERE p.id = athlete_id AND p.user_id = auth.uid()));
