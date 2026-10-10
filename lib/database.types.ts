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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_monthly_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_rankings"
            referencedColumns: ["student_id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          level: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          level: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          level?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      halaqahs: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "halaqahs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "halaqahs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_monthly_progress"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "halaqahs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_student_count"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "halaqahs_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      memorization_records: {
        Row: {
          ayah_end: number
          ayah_start: number
          created_at: string
          date: string
          fluency_score: number
          id: string
          juz: number
          line_count: number
          mistake_count: number
          notes: string | null
          recorded_by: string
          status: Database["public"]["Enums"]["record_status"]
          student_id: string
          surah_id: number
          type: Database["public"]["Enums"]["memorization_type"]
          updated_at: string
        }
        Insert: {
          ayah_end: number
          ayah_start: number
          created_at?: string
          date: string
          fluency_score?: number
          id?: string
          juz: number
          line_count: number
          mistake_count?: number
          notes?: string | null
          recorded_by: string
          status?: Database["public"]["Enums"]["record_status"]
          student_id: string
          surah_id: number
          type: Database["public"]["Enums"]["memorization_type"]
          updated_at?: string
        }
        Update: {
          ayah_end?: number
          ayah_start?: number
          created_at?: string
          date?: string
          fluency_score?: number
          id?: string
          juz?: number
          line_count?: number
          mistake_count?: number
          notes?: string | null
          recorded_by?: string
          status?: Database["public"]["Enums"]["record_status"]
          student_id?: string
          surah_id?: number
          type?: Database["public"]["Enums"]["memorization_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memorization_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memorization_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_monthly_progress"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "memorization_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "v_student_rankings"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "memorization_records_surah_id_fkey"
            columns: ["surah_id"]
            isOneToOne: false
            referencedRelation: "quran_surahs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      quran_surahs: {
        Row: {
          ayah_count: number
          id: number
          name_arabic: string
          name_latin: string
          name_translation: string
          number: number
        }
        Insert: {
          ayah_count: number
          id: number
          name_arabic: string
          name_latin: string
          name_translation: string
          number: number
        }
        Update: {
          ayah_count?: number
          id?: number
          name_arabic?: string
          name_latin?: string
          name_translation?: string
          number?: number
        }
        Relationships: []
      }
      school_settings: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          school_name: string
          theme: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          school_name?: string
          theme?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          school_name?: string
          theme?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"]
          halaqah_id: string
          id: string
          name: string
          nisn: string
          parent_name: string
          parent_whatsapp: string
          photo_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          gender: Database["public"]["Enums"]["gender_type"]
          halaqah_id: string
          id?: string
          name: string
          nisn: string
          parent_name: string
          parent_whatsapp: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          halaqah_id?: string
          id?: string
          name?: string
          nisn?: string
          parent_name?: string
          parent_whatsapp?: string
          photo_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_monthly_progress"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_student_count"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqahs"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          boarding_school: string | null
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          is_active: boolean
          name: string
          profile_id: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          boarding_school?: string | null
          created_at?: string
          gender: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_active?: boolean
          name: string
          profile_id?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          boarding_school?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          is_active?: boolean
          name?: string
          profile_id?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_class_monthly_progress: {
        Row: {
          class_id: string | null
          class_level: number | null
          class_name: string | null
          month_start: string | null
          total_sabaq_lines: number | null
        }
        Relationships: []
      }
      v_class_student_count: {
        Row: {
          class_id: string | null
          class_level: number | null
          class_name: string | null
          student_count: number | null
        }
        Relationships: []
      }
      v_daily_memorization_stats: {
        Row: {
          date: string | null
          day_of_month: number | null
          manzil_lines: number | null
          month_start: string | null
          sabaq_lines: number | null
          sabqi_lines: number | null
          total_lines: number | null
        }
        Relationships: []
      }
      v_dashboard_summary: {
        Row: {
          total_halaqahs: number | null
          total_sabaq_lines: number | null
          total_students: number | null
          total_teachers: number | null
        }
        Relationships: []
      }
      v_fluency_distribution: {
        Row: {
          avg_fluency_score: number | null
          excellent_count: number | null
          good_count: number | null
          month_start: string | null
          needs_work_count: number | null
          total_records: number | null
        }
        Relationships: []
      }
      v_juz_distribution: {
        Row: {
          group_0_1: number | null
          group_11_20: number | null
          group_2_5: number | null
          group_21_30: number | null
          group_6_10: number | null
          total_students: number | null
        }
        Relationships: []
      }
      v_student_monthly_progress: {
        Row: {
          class_id: string | null
          halaqah_id: string | null
          month_start: string | null
          monthly_sabaq_lines: number | null
          monthly_sabaq_records: number | null
          student_id: string | null
          student_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_monthly_progress"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_student_count"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqahs"
            referencedColumns: ["id"]
          },
        ]
      }
      v_student_rankings: {
        Row: {
          avg_fluency_score: number | null
          class_id: string | null
          class_level: number | null
          class_name: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          halaqah_id: string | null
          halaqah_name: string | null
          nisn: string | null
          ranking: number | null
          student_id: string | null
          student_name: string | null
          teacher_name: string | null
          total_juz_floor: number | null
          total_sabaq_lines: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_monthly_progress"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "v_class_student_count"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "students_halaqah_id_fkey"
            columns: ["halaqah_id"]
            isOneToOne: false
            referencedRelation: "halaqahs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_student: {
        Args: { target_student_id: string }
        Returns: boolean
      }
      current_teacher_id: { Args: never; Returns: string }
      get_public_school_settings: {
        Args: never
        Returns: {
          logo_url: string
          school_name: string
          theme: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_ustadz: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "ADMIN" | "USTADZ"
      attendance_status: "HADIR" | "IZIN" | "TERLAMBAT" | "ALPHA" | "SAKIT"
      gender_type: "L" | "P"
      memorization_type: "SABAQ" | "SABQI" | "MANZIL"
      record_status: "ACTIVE" | "VOID"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["ADMIN", "USTADZ"],
      attendance_status: ["HADIR", "IZIN", "TERLAMBAT", "ALPHA", "SAKIT"],
      gender_type: ["L", "P"],
      memorization_type: ["SABAQ", "SABQI", "MANZIL"],
      record_status: ["ACTIVE", "VOID"],
    },
  },
} as const
