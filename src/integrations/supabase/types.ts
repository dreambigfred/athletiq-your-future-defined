export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      assessment_results: {
        Row: {
          archetype: string | null
          archetype_description: string | null
          athlete_id: string
          created_at: string | null
          id: string
          nil_volunteer_translations: string | null
          recommended_skills: string | null
          score_summary: string | null
          suggested_career_paths: string | null
          top_strengths: string | null
          transition_readiness_score: number | null
          weekly_mission: string | null
        }
        Insert: {
          archetype?: string | null
          archetype_description?: string | null
          athlete_id: string
          created_at?: string | null
          id?: string
          nil_volunteer_translations?: string | null
          recommended_skills?: string | null
          score_summary?: string | null
          suggested_career_paths?: string | null
          top_strengths?: string | null
          transition_readiness_score?: number | null
          weekly_mission?: string | null
        }
        Update: {
          archetype?: string | null
          archetype_description?: string | null
          athlete_id?: string
          created_at?: string | null
          id?: string
          nil_volunteer_translations?: string | null
          recommended_skills?: string | null
          score_summary?: string | null
          suggested_career_paths?: string | null
          top_strengths?: string | null
          transition_readiness_score?: number | null
          weekly_mission?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          academic_major: string | null
          athlete_archetype: string | null
          biggest_career_concern: string | null
          career_interest_areas: string | null
          career_interests: string | null
          class_year: string | null
          confidence_strengths: string | null
          connection_outside_team: string | null
          created_at: string | null
          division: string | null
          dream_role_industry: string | null
          graduation_year: number | null
          hardest_emotionally: string | null
          has_linkedin: boolean | null
          has_networked: boolean | null
          has_nil_or_volunteer: string | null
          has_resume: boolean | null
          id: string
          industry_interests: string | null
          instagram_handle: string | null
          interests_outside_sport: string | null
          leadership_roles: string | null
          linkedin_url: string | null
          motivation: string | null
          name: string | null
          nil_volunteer_description: string | null
          onboarding_complete: boolean | null
          position_role: string | null
          post_sport_fear: string | null
          preferred_communication_style: string | null
          pro_career_goal: string | null
          school: string | null
          sport: string | null
          strength_profile: string | null
          stress_level: string | null
          structure_without_sport: string | null
          success_in_6_months: string | null
          suggested_career_paths: string | null
          time_management_style: string | null
          transition_readiness_score: number | null
          user_id: string
          work_internship_experience: string | null
          work_style: string | null
          year_in_school: string | null
        }
        Insert: {
          academic_major?: string | null
          athlete_archetype?: string | null
          biggest_career_concern?: string | null
          career_interest_areas?: string | null
          career_interests?: string | null
          class_year?: string | null
          confidence_strengths?: string | null
          connection_outside_team?: string | null
          created_at?: string | null
          division?: string | null
          dream_role_industry?: string | null
          graduation_year?: number | null
          hardest_emotionally?: string | null
          has_linkedin?: boolean | null
          has_networked?: boolean | null
          has_nil_or_volunteer?: string | null
          has_resume?: boolean | null
          id?: string
          industry_interests?: string | null
          instagram_handle?: string | null
          interests_outside_sport?: string | null
          leadership_roles?: string | null
          linkedin_url?: string | null
          motivation?: string | null
          name?: string | null
          nil_volunteer_description?: string | null
          onboarding_complete?: boolean | null
          position_role?: string | null
          post_sport_fear?: string | null
          preferred_communication_style?: string | null
          pro_career_goal?: string | null
          school?: string | null
          sport?: string | null
          strength_profile?: string | null
          stress_level?: string | null
          structure_without_sport?: string | null
          success_in_6_months?: string | null
          suggested_career_paths?: string | null
          time_management_style?: string | null
          transition_readiness_score?: number | null
          user_id: string
          work_internship_experience?: string | null
          work_style?: string | null
          year_in_school?: string | null
        }
        Update: {
          academic_major?: string | null
          athlete_archetype?: string | null
          biggest_career_concern?: string | null
          career_interest_areas?: string | null
          career_interests?: string | null
          class_year?: string | null
          confidence_strengths?: string | null
          connection_outside_team?: string | null
          created_at?: string | null
          division?: string | null
          dream_role_industry?: string | null
          graduation_year?: number | null
          hardest_emotionally?: string | null
          has_linkedin?: boolean | null
          has_networked?: boolean | null
          has_nil_or_volunteer?: string | null
          has_resume?: boolean | null
          id?: string
          industry_interests?: string | null
          instagram_handle?: string | null
          interests_outside_sport?: string | null
          leadership_roles?: string | null
          linkedin_url?: string | null
          motivation?: string | null
          name?: string | null
          nil_volunteer_description?: string | null
          onboarding_complete?: boolean | null
          position_role?: string | null
          post_sport_fear?: string | null
          preferred_communication_style?: string | null
          pro_career_goal?: string | null
          school?: string | null
          sport?: string | null
          strength_profile?: string | null
          stress_level?: string | null
          structure_without_sport?: string | null
          success_in_6_months?: string | null
          suggested_career_paths?: string | null
          time_management_style?: string | null
          transition_readiness_score?: number | null
          user_id?: string
          work_internship_experience?: string | null
          work_style?: string | null
          year_in_school?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          athlete_id: string
          content: string
          created_at: string | null
          id: string
          role: string
        }
        Insert: {
          athlete_id: string
          content: string
          created_at?: string | null
          id?: string
          role: string
        }
        Update: {
          athlete_id?: string
          content?: string
          created_at?: string | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
