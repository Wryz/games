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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aim_trainer_scores: {
        Row: {
          accuracy: number
          date_submitted: string | null
          id: number
          reaction_time: number
          targets_hit: number
          total_targets: number
          username: string
        }
        Insert: {
          accuracy: number
          date_submitted?: string | null
          id?: number
          reaction_time: number
          targets_hit: number
          total_targets: number
          username: string
        }
        Update: {
          accuracy?: number
          date_submitted?: string | null
          id?: number
          reaction_time?: number
          targets_hit?: number
          total_targets?: number
          username?: string
        }
        Relationships: []
      }
      algebra_scores: {
        Row: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        Insert: {
          average_time: number
          correct_answers: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username: string
        }
        Update: {
          average_time?: number
          correct_answers?: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username?: string
        }
        Relationships: []
      }
      arithmetic_scores: {
        Row: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        Insert: {
          average_time: number
          correct_answers: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username: string
        }
        Update: {
          average_time?: number
          correct_answers?: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username?: string
        }
        Relationships: []
      }
      chimp_test_scores: {
        Row: {
          date_submitted: string | null
          id: number
          patterns_remembered: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          id?: number
          patterns_remembered: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          id?: number
          patterns_remembered?: number
          username?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          date_submitted: string | null
          feedback: string
          id: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          feedback: string
          id?: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          feedback?: string
          id?: number
          username?: string
        }
        Relationships: []
      }
      linear_algebra_scores: {
        Row: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        Insert: {
          average_time: number
          correct_answers: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username: string
        }
        Update: {
          average_time?: number
          correct_answers?: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username?: string
        }
        Relationships: []
      }
      maze_scores: {
        Row: {
          created_at: string | null
          date_submitted: string | null
          id: number
          time_taken: number
          username: string
        }
        Insert: {
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          time_taken: number
          username: string
        }
        Update: {
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          time_taken?: number
          username?: string
        }
        Relationships: []
      }
      memory_scores: {
        Row: {
          correct_sequences: number
          date_submitted: string | null
          id: number
          level_reached: number
          total_sequences: number
          username: string
        }
        Insert: {
          correct_sequences: number
          date_submitted?: string | null
          id?: number
          level_reached: number
          total_sequences: number
          username: string
        }
        Update: {
          correct_sequences?: number
          date_submitted?: string | null
          id?: number
          level_reached?: number
          total_sequences?: number
          username?: string
        }
        Relationships: []
      }
      number_memory_scores: {
        Row: {
          date_submitted: string | null
          id: number
          longest_sequence: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          id?: number
          longest_sequence: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          id?: number
          longest_sequence?: number
          username?: string
        }
        Relationships: []
      }
      pattern_recognition_scores: {
        Row: {
          date_submitted: string | null
          difficulty_level: number
          id: number
          patterns_solved: number
          time_taken: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          difficulty_level: number
          id?: number
          patterns_solved: number
          time_taken: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          difficulty_level?: number
          id?: number
          patterns_solved?: number
          time_taken?: number
          username?: string
        }
        Relationships: []
      }
      reaction_time_scores: {
        Row: {
          attempts: number
          average_time: number
          date_submitted: string | null
          fastest_time: number
          id: number
          username: string
        }
        Insert: {
          attempts: number
          average_time: number
          date_submitted?: string | null
          fastest_time: number
          id?: number
          username: string
        }
        Update: {
          attempts?: number
          average_time?: number
          date_submitted?: string | null
          fastest_time?: number
          id?: number
          username?: string
        }
        Relationships: []
      }
      sequence_memory_scores: {
        Row: {
          date_submitted: string | null
          id: number
          level_reached: number
          longest_sequence: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          id?: number
          level_reached: number
          longest_sequence: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          id?: number
          level_reached?: number
          longest_sequence?: number
          username?: string
        }
        Relationships: []
      }
      stroop_test_scores: {
        Row: {
          average_time: number
          correct_answers: number
          date_submitted: string | null
          id: number
          username: string
        }
        Insert: {
          average_time: number
          correct_answers: number
          date_submitted?: string | null
          id?: number
          username: string
        }
        Update: {
          average_time?: number
          correct_answers?: number
          date_submitted?: string | null
          id?: number
          username?: string
        }
        Relationships: []
      }
      time_estimation_scores: {
        Row: {
          average_accuracy: number
          best_accuracy: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        Insert: {
          average_accuracy: number
          best_accuracy: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username: string
        }
        Update: {
          average_accuracy?: number
          best_accuracy?: number
          created_at?: string | null
          date_submitted?: string | null
          id?: number
          username?: string
        }
        Relationships: []
      }
      typing_test_scores: {
        Row: {
          accuracy: number
          characters_typed: number
          date_submitted: string | null
          id: number
          time_taken: number
          username: string
          wpm: number
        }
        Insert: {
          accuracy: number
          characters_typed: number
          date_submitted?: string | null
          id?: number
          time_taken: number
          username: string
          wpm: number
        }
        Update: {
          accuracy?: number
          characters_typed?: number
          date_submitted?: string | null
          id?: number
          time_taken?: number
          username?: string
          wpm?: number
        }
        Relationships: []
      }
      visual_memory_scores: {
        Row: {
          date_submitted: string | null
          id: number
          level_reached: number
          total_patterns: number
          username: string
        }
        Insert: {
          date_submitted?: string | null
          id?: number
          level_reached: number
          total_patterns: number
          username: string
        }
        Update: {
          date_submitted?: string | null
          id?: number
          level_reached?: number
          total_patterns?: number
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_game_stats_overview: { Args: { p_username?: string }; Returns: Json }
      get_recent_activity: { Args: { p_limit?: number }; Returns: Json }
      submit_aim_trainer_score: {
        Args: {
          p_accuracy: number
          p_reaction_time: number
          p_targets_hit: number
          p_total_targets: number
          p_username: string
        }
        Returns: {
          accuracy: number
          date_submitted: string | null
          id: number
          reaction_time: number
          targets_hit: number
          total_targets: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "aim_trainer_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_algebra_score: {
        Args: {
          p_average_time: number
          p_correct_answers: number
          p_username: string
        }
        Returns: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "algebra_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_arithmetic_score: {
        Args: {
          p_average_time: number
          p_correct_answers: number
          p_username: string
        }
        Returns: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "arithmetic_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_chimp_test_score:
        | {
            Args: { p_patterns_remembered: number; p_username: string }
            Returns: {
              date_submitted: string | null
              id: number
              patterns_remembered: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "chimp_test_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_level_reached: number
              p_patterns_remembered: number
              p_total_patterns: number
              p_username: string
            }
            Returns: {
              date_submitted: string | null
              id: number
              patterns_remembered: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "chimp_test_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      submit_feedback: {
        Args: { p_feedback: string; p_username: string }
        Returns: {
          date_submitted: string | null
          feedback: string
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "feedback"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_linear_algebra_score: {
        Args: {
          p_average_time: number
          p_correct_answers: number
          p_username: string
        }
        Returns: {
          average_time: number
          correct_answers: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "linear_algebra_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_maze_score: {
        Args: { p_time_taken: number; p_username: string }
        Returns: {
          created_at: string | null
          date_submitted: string | null
          id: number
          time_taken: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "maze_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_memory_score: {
        Args: {
          p_correct_sequences: number
          p_level_reached: number
          p_total_sequences: number
          p_username: string
        }
        Returns: {
          correct_sequences: number
          date_submitted: string | null
          id: number
          level_reached: number
          total_sequences: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "memory_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_number_memory_score:
        | {
            Args: { p_longest_sequence: number; p_username: string }
            Returns: {
              date_submitted: string | null
              id: number
              longest_sequence: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "number_memory_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_attempts: number
              p_longest_sequence: number
              p_username: string
            }
            Returns: {
              date_submitted: string | null
              id: number
              longest_sequence: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "number_memory_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      submit_pattern_recognition_score: {
        Args: {
          p_difficulty_level: number
          p_patterns_solved: number
          p_time_taken: number
          p_username: string
        }
        Returns: {
          date_submitted: string | null
          difficulty_level: number
          id: number
          patterns_solved: number
          time_taken: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "pattern_recognition_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_reaction_time_score: {
        Args: {
          p_attempts: number
          p_average_time: number
          p_fastest_time: number
          p_username: string
        }
        Returns: {
          attempts: number
          average_time: number
          date_submitted: string | null
          fastest_time: number
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "reaction_time_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_sequence_memory_score: {
        Args: {
          p_level_reached: number
          p_longest_sequence: number
          p_username: string
        }
        Returns: {
          date_submitted: string | null
          id: number
          level_reached: number
          longest_sequence: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "sequence_memory_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_stroop_test_score:
        | {
            Args: {
              p_average_time: number
              p_correct_answers: number
              p_total_questions: number
              p_username: string
            }
            Returns: {
              average_time: number
              correct_answers: number
              date_submitted: string | null
              id: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "stroop_test_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_average_time: number
              p_correct_answers: number
              p_username: string
            }
            Returns: {
              average_time: number
              correct_answers: number
              date_submitted: string | null
              id: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "stroop_test_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      submit_time_estimation_score: {
        Args: {
          p_average_accuracy: number
          p_best_accuracy: number
          p_username: string
        }
        Returns: {
          average_accuracy: number
          best_accuracy: number
          created_at: string | null
          date_submitted: string | null
          id: number
          username: string
        }
        SetofOptions: {
          from: "*"
          to: "time_estimation_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_typing_test_score: {
        Args: {
          p_accuracy: number
          p_characters_typed: number
          p_time_taken: number
          p_username: string
          p_wpm: number
        }
        Returns: {
          accuracy: number
          characters_typed: number
          date_submitted: string | null
          id: number
          time_taken: number
          username: string
          wpm: number
        }
        SetofOptions: {
          from: "*"
          to: "typing_test_scores"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_visual_memory_score:
        | {
            Args: {
              p_level_reached: number
              p_total_patterns: number
              p_username: string
            }
            Returns: {
              date_submitted: string | null
              id: number
              level_reached: number
              total_patterns: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "visual_memory_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: {
              p_level_reached: number
              p_patterns_remembered: number
              p_total_patterns: number
              p_username: string
            }
            Returns: {
              date_submitted: string | null
              id: number
              level_reached: number
              total_patterns: number
              username: string
            }
            SetofOptions: {
              from: "*"
              to: "visual_memory_scores"
              isOneToOne: true
              isSetofReturn: false
            }
          }
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
