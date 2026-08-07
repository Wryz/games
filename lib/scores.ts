import { supabase } from './supabase'
import type {
  AimTrainerScore,
  AimTrainerScoreInsert,
  TypingTestScore,
  TypingTestScoreInsert,
  MemoryScore,
  MemoryScoreInsert,
  ReactionTimeScore,
  ReactionTimeScoreInsert,
  NumberMemoryScore,
  NumberMemoryScoreInsert,
  VisualMemoryScore,
  VisualMemoryScoreInsert,
  StroopTestScore,
  StroopTestScoreInsert,
  ChimpTestScore,
  ChimpTestScoreInsert,
  TimeEstimationScore,
  TimeEstimationScoreInsert,
  MazeScore,
  MazeScoreInsert,
  AlgebraScore,
  AlgebraScoreInsert,
  ArithmeticScore,
  ArithmeticScoreInsert,
  GeometryScore,
  GeometryScoreInsert,
  WordSearchScore,
  WordSearchScoreInsert,
  SudokuScore,
  SudokuScoreInsert
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
      p_average_time: score.average_time
    })
  
  if (error) throw error
  return data
}

export async function submitChimpTestScore(score: ChimpTestScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_chimp_test_score', {
      p_username: score.username,
      p_patterns_remembered: score.patterns_remembered
    })
  
  if (error) throw error
  return data
}

export async function submitTimeEstimationScore(score: TimeEstimationScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_time_estimation_score', {
      p_username: score.username,
      p_average_accuracy: score.average_accuracy,
      p_best_accuracy: score.best_accuracy
    })
  
  if (error) throw error
  return data
}

export async function submitMazeScore(score: MazeScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_maze_score', {
      p_username: score.username,
      p_time_taken: score.time_taken
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

export async function getReactionTimeScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('reaction_time_scores')
    .select('*')
    .order('average_time', { ascending: true })

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

export async function getTimeEstimationScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('time_estimation_scores')
    .select('*')
    .order('best_accuracy', { ascending: true })

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

export async function getMazeScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('maze_scores')
    .select('*')
    .order('time_taken', { ascending: true })

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

export async function submitAlgebraScore(score: AlgebraScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_algebra_score', {
      p_username: score.username,
      p_correct_answers: score.correct_answers,
      p_average_time: score.average_time
    })
  
  if (error) throw error
  return data
}

export async function getAlgebraScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('algebra_scores')
    .select('*')
    .order('correct_answers', { ascending: false })
    .order('average_time', { ascending: true })

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

export async function submitArithmeticScore(score: ArithmeticScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_arithmetic_score', {
      p_username: score.username,
      p_correct_answers: score.correct_answers,
      p_average_time: score.average_time
    })
  
  if (error) throw error
  return data
}

export async function getArithmeticScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('arithmetic_scores')
    .select('*')
    .order('correct_answers', { ascending: false })
    .order('average_time', { ascending: true })

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

export async function submitGeometryScore(score: GeometryScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_geometry_score', {
      p_username: score.username,
      p_correct_answers: score.correct_answers,
      p_average_time: score.average_time
    })
  
  if (error) throw error
  return data
}

export async function getGeometryScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('geometry_scores')
    .select('*')
    .order('correct_answers', { ascending: false })
    .order('average_time', { ascending: true })

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

export async function submitWordSearchScore(score: WordSearchScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_word_search_score', {
      p_username: score.username,
      p_characters_found: score.characters_found
    })
  
  if (error) throw error
  return data
}

export async function getWordSearchScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('word_search_scores')
    .select('*')
    .order('characters_found', { ascending: false })

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

export async function submitSudokuScore(score: SudokuScoreInsert) {
  const { data, error } = await supabase
    .rpc('submit_sudoku_score', {
      p_username: score.username,
      p_time_taken: score.time_taken
    })
  
  if (error) throw error
  return data
}

export async function getSudokuScores(filters?: { username?: string; limit?: number }) {
  let query = supabase
    .from('sudoku_scores')
    .select('*')
    .order('time_taken', { ascending: true })

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

// Get all scores from all games
export interface AllScoresEntry {
  gameId: string
  gameName: string
  username: string
  score: any
  dateSubmitted: string | null
}

export async function getAllScores(): Promise<AllScoresEntry[]> {
  const allScores: AllScoresEntry[] = []

  // Fetch all scores from each game table
  const [
    aimTrainerScores,
    typingTestScores,
    memoryScores,
    reactionTimeScores,
    numberMemoryScores,
    visualMemoryScores,
    stroopTestScores,
    chimpTestScores,
    timeEstimationScores,
    mazeScores,
    algebraScores,
    arithmeticScores,
    geometryScores,
    wordSearchScores,
    sudokuScores
  ] = await Promise.all([
    getAimTrainerScores(),
    getTypingTestScores(),
    getMemoryScores(),
    getReactionTimeScores(),
    getNumberMemoryScores(),
    getVisualMemoryScores(),
    getStroopTestScores(),
    getChimpTestScores(),
    getTimeEstimationScores(),
    getMazeScores(),
    getAlgebraScores(),
    getArithmeticScores(),
    getGeometryScores(),
    getWordSearchScores(),
    getSudokuScores()
  ])

  // Map each score to AllScoresEntry format
  aimTrainerScores?.forEach(score => {
    allScores.push({
      gameId: 'aim-trainer',
      gameName: 'Aim Trainer',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  typingTestScores?.forEach(score => {
    allScores.push({
      gameId: 'typing-test',
      gameName: 'Typing Test',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  memoryScores?.forEach(score => {
    allScores.push({
      gameId: 'memory',
      gameName: 'Memory Game',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  reactionTimeScores?.forEach(score => {
    allScores.push({
      gameId: 'reaction-time',
      gameName: 'Reaction Time',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  numberMemoryScores?.forEach(score => {
    allScores.push({
      gameId: 'number-memory',
      gameName: 'Number Memory',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  visualMemoryScores?.forEach(score => {
    allScores.push({
      gameId: 'visual-memory',
      gameName: 'Visual Memory',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  stroopTestScores?.forEach(score => {
    allScores.push({
      gameId: 'stroop-test',
      gameName: 'Stroop Test',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  chimpTestScores?.forEach(score => {
    allScores.push({
      gameId: 'chimp-test',
      gameName: 'Chimp Test',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  timeEstimationScores?.forEach(score => {
    allScores.push({
      gameId: 'time-estimation',
      gameName: 'Time Estimation',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  mazeScores?.forEach(score => {
    allScores.push({
      gameId: 'maze',
      gameName: 'Maze',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  algebraScores?.forEach(score => {
    allScores.push({
      gameId: 'algebra',
      gameName: 'Algebra',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  arithmeticScores?.forEach(score => {
    allScores.push({
      gameId: 'arithmetic',
      gameName: 'Arithmetic',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  geometryScores?.forEach(score => {
    allScores.push({
      gameId: 'geometry',
      gameName: 'Geometry',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  wordSearchScores?.forEach(score => {
    allScores.push({
      gameId: 'word-search',
      gameName: 'Word Search',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  sudokuScores?.forEach(score => {
    allScores.push({
      gameId: 'sudoku',
      gameName: 'Sudoku',
      username: score.username,
      score: score,
      dateSubmitted: score.date_submitted
    })
  })

  // Sort by date submitted (most recent first)
  allScores.sort((a, b) => {
    const dateA = a.dateSubmitted ? new Date(a.dateSubmitted).getTime() : 0
    const dateB = b.dateSubmitted ? new Date(b.dateSubmitted).getTime() : 0
    return dateB - dateA
  })

  return allScores
}
