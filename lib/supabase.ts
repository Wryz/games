import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Export database types for easier use
export type AimTrainerScore = Database['public']['Tables']['aim_trainer_scores']['Row']
export type TypingTestScore = Database['public']['Tables']['typing_test_scores']['Row']
export type MemoryScore = Database['public']['Tables']['memory_scores']['Row']
export type PatternRecognitionScore = Database['public']['Tables']['pattern_recognition_scores']['Row']
export type ReactionTimeScore = Database['public']['Tables']['reaction_time_scores']['Row']
export type NumberMemoryScore = Database['public']['Tables']['number_memory_scores']['Row']
export type VisualMemoryScore = Database['public']['Tables']['visual_memory_scores']['Row']
export type StroopTestScore = Database['public']['Tables']['stroop_test_scores']['Row']
export type SequenceMemoryScore = Database['public']['Tables']['sequence_memory_scores']['Row']
export type ChimpTestScore = Database['public']['Tables']['chimp_test_scores']['Row']

// Insert types for score submission
export type AimTrainerScoreInsert = Database['public']['Tables']['aim_trainer_scores']['Insert']
export type TypingTestScoreInsert = Database['public']['Tables']['typing_test_scores']['Insert']
export type MemoryScoreInsert = Database['public']['Tables']['memory_scores']['Insert']
export type PatternRecognitionScoreInsert = Database['public']['Tables']['pattern_recognition_scores']['Insert']
export type ReactionTimeScoreInsert = Database['public']['Tables']['reaction_time_scores']['Insert']
export type NumberMemoryScoreInsert = Database['public']['Tables']['number_memory_scores']['Insert']
export type VisualMemoryScoreInsert = Database['public']['Tables']['visual_memory_scores']['Insert']
export type StroopTestScoreInsert = Database['public']['Tables']['stroop_test_scores']['Insert']
export type SequenceMemoryScoreInsert = Database['public']['Tables']['sequence_memory_scores']['Insert']
export type ChimpTestScoreInsert = Database['public']['Tables']['chimp_test_scores']['Insert']
