import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/rest\/v1\/?$/, '')
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
export type ReactionTimeScore = Database['public']['Tables']['reaction_time_scores']['Row']
export type NumberMemoryScore = Database['public']['Tables']['number_memory_scores']['Row']
export type VisualMemoryScore = Database['public']['Tables']['visual_memory_scores']['Row']
export type StroopTestScore = Database['public']['Tables']['stroop_test_scores']['Row']
export type ChimpTestScore = Database['public']['Tables']['chimp_test_scores']['Row']
export type TimeEstimationScore = Database['public']['Tables']['time_estimation_scores']['Row']
export type MazeScore = Database['public']['Tables']['maze_scores']['Row']
export type AlgebraScore = Database['public']['Tables']['algebra_scores']['Row']
export type ArithmeticScore = Database['public']['Tables']['arithmetic_scores']['Row']
export type GeometryScore = Database['public']['Tables']['geometry_scores']['Row']
export type WordSearchScore = Database['public']['Tables']['word_search_scores']['Row']

// Insert types for score submission
export type AimTrainerScoreInsert = Database['public']['Tables']['aim_trainer_scores']['Insert']
export type TypingTestScoreInsert = Database['public']['Tables']['typing_test_scores']['Insert']
export type MemoryScoreInsert = Database['public']['Tables']['memory_scores']['Insert']
export type ReactionTimeScoreInsert = Database['public']['Tables']['reaction_time_scores']['Insert']
export type NumberMemoryScoreInsert = Database['public']['Tables']['number_memory_scores']['Insert']
export type VisualMemoryScoreInsert = Database['public']['Tables']['visual_memory_scores']['Insert']
export type StroopTestScoreInsert = Database['public']['Tables']['stroop_test_scores']['Insert']
export type ChimpTestScoreInsert = Database['public']['Tables']['chimp_test_scores']['Insert']
export type TimeEstimationScoreInsert = Database['public']['Tables']['time_estimation_scores']['Insert']
export type MazeScoreInsert = Database['public']['Tables']['maze_scores']['Insert']
export type AlgebraScoreInsert = Database['public']['Tables']['algebra_scores']['Insert']
export type ArithmeticScoreInsert = Database['public']['Tables']['arithmetic_scores']['Insert']
export type GeometryScoreInsert = Database['public']['Tables']['geometry_scores']['Insert']
export type WordSearchScoreInsert = Database['public']['Tables']['word_search_scores']['Insert']
