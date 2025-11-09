import { supabase } from './supabase'
import type {
  AimTrainerScore,
  AimTrainerScoreInsert,
  TypingTestScore,
  TypingTestScoreInsert,
  MemoryScore,
  MemoryScoreInsert,
  PatternRecognitionScore,
  PatternRecognitionScoreInsert,
  ReactionTimeScore,
  ReactionTimeScoreInsert,
  NumberMemoryScore,
  NumberMemoryScoreInsert,
  VisualMemoryScore,
  VisualMemoryScoreInsert,
  StroopTestScore,
  StroopTestScoreInsert,
  SequenceMemoryScore,
  SequenceMemoryScoreInsert,
  ChimpTestScore,
  ChimpTestScoreInsert
} from './supabase'

// Score submission functions using RPC
export async function submitAimTrainerScore(score: AimTrainerScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_aim_trainer_score', {
      p_username: score.username,
      p_accuracy: score.accuracy,
      p_reaction_time: score.reaction_time,
      p_targets_hit: score.targets_hit,
      p_total_targets: score.total_targets
    })
  
  if (error) throw error
  return data
}

export async function submitTypingTestScore(score: TypingTestScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_typing_test_score', {
      p_username: score.username,
      p_wpm: score.wpm,
      p_accuracy: score.accuracy,
      p_characters_typed: score.characters_typed,
      p_time_taken: score.time_taken
    })
  
  if (error) throw error
  return data
}

export async function submitMemoryScore(score: MemoryScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_memory_score', {
      p_username: score.username,
      p_level_reached: score.level_reached,
      p_correct_sequences: score.correct_sequences,
      p_total_sequences: score.total_sequences
    })
  
  if (error) throw error
  return data
}

export async function submitPatternRecognitionScore(score: PatternRecognitionScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_pattern_recognition_score', {
      p_username: score.username,
      p_patterns_solved: score.patterns_solved,
      p_time_taken: score.time_taken,
      p_difficulty_level: score.difficulty_level
    })
  
  if (error) throw error
  return data
}

export async function submitReactionTimeScore(score: ReactionTimeScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_reaction_time_score', {
      p_username: score.username,
      p_average_time: score.average_time,
      p_fastest_time: score.fastest_time,
      p_attempts: score.attempts
    })
  
  if (error) throw error
  return data
}

export async function submitNumberMemoryScore(score: NumberMemoryScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_number_memory_score', {
      p_username: score.username,
      p_longest_sequence: score.longest_sequence
    })
  
  if (error) throw error
  return data
}

export async function submitVisualMemoryScore(score: VisualMemoryScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_visual_memory_score', {
      p_username: score.username,
      p_level_reached: score.level_reached,
      p_total_patterns: score.total_patterns
    })
  
  if (error) throw error
  return data
}

export async function submitStroopTestScore(score: StroopTestScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_stroop_test_score', {
      p_username: score.username,
      p_correct_answers: score.correct_answers,
      p_total_questions: score.total_questions,
      p_average_time: score.average_time
    })
  
  if (error) throw error
  return data
}

export async function submitSequenceMemoryScore(score: SequenceMemoryScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_sequence_memory_score', {
      p_username: score.username,
      p_level_reached: score.level_reached,
      p_longest_sequence: score.longest_sequence
    })
  
  if (error) throw error
  return data
}

export async function submitChimpTestScore(score: ChimpTestScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_chimp_test_score', {
      p_username: score.username,
      p_level_reached: score.level_reached,
      p_numbers_remembered: score.numbers_remembered,
      p_attempts: score.attempts
    })
  
  if (error) throw error
  return data
}

// Score fetching functions with filtering
export async function getAimTrainerScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('aim_trainer_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getTypingTestScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('typing_test_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getMemoryScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('memory_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPatternRecognitionScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('pattern_recognition_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getReactionTimeScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('reaction_time_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getNumberMemoryScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('number_memory_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getVisualMemoryScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('visual_memory_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getStroopTestScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('stroop_test_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSequenceMemoryScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('sequence_memory_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getChimpTestScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('chimp_test_scores')
    .select('*')
    .order('date_submitted', { ascending: false })

  if (filters?.username) {
    query = query.eq('username', filters.username)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
