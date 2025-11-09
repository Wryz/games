import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for each game's score table
export interface BaseScore {
  id?: number
  username: string
  date_submitted: string
  created_at?: string
}

export interface AimTrainerScore extends BaseScore {
  accuracy: number
  reaction_time: number
  targets_hit: number
  total_targets: number
}

export interface TypingTestScore extends BaseScore {
  wpm: number
  accuracy: number
  characters_typed: number
  time_taken: number
}

export interface MemoryScore extends BaseScore {
  level_reached: number
  correct_sequences: number
  total_sequences: number
}

export interface PatternRecognitionScore extends BaseScore {
  patterns_solved: number
  time_taken: number
  difficulty_level: number
}

export interface ReactionTimeScore extends BaseScore {
  average_time: number
  fastest_time: number
  attempts: number
}

export interface NumberMemoryScore extends BaseScore {
  longest_sequence: number
  attempts: number
}

export interface VisualMemoryScore extends BaseScore {
  level_reached: number
  patterns_remembered: number
  total_patterns: number
}

export interface StroopTestScore extends BaseScore {
  correct_answers: number
  total_questions: number
  average_time: number
}

export interface SequenceMemoryScore extends BaseScore {
  level_reached: number
  longest_sequence: number
}

export interface ChimpTestScore extends BaseScore {
  level_reached: number
  numbers_remembered: number
  attempts: number
}
