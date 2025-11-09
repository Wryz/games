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

// Score submission functions
export async function submitAimTrainerScore(score: AimTrainerScoreInsert) {
  const { data, error } = await supabase
    .from('aim_trainer_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitTypingTestScore(score: TypingTestScoreInsert) {
  const { data, error } = await supabase
    .from('typing_test_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitMemoryScore(score: MemoryScoreInsert) {
  const { data, error } = await supabase
    .from('memory_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitPatternRecognitionScore(score: PatternRecognitionScoreInsert) {
  const { data, error } = await supabase
    .from('pattern_recognition_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitReactionTimeScore(score: ReactionTimeScoreInsert) {
  const { data, error } = await supabase
    .from('reaction_time_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitNumberMemoryScore(score: NumberMemoryScoreInsert) {
  const { data, error } = await supabase
    .from('number_memory_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitVisualMemoryScore(score: VisualMemoryScoreInsert) {
  const { data, error } = await supabase
    .from('visual_memory_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitStroopTestScore(score: StroopTestScoreInsert) {
  const { data, error } = await supabase
    .from('stroop_test_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitSequenceMemoryScore(score: SequenceMemoryScoreInsert) {
  const { data, error } = await supabase
    .from('sequence_memory_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function submitChimpTestScore(score: ChimpTestScoreInsert) {
  const { data, error } = await supabase
    .from('chimp_test_scores')
    .insert([score])
    .select()
  
  if (error) throw error
  return data[0]
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
