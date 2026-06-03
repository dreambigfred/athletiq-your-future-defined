ALTER TABLE public.athlete_profiles
  ADD COLUMN IF NOT EXISTS position_role TEXT,
  ADD COLUMN IF NOT EXISTS division TEXT,
  ADD COLUMN IF NOT EXISTS class_year TEXT,
  ADD COLUMN IF NOT EXISTS career_interest_areas TEXT,
  ADD COLUMN IF NOT EXISTS dream_role_industry TEXT,
  ADD COLUMN IF NOT EXISTS pro_career_goal TEXT,
  ADD COLUMN IF NOT EXISTS leadership_roles TEXT,
  ADD COLUMN IF NOT EXISTS academic_major TEXT,
  ADD COLUMN IF NOT EXISTS work_internship_experience TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS biggest_career_concern TEXT,
  ADD COLUMN IF NOT EXISTS success_in_6_months TEXT,
  ADD COLUMN IF NOT EXISTS preferred_communication_style TEXT;