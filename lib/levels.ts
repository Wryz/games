// Helper function to format numbers with commas
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0'
  const numValue = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(numValue)) return '0'
  return numValue.toLocaleString('en-US')
}

// Education level mappings
export const EDUCATION_LEVELS: Record<number, string> = {
  1: 'Pre-School',
  2: 'Kindergarten',
  3: '1st Grade',
  4: '2nd Grade',
  5: '3rd Grade',
  6: '4th Grade',
  7: '5th Grade',
  8: '6th Grade',
  9: '7th Grade',
  10: '8th Grade',
  11: '9th Grade',
  12: '10th Grade',
  13: '11th Grade',
  14: '12th Grade',
  15: 'College Freshman',
  16: 'College Sophomore',
  17: 'College Junior',
  18: 'College Senior',
  19: "Master's Degree",
  20: 'Doctorate'
}

export type GameCategory = 'motor' | 'memory' | 'perception' | 'cognitive' | 'computation' | 'attention' | 'language' | 'social' | 'creative' | 'spatial' | 'linguistic' | 'geography'

export interface GameLevelInfo {
  currentLevel: number
  educationLevel: string
  nextLevelThreshold: number | number[] | null
  progress: number // 0-100
}

export interface CategoryLevelInfo {
  category: GameCategory
  level: number
  educationLevel: string
  games: Array<{
    gameId: string
    gameName: string
    levelInfo: GameLevelInfo
  }>
}

// Threshold definitions for each game type
// Threshold is always an array of numbers (e.g., [value] for single metric, [accuracy, reaction_time] for multiple metrics)
interface GameThresholds {
  [gameId: string]: Array<{ level: number; threshold: number[] }>
}

const GAME_THRESHOLDS: GameThresholds = {
  'aim-trainer': [
    { level: 1, threshold: [0, 2000] }, // Pre-School - any accuracy, 2000ms or slower
    { level: 2, threshold: [30, 1500] }, // Kindergarten - 30% accuracy, 1500ms or slower
    { level: 3, threshold: [40, 1300] }, // 1st Grade - 40% accuracy, 1300ms or slower
    { level: 4, threshold: [50, 1100] }, // 2nd Grade - 50% accuracy, 1100ms or slower
    { level: 5, threshold: [60, 950] }, // 3rd Grade - 60% accuracy, 950ms or slower
    { level: 6, threshold: [70, 850] }, // 4th Grade - 70% accuracy, 850ms or slower
    { level: 7, threshold: [75, 750] }, // 5th Grade - 75% accuracy, 750ms or slower
    { level: 8, threshold: [80, 700] }, // 6th Grade - 80% accuracy, 700ms or slower
    { level: 9, threshold: [82, 650] }, // 7th Grade - 82% accuracy, 650ms or slower
    { level: 10, threshold: [85, 600] }, // 8th Grade - 85% accuracy, 600ms or slower
    { level: 11, threshold: [87, 550] }, // 9th Grade - 87% accuracy, 550ms or slower
    { level: 12, threshold: [90, 520] }, // 10th Grade - 90% accuracy, 520ms or slower
    { level: 13, threshold: [92, 490] }, // 11th Grade - 92% accuracy, 490ms or slower
    { level: 14, threshold: [95, 460] }, // 12th Grade - 95% accuracy, 460ms or slower
    { level: 15, threshold: [96, 440] }, // College Freshman - 96% accuracy, 440ms or slower
    { level: 16, threshold: [97, 420] }, // College Sophomore - 97% accuracy, 420ms or slower
    { level: 17, threshold: [98, 410] }, // College Junior - 98% accuracy, 410ms or slower
    { level: 18, threshold: [99, 405] }, // College Senior - 99% accuracy, 405ms or slower
    { level: 19, threshold: [99.5, 402] }, // Master's - 99.5% accuracy, 402ms or slower
    { level: 20, threshold: [100, 400] } // Doctorate - 100% accuracy, 400ms or faster
  ],
  'typing-test': [
    { level: 1, threshold: [0] }, // Pre-School
    { level: 2, threshold: [5] }, // Kindergarten - 5 WPM
    { level: 3, threshold: [10] }, // 1st Grade - 10 WPM
    { level: 4, threshold: [15] }, // 2nd Grade - 15 WPM
    { level: 5, threshold: [25] }, // 3rd Grade - 25 WPM
    { level: 6, threshold: [35] }, // 4th Grade - 35 WPM
    { level: 7, threshold: [45] }, // 5th Grade - 45 WPM
    { level: 8, threshold: [55] }, // 6th Grade - 55 WPM
    { level: 9, threshold: [60] }, // 7th Grade - 60 WPM
    { level: 10, threshold: [65] }, // 8th Grade - 65 WPM
    { level: 11, threshold: [70] }, // 9th Grade - 70 WPM
    { level: 12, threshold: [75] }, // 10th Grade - 75 WPM
    { level: 13, threshold: [80] }, // 11th Grade - 80 WPM
    { level: 14, threshold: [85] }, // 12th Grade - 85 WPM
    { level: 15, threshold: [90] }, // College Freshman - 90 WPM
    { level: 16, threshold: [95] }, // College Sophomore - 95 WPM
    { level: 17, threshold: [100] }, // College Junior - 100 WPM
    { level: 18, threshold: [110] }, // College Senior - 110 WPM
    { level: 19, threshold: [120] }, // Master's - 120 WPM
    { level: 20, threshold: [130] } // Doctorate - 130+ WPM
  ],
  'reaction-time': [
    { level: 1, threshold: [1400] }, // Pre-School - 1000ms or slower
    { level: 2, threshold: [1000] }, // Kindergarten - 800ms
    { level: 3, threshold: [800] }, // 1st Grade - 600ms
    { level: 4, threshold: [700] }, // 2nd Grade - 500ms
    { level: 5, threshold: [600] }, // 3rd Grade - 450ms (typical for ages 4-6)
    { level: 6, threshold: [500] }, // 4th Grade - 400ms
    { level: 7, threshold: [470] }, // 5th Grade - 350ms (typical for ages 7-10)
    { level: 8, threshold: [450] }, // 6th Grade - 320ms
    { level: 9, threshold: [430] }, // 7th Grade - 300ms
    { level: 10, threshold: [400] }, // 8th Grade - 280ms (typical for ages 11-14)
    { level: 11, threshold: [370] }, // 9th Grade - 270ms
    { level: 12, threshold: [340] }, // 10th Grade - 260ms
    { level: 13, threshold: [310] }, // 11th Grade - 250ms (typical for ages 15-18)
    { level: 14, threshold: [300] }, // 12th Grade - 245ms
    { level: 15, threshold: [290] }, // College Freshman - 240ms (peak performance ages 18-24)
    { level: 16, threshold: [280] }, // College Sophomore - 235ms
    { level: 17, threshold: [270] }, // College Junior - 230ms
    { level: 18, threshold: [260] }, // College Senior - 225ms
    { level: 19, threshold: [250] }, // Master's - 220ms
    { level: 20, threshold: [240] } // Doctorate - 200ms or faster (elite performance)
  ],
  'memory': [
    { level: 1, threshold: [1] }, // Pre-School - level 1
    { level: 2, threshold: [2] }, // Kindergarten - level 2
    { level: 3, threshold: [3] }, // 1st Grade - level 3
    { level: 4, threshold: [4] }, // 2nd Grade - level 4
    { level: 5, threshold: [5] }, // 3rd Grade - level 5
    { level: 6, threshold: [6] }, // 4th Grade - level 6
    { level: 7, threshold: [7] }, // 5th Grade - level 7
    { level: 8, threshold: [8] }, // 6th Grade - level 8
    { level: 9, threshold: [9] }, // 7th Grade - level 9
    { level: 10, threshold: [10] }, // 8th Grade - level 10
    { level: 11, threshold: [11] }, // 9th Grade - level 11
    { level: 12, threshold: [12] }, // 10th Grade - level 12
    { level: 13, threshold: [13] }, // 11th Grade - level 13
    { level: 14, threshold: [14] }, // 12th Grade - level 14
    { level: 15, threshold: [16] }, // College Freshman - level 16
    { level: 16, threshold: [18] }, // College Sophomore - level 18
    { level: 17, threshold: [20] }, // College Junior - level 20
    { level: 18, threshold: [22] }, // College Senior - level 22
    { level: 19, threshold: [25] }, // Master's - level 25
    { level: 20, threshold: [30] } // Doctorate - level 30+
  ],
  'visual-memory': [
    { level: 1, threshold: [1] }, // Pre-School - level 1
    { level: 2, threshold: [2] }, // Kindergarten - level 2
    { level: 3, threshold: [3] }, // 1st Grade - level 3
    { level: 4, threshold: [4] }, // 2nd Grade - level 4
    { level: 5, threshold: [5] }, // 3rd Grade - level 5
    { level: 6, threshold: [6] }, // 4th Grade - level 6
    { level: 7, threshold: [7] }, // 5th Grade - level 7
    { level: 8, threshold: [8] }, // 6th Grade - level 8
    { level: 9, threshold: [9] }, // 7th Grade - level 9
    { level: 10, threshold: [10] }, // 8th Grade - level 10
    { level: 11, threshold: [11] }, // 9th Grade - level 11
    { level: 12, threshold: [12] }, // 10th Grade - level 12
    { level: 13, threshold: [13] }, // 11th Grade - level 13
    { level: 14, threshold: [14] }, // 12th Grade - level 14
    { level: 15, threshold: [16] }, // College Freshman - level 16
    { level: 16, threshold: [18] }, // College Sophomore - level 18
    { level: 17, threshold: [20] }, // College Junior - level 20
    { level: 18, threshold: [22] }, // College Senior - level 22
    { level: 19, threshold: [25] }, // Master's - level 25
    { level: 20, threshold: [30] } // Doctorate - level 30+
  ],
  'sequence-memory': [
    { level: 1, threshold: [1] }, // Pre-School - level 1
    { level: 2, threshold: [2] }, // Kindergarten - level 2
    { level: 3, threshold: [3] }, // 1st Grade - level 3
    { level: 4, threshold: [4] }, // 2nd Grade - level 4
    { level: 5, threshold: [5] }, // 3rd Grade - level 5
    { level: 6, threshold: [6] }, // 4th Grade - level 6
    { level: 7, threshold: [7] }, // 5th Grade - level 7
    { level: 8, threshold: [8] }, // 6th Grade - level 8
    { level: 9, threshold: [9] }, // 7th Grade - level 9
    { level: 10, threshold: [10] }, // 8th Grade - level 10
    { level: 11, threshold: [11] }, // 9th Grade - level 11
    { level: 12, threshold: [12] }, // 10th Grade - level 12
    { level: 13, threshold: [13] }, // 11th Grade - level 13
    { level: 14, threshold: [14] }, // 12th Grade - level 14
    { level: 15, threshold: [16] }, // College Freshman - level 16
    { level: 16, threshold: [18] }, // College Sophomore - level 18
    { level: 17, threshold: [20] }, // College Junior - level 20
    { level: 18, threshold: [22] }, // College Senior - level 22
    { level: 19, threshold: [25] }, // Master's - level 25
    { level: 20, threshold: [30] } // Doctorate - level 30+
  ],
  'number-memory': [
    { level: 1, threshold: [2] }, // Pre-School - 2 digits
    { level: 2, threshold: [3] }, // Kindergarten - 3 digits
    { level: 3, threshold: [4] }, // 1st Grade - 4 digits
    { level: 4, threshold: [5] }, // 2nd Grade - 5 digits
    { level: 5, threshold: [6] }, // 3rd Grade - 6 digits
    { level: 6, threshold: [7] }, // 4th Grade - 7 digits
    { level: 7, threshold: [8] }, // 5th Grade - 8 digits
    { level: 8, threshold: [9] }, // 6th Grade - 9 digits
    { level: 9, threshold: [10] }, // 7th Grade - 10 digits
    { level: 10, threshold: [11] }, // 8th Grade - 11 digits
    { level: 11, threshold: [12] }, // 9th Grade - 12 digits
    { level: 12, threshold: [13] }, // 10th Grade - 13 digits
    { level: 13, threshold: [14] }, // 11th Grade - 14 digits
    { level: 14, threshold: [15] }, // 12th Grade - 15 digits
    { level: 15, threshold: [16] }, // College Freshman - 16 digits
    { level: 16, threshold: [18] }, // College Sophomore - 18 digits
    { level: 17, threshold: [20] }, // College Junior - 20 digits
    { level: 18, threshold: [22] }, // College Senior - 22 digits
    { level: 19, threshold: [25] }, // Master's - 25 digits
    { level: 20, threshold: [30] } // Doctorate - 30+ digits
  ],
  'pattern-recognition': [
    { level: 1, threshold: [1] }, // Pre-School - 1 pattern
    { level: 2, threshold: [3] }, // Kindergarten - 2 patterns
    { level: 3, threshold: [5] }, // 1st Grade - 3 patterns
    { level: 4, threshold: [7] }, // 2nd Grade - 5 patterns
    { level: 5, threshold: [9] }, // 3rd Grade - 8 patterns
    { level: 6, threshold: [11] }, // 4th Grade - 12 patterns
    { level: 7, threshold: [13] }, // 5th Grade - 15 patterns
    { level: 8, threshold: [15] }, // 6th Grade - 20 patterns
    { level: 9, threshold: [17] }, // 7th Grade - 25 patterns
    { level: 10, threshold: [19] }, // 8th Grade - 30 patterns
    { level: 11, threshold: [20] }, // 9th Grade - 35 patterns
    { level: 12, threshold: [22] }, // 10th Grade - 40 patterns
    { level: 13, threshold: [24] }, // 11th Grade - 50 patterns
    { level: 14, threshold: [26] }, // 12th Grade - 60 patterns
    { level: 15, threshold: [28] }, // College Freshman - 75 patterns
    { level: 16, threshold: [31] }, // College Sophomore - 90 patterns
    { level: 17, threshold: [34] }, // College Junior - 110 patterns
    { level: 18, threshold: [37] }, // College Senior - 130 patterns
    { level: 19, threshold: [40] }, // Master's - 150 patterns
    { level: 20, threshold: [45] } // Doctorate - 200+ patterns
  ],
  'stroop-test': [
    { level: 1, threshold: [0] }, // Pre-School - any score
    { level: 2, threshold: [25] }, // Kindergarten - 25% correct
    { level: 3, threshold: [35] }, // 1st Grade - 35%
    { level: 4, threshold: [45] }, // 2nd Grade - 45%
    { level: 5, threshold: [55] }, // 3rd Grade - 55%
    { level: 6, threshold: [65] }, // 4th Grade - 65%
    { level: 7, threshold: [72] }, // 5th Grade - 72%
    { level: 8, threshold: [78] }, // 6th Grade - 78%
    { level: 9, threshold: [83] }, // 7th Grade - 83%
    { level: 10, threshold: [87] }, // 8th Grade - 87%
    { level: 11, threshold: [90] }, // 9th Grade - 90%
    { level: 12, threshold: [92] }, // 10th Grade - 92%
    { level: 13, threshold: [94] }, // 11th Grade - 94%
    { level: 14, threshold: [96] }, // 12th Grade - 96%
    { level: 15, threshold: [97] }, // College Freshman - 97%
    { level: 16, threshold: [98] }, // College Sophomore - 98%
    { level: 17, threshold: [99] }, // College Junior - 99%
    { level: 18, threshold: [99.5] }, // College Senior - 99.5%
    { level: 19, threshold: [99.8] }, // Master's - 99.8%
    { level: 20, threshold: [100] } // Doctorate - 100% correct
  ],
  'chimp-test': [
    { level: 1, threshold: [1] }, // Pre-School - level 1
    { level: 2, threshold: [2] }, // Kindergarten - level 2
    { level: 3, threshold: [3] }, // 1st Grade - level 3
    { level: 4, threshold: [4] }, // 2nd Grade - level 4
    { level: 5, threshold: [5] }, // 3rd Grade - level 5
    { level: 6, threshold: [6] }, // 4th Grade - level 6
    { level: 7, threshold: [7] }, // 5th Grade - level 7
    { level: 8, threshold: [8] }, // 6th Grade - level 8
    { level: 9, threshold: [9] }, // 7th Grade - level 9
    { level: 10, threshold: [10] }, // 8th Grade - level 10
    { level: 11, threshold: [11] }, // 9th Grade - level 11
    { level: 12, threshold: [12] }, // 10th Grade - level 12
    { level: 13, threshold: [13] }, // 11th Grade - level 13
    { level: 14, threshold: [14] }, // 12th Grade - level 14
    { level: 15, threshold: [20] }, // College Freshman - level 20
    { level: 16, threshold: [30] }, // College Sophomore - level 30
    { level: 17, threshold: [45] }, // College Junior - level 45
    { level: 18, threshold: [65] }, // College Senior - level 65
    { level: 19, threshold: [90] }, // Master's - level 90
    { level: 20, threshold: [120] } // Doctorate - level 120
  ],
  'maze': [
    { level: 1, threshold: [120000] }, // Pre-School - 120 seconds (2 minutes) or slower (lower is better)
    { level: 2, threshold: [90000] }, // Kindergarten - 90 seconds (1.5 minutes)
    { level: 3, threshold: [70000] }, // 1st Grade - 70 seconds
    { level: 4, threshold: [55000] }, // 2nd Grade - 55 seconds
    { level: 5, threshold: [45000] }, // 3rd Grade - 45 seconds
    { level: 6, threshold: [38000] }, // 4th Grade - 38 seconds
    { level: 7, threshold: [32000] }, // 5th Grade - 32 seconds
    { level: 8, threshold: [28000] }, // 6th Grade - 28 seconds
    { level: 9, threshold: [25000] }, // 7th Grade - 25 seconds
    { level: 10, threshold: [22000] }, // 8th Grade - 22 seconds
    { level: 11, threshold: [20000] }, // 9th Grade - 20 seconds
    { level: 12, threshold: [18000] }, // 10th Grade - 18 seconds
    { level: 13, threshold: [16000] }, // 11th Grade - 16 seconds
    { level: 14, threshold: [15000] }, // 12th Grade - 15 seconds
    { level: 15, threshold: [14000] }, // College Freshman - 14 seconds
    { level: 16, threshold: [13000] }, // College Sophomore - 13 seconds
    { level: 17, threshold: [12000] }, // College Junior - 12 seconds
    { level: 18, threshold: [11000] }, // College Senior - 11 seconds
    { level: 19, threshold: [10000] }, // Master's - 10 seconds
    { level: 20, threshold: [9000] } // Doctorate - 9 seconds or faster
  ],
  'algebra': [
    { level: 1, threshold: [1, 20000] }, // Pre-School - 1 correct, 20s avg (correct_answers, average_time)
    { level: 2, threshold: [2, 18000] }, // Kindergarten - 2 correct, 18s avg
    { level: 3, threshold: [3, 16000] }, // 1st Grade - 3 correct, 16s avg
    { level: 4, threshold: [4, 14000] }, // 2nd Grade - 4 correct, 14s avg
    { level: 5, threshold: [5, 12000] }, // 3rd Grade - 5 correct, 12s avg
    { level: 6, threshold: [6, 10000] }, // 4th Grade - 6 correct, 10s avg
    { level: 7, threshold: [7, 9000] }, // 5th Grade - 7 correct, 9s avg
    { level: 8, threshold: [8, 8000] }, // 6th Grade - 8 correct, 8s avg
    { level: 9, threshold: [9, 7200] }, // 7th Grade - 9 correct, 7.2s avg
    { level: 10, threshold: [10, 6500] }, // 8th Grade - 10 correct, 6.5s avg
    { level: 11, threshold: [11, 5800] }, // 9th Grade - 11 correct, 5.8s avg
    { level: 12, threshold: [12, 5200] }, // 10th Grade - 12 correct, 5.2s avg
    { level: 13, threshold: [13, 4800] }, // 11th Grade - 13 correct, 4.8s avg
    { level: 14, threshold: [14, 4500] }, // 12th Grade - 14 correct, 4.5s avg
    { level: 15, threshold: [15, 4300] }, // College Freshman - 15 correct, 4.3s avg
    { level: 16, threshold: [16, 4150] }, // College Sophomore - 16 correct, 4.15s avg
    { level: 17, threshold: [17, 4075] }, // College Junior - 17 correct, 4.075s avg
    { level: 18, threshold: [18, 4038] }, // College Senior - 18 correct, 4.038s avg
    { level: 19, threshold: [19, 4019] }, // Master's - 19 correct, 4.019s avg
    { level: 20, threshold: [20, 4000] } // Doctorate - 20 correct, 4s avg
  ],
  'arithmetic': [
    { level: 1, threshold: [1, 20000] }, // Pre-School - 1 correct, 20s avg (correct_answers, average_time)
    { level: 2, threshold: [2, 18000] }, // Kindergarten - 2 correct, 18s avg
    { level: 3, threshold: [3, 16000] }, // 1st Grade - 3 correct, 16s avg
    { level: 4, threshold: [4, 14000] }, // 2nd Grade - 4 correct, 14s avg
    { level: 5, threshold: [5, 12000] }, // 3rd Grade - 5 correct, 12s avg
    { level: 6, threshold: [6, 10000] }, // 4th Grade - 6 correct, 10s avg
    { level: 7, threshold: [7, 8500] }, // 5th Grade - 7 correct, 8.5s avg
    { level: 8, threshold: [8, 7000] }, // 6th Grade - 8 correct, 7s avg
    { level: 9, threshold: [9, 6000] }, // 7th Grade - 9 correct, 6s avg
    { level: 10, threshold: [10, 5000] }, // 8th Grade - 10 correct, 5s avg
    { level: 11, threshold: [11, 4500] }, // 9th Grade - 11 correct, 4.5s avg
    { level: 12, threshold: [12, 4000] }, // 10th Grade - 12 correct, 4s avg
    { level: 13, threshold: [13, 3500] }, // 11th Grade - 13 correct, 3.5s avg
    { level: 14, threshold: [14, 3200] }, // 12th Grade - 14 correct, 3.2s avg
    { level: 15, threshold: [15, 3000] }, // College Freshman - 15 correct, 3s avg
    { level: 16, threshold: [16, 2800] }, // College Sophomore - 16 correct, 2.8s avg
    { level: 17, threshold: [17, 2700] }, // College Junior - 17 correct, 2.7s avg
    { level: 18, threshold: [18, 2600] }, // College Senior - 18 correct, 2.6s avg
    { level: 19, threshold: [19, 2550] }, // Master's - 19 correct, 2.55s avg
    { level: 20, threshold: [20, 2500] } // Doctorate - 20 correct, 2.5s avg
  ],
  'linear-algebra': [
    { level: 1, threshold: [1, 20000] }, // Pre-School - 1 correct, 20s avg (correct_answers, average_time)
    { level: 2, threshold: [2, 18000] }, // Kindergarten - 2 correct, 18s avg
    { level: 3, threshold: [3, 16000] }, // 1st Grade - 3 correct, 16s avg
    { level: 4, threshold: [4, 14000] }, // 2nd Grade - 4 correct, 14s avg
    { level: 5, threshold: [5, 12000] }, // 3rd Grade - 5 correct, 12s avg
    { level: 6, threshold: [6, 10000] }, // 4th Grade - 6 correct, 10s avg
    { level: 7, threshold: [7, 8500] }, // 5th Grade - 7 correct, 8.5s avg
    { level: 8, threshold: [8, 7000] }, // 6th Grade - 8 correct, 7s avg
    { level: 9, threshold: [9, 6000] }, // 7th Grade - 9 correct, 6s avg
    { level: 10, threshold: [10, 5000] }, // 8th Grade - 10 correct, 5s avg
    { level: 11, threshold: [11, 4500] }, // 9th Grade - 11 correct, 4.5s avg
    { level: 12, threshold: [12, 4000] }, // 10th Grade - 12 correct, 4s avg
    { level: 13, threshold: [13, 3500] }, // 11th Grade - 13 correct, 3.5s avg
    { level: 14, threshold: [14, 3200] }, // 12th Grade - 14 correct, 3.2s avg
    { level: 15, threshold: [15, 2900] }, // College Freshman - 15 correct, 2.9s avg
    { level: 16, threshold: [16, 2600] }, // College Sophomore - 16 correct, 2.6s avg
    { level: 17, threshold: [17, 2400] }, // College Junior - 17 correct, 2.4s avg
    { level: 18, threshold: [18, 2200] }, // College Senior - 18 correct, 2.2s avg
    { level: 19, threshold: [19, 2100] }, // Master's - 19 correct, 2.1s avg
    { level: 20, threshold: [20, 2000] } // Doctorate - 20 correct, 2s avg
  ],
  'geometry': [
    { level: 1, threshold: [1, 20000] }, // Pre-School - 1 correct, 20s avg (correct_answers, average_time)
    { level: 2, threshold: [2, 18000] }, // Kindergarten - 2 correct, 18s avg
    { level: 3, threshold: [3, 16000] }, // 1st Grade - 3 correct, 16s avg
    { level: 4, threshold: [4, 14000] }, // 2nd Grade - 4 correct, 14s avg
    { level: 5, threshold: [5, 12000] }, // 3rd Grade - 5 correct, 12s avg
    { level: 6, threshold: [6, 10000] }, // 4th Grade - 6 correct, 10s avg
    { level: 7, threshold: [7, 8500] }, // 5th Grade - 7 correct, 8.5s avg
    { level: 8, threshold: [8, 7000] }, // 6th Grade - 8 correct, 7s avg
    { level: 9, threshold: [9, 6000] }, // 7th Grade - 9 correct, 6s avg
    { level: 10, threshold: [10, 5000] }, // 8th Grade - 10 correct, 5s avg
    { level: 11, threshold: [11, 4500] }, // 9th Grade - 11 correct, 4.5s avg
    { level: 12, threshold: [12, 4000] }, // 10th Grade - 12 correct, 4s avg
    { level: 13, threshold: [13, 3500] }, // 11th Grade - 13 correct, 3.5s avg
    { level: 14, threshold: [14, 3200] }, // 12th Grade - 14 correct, 3.2s avg
    { level: 15, threshold: [15, 2900] }, // College Freshman - 15 correct, 2.9s avg
    { level: 16, threshold: [16, 2600] }, // College Sophomore - 16 correct, 2.6s avg
    { level: 17, threshold: [17, 2400] }, // College Junior - 17 correct, 2.4s avg
    { level: 18, threshold: [18, 2200] }, // College Senior - 18 correct, 2.2s avg
    { level: 19, threshold: [19, 2100] }, // Master's - 19 correct, 2.1s avg
    { level: 20, threshold: [20, 2000] } // Doctorate - 20 correct, 2s avg
  ],
  'word-search': [
    { level: 1, threshold: [10] }, // Pre-School - 10 characters
    { level: 2, threshold: [15] }, // Kindergarten - 15 characters
    { level: 3, threshold: [20] }, // 1st Grade - 20 characters
    { level: 4, threshold: [25] }, // 2nd Grade - 25 characters
    { level: 5, threshold: [30] }, // 3rd Grade - 30 characters
    { level: 6, threshold: [40] }, // 4th Grade - 40 characters
    { level: 7, threshold: [50] }, // 5th Grade - 50 characters
    { level: 8, threshold: [60] }, // 6th Grade - 60 characters
    { level: 9, threshold: [70] }, // 7th Grade - 70 characters
    { level: 10, threshold: [80] }, // 8th Grade - 80 characters
    { level: 11, threshold: [90] }, // 9th Grade - 90 characters
    { level: 12, threshold: [100] }, // 10th Grade - 100 characters
    { level: 13, threshold: [110] }, // 11th Grade - 110 characters
    { level: 14, threshold: [120] }, // 12th Grade - 120 characters
    { level: 15, threshold: [130] }, // College Freshman - 130 characters
    { level: 16, threshold: [140] }, // College Sophomore - 140 characters
    { level: 17, threshold: [150] }, // College Junior - 150 characters
    { level: 18, threshold: [160] }, // College Senior - 160 characters
    { level: 19, threshold: [170] }, // Master's - 170 characters
    { level: 20, threshold: [180] } // Doctorate - 180+ characters
  ],
  'time-estimation': [
    { level: 1, threshold: [5000] }, // Pre-School - 5000ms error or more (lower is better)
    { level: 2, threshold: [4000] }, // Kindergarten - 4000ms error
    { level: 3, threshold: [3500] }, // 1st Grade - 3500ms error
    { level: 4, threshold: [3000] }, // 2nd Grade - 3000ms error
    { level: 5, threshold: [2500] }, // 3rd Grade - 2500ms error
    { level: 6, threshold: [2000] }, // 4th Grade - 2000ms error
    { level: 7, threshold: [1700] }, // 5th Grade - 1700ms error
    { level: 8, threshold: [1500] }, // 6th Grade - 1500ms error
    { level: 9, threshold: [1300] }, // 7th Grade - 1300ms error
    { level: 10, threshold: [1100] }, // 8th Grade - 1100ms error
    { level: 11, threshold: [950] }, // 9th Grade - 950ms error
    { level: 12, threshold: [800] }, // 10th Grade - 800ms error
    { level: 13, threshold: [700] }, // 11th Grade - 700ms error
    { level: 14, threshold: [600] }, // 12th Grade - 600ms error
    { level: 15, threshold: [500] }, // College Freshman - 500ms error
    { level: 16, threshold: [450] }, // College Sophomore - 450ms error
    { level: 17, threshold: [400] }, // College Junior - 400ms error
    { level: 18, threshold: [350] }, // College Senior - 350ms error
    { level: 19, threshold: [300] }, // Master's - 300ms error
    { level: 20, threshold: [250] } // Doctorate - 250ms error or less
  ]
}

// Extract score value from game score object based on game type
function extractScoreValue(gameId: string, score: any): number {
  if (!score) return 0

  switch (gameId) {
    case 'aim-trainer':
      // For aim-trainer, we use the score object directly in meetsThreshold
      // Return accuracy as the primary value for backward compatibility
      return score.accuracy || 0
    case 'typing-test':
      return score.wpm || 0
    case 'reaction-time':
      // Lower is better, so we invert the logic
      return score.fastest_time || 1000
    case 'memory':
    case 'visual-memory':
    case 'sequence-memory':
      return score.level_reached || 0
    case 'chimp-test':
      return score.patterns_remembered || 0
    case 'number-memory':
      return score.longest_sequence || 0
    case 'pattern-recognition':
      return score.patterns_solved || 0
    case 'stroop-test':
      // Return correct answers count
      return score.correct_answers || 0
    case 'maze':
      // For maze, lower is better, so we return time_taken
      return score.time_taken || 60000
    case 'algebra':
    case 'arithmetic':
    case 'linear-algebra':
    case 'geometry':
      // For algebra, arithmetic, linear-algebra, and geometry, we use the score object directly in meetsThreshold
      // Return correct_answers as the primary value for backward compatibility
      return score.correct_answers || 0
    case 'word-search':
      return score.characters_found || 0
    case 'time-estimation':
      // For time-estimation, lower is better (best_accuracy)
      return score.best_accuracy || 5000
    default:
      return 0
  }
}

// Check if score meets threshold (handles both higher-is-better and lower-is-better)
// Threshold is always an array: [value] for single metric, [accuracy, reaction_time] for multiple metrics
function meetsThreshold(gameId: string, score: any, threshold: number[]): boolean {
  // Handle aim-trainer with [accuracy, reaction_time]
  if (gameId === 'aim-trainer' && threshold.length >= 2) {
    const accuracy = score?.accuracy || 0
    const reactionTime = score?.reaction_time || 1000
    // Must meet both: accuracy >= threshold[0] AND reaction_time <= threshold[1]
    return accuracy >= threshold[0] && reactionTime <= threshold[1]
  }
  
  // Handle algebra, arithmetic, linear-algebra, and geometry with [correct_answers, average_time]
  if ((gameId === 'algebra' || gameId === 'arithmetic' || gameId === 'linear-algebra' || gameId === 'geometry') && threshold.length >= 2) {
    const correctAnswers = score?.correct_answers || 0
    const averageTime = score?.average_time || 10000
    // Must meet both: correct_answers >= threshold[0] AND average_time <= threshold[1]
    return correctAnswers >= threshold[0] && averageTime <= threshold[1]
  }
  
  // Handle single metric games (threshold[0] is the value)
  const scoreValue = extractScoreValue(gameId, score)
  
  // For reaction-time, maze, and time-estimation, lower is better (score must be <= threshold[0] to qualify)
  if (gameId === 'reaction-time' || gameId === 'maze' || gameId === 'time-estimation') {
    return scoreValue <= threshold[0]
  }
  // For all others, higher is better (score must be >= threshold[0] to qualify)
  return scoreValue >= threshold[0]
}

// Calculate level for a specific game
export function calculateGameLevel(gameId: string, score: any): GameLevelInfo {
  const thresholds = GAME_THRESHOLDS[gameId] || []
  
  // Helper to extract threshold value for display
  const getThresholdValue = (threshold: number[]): number | null => {
    return threshold[0] // Return first value for display
  }
  
  // If no score exists, return level 1 (not calculated from default values)
  if (!score) {
    const firstThreshold = thresholds.length > 0 ? thresholds[0]?.threshold : null
    return {
      currentLevel: 1,
      educationLevel: EDUCATION_LEVELS[1],
      nextLevelThreshold: firstThreshold ? getThresholdValue(firstThreshold) : null,
      progress: 0
    }
  }
  
  const scoreValue = extractScoreValue(gameId, score)

  // Handle invalid or negative scores
  if (scoreValue < 0) {
    const firstThreshold = thresholds.length > 0 ? thresholds[0]?.threshold : null
    return {
      currentLevel: 1,
      educationLevel: EDUCATION_LEVELS[1],
      nextLevelThreshold: firstThreshold ? getThresholdValue(firstThreshold) : null,
      progress: 0
    }
  }

  if (thresholds.length === 0) {
    return {
      currentLevel: 1,
      educationLevel: EDUCATION_LEVELS[1],
      nextLevelThreshold: null,
      progress: 0
    }
  }

  // Find the highest level the user has achieved
  // For reaction-time: lower is better, so we check from highest level (lowest threshold) down
  // For others: higher is better, so we check from highest level (highest threshold) down
  let currentLevel = 1
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (meetsThreshold(gameId, score, thresholds[i].threshold)) {
      currentLevel = thresholds[i].level
      break
    }
  }
  
  // Ensure we never return a level higher than what the score actually qualifies for
  // This is a safety check to prevent edge cases
  if (currentLevel < 1) {
    currentLevel = 1
  }

  // Find next level threshold
  const nextThresholdIndex = thresholds.findIndex(t => t.level > currentLevel)
  const nextThreshold = nextThresholdIndex >= 0 ? thresholds[nextThresholdIndex] : null

  // Calculate progress to next level
  let progress = 0
  if (nextThreshold) {
    const currentThreshold = thresholds.find(t => t.level === currentLevel)
    if (currentThreshold) {
      // Handle aim-trainer with multiple metrics
      if (gameId === 'aim-trainer' && currentThreshold.threshold.length >= 2 && nextThreshold.threshold.length >= 2) {
        const accuracy = score?.accuracy || 0
        const reactionTime = score?.reaction_time || 1000
        
        // Calculate progress for accuracy (higher is better)
        const accuracyRange = nextThreshold.threshold[0] - currentThreshold.threshold[0]
        const accuracyProgress = accuracyRange > 0 
          ? Math.min(100, Math.max(0, ((accuracy - currentThreshold.threshold[0]) / accuracyRange) * 100))
          : 0
        
        // Calculate progress for reaction time (lower is better)
        const reactionRange = currentThreshold.threshold[1] - nextThreshold.threshold[1]
        const reactionProgress = reactionRange > 0
          ? Math.min(100, Math.max(0, ((currentThreshold.threshold[1] - reactionTime) / reactionRange) * 100))
          : 0
        
        // Average the two progress values
        progress = (accuracyProgress + reactionProgress) / 2
      } else if ((gameId === 'algebra' || gameId === 'arithmetic' || gameId === 'linear-algebra' || gameId === 'geometry') && currentThreshold.threshold.length >= 2 && nextThreshold.threshold.length >= 2) {
        // Handle algebra, arithmetic, linear-algebra, and geometry with multiple metrics [correct_answers, average_time]
        const correctAnswers = score?.correct_answers || 0
        const averageTime = score?.average_time || 10000
        
        // Calculate progress for correct answers (higher is better)
        const answersRange = nextThreshold.threshold[0] - currentThreshold.threshold[0]
        const answersProgress = answersRange > 0 
          ? Math.min(100, Math.max(0, ((correctAnswers - currentThreshold.threshold[0]) / answersRange) * 100))
          : 0
        
        // Calculate progress for average time (lower is better)
        const timeRange = currentThreshold.threshold[1] - nextThreshold.threshold[1]
        const timeProgress = timeRange > 0
          ? Math.min(100, Math.max(0, ((currentThreshold.threshold[1] - averageTime) / timeRange) * 100))
          : 0
        
        // Average the two progress values
        progress = (answersProgress + timeProgress) / 2
      } else if (gameId === 'reaction-time' || gameId === 'maze' || gameId === 'time-estimation') {
        // For reaction-time, maze, and time-estimation: lower is better, so progress is inverted
        // Example: current=260ms, next=250ms, score=258ms
        // Range = 260 - 250 = 10ms (how much faster you need to be)
        // Progress = (260 - 258) / 10 = 2/10 = 20% (how close you are to next level)
        const range = currentThreshold.threshold[0] - nextThreshold.threshold[0]
        const progressValue = currentThreshold.threshold[0] - scoreValue
        if (range > 0) {
          progress = Math.min(100, Math.max(0, (progressValue / range) * 100))
        }
      } else {
        // For other games: higher is better
        const range = nextThreshold.threshold[0] - currentThreshold.threshold[0]
        const progressValue = scoreValue - currentThreshold.threshold[0]
        if (range > 0) {
          progress = Math.min(100, Math.max(0, (progressValue / range) * 100))
        }
      }
    }
  } else {
    // Max level achieved
    progress = 100
  }

  // Format nextLevelThreshold for return
  // For aim-trainer, return the full array to show reaction time
  // For other games, return the appropriate value
  let nextLevelThresholdValue: number | number[] | null = null
  if (nextThreshold) {
    if (gameId === 'aim-trainer' && nextThreshold.threshold.length >= 2) {
      // Return full array for aim-trainer so we can show reaction time
      nextLevelThresholdValue = nextThreshold.threshold
    } else {
      // For other games, return first value (or the value itself if it's a single number)
      nextLevelThresholdValue = nextThreshold.threshold[0]
    }
  }

  return {
    currentLevel,
    educationLevel: EDUCATION_LEVELS[currentLevel] || 'Unknown',
    nextLevelThreshold: nextLevelThresholdValue,
    progress
  }
}

// Calculate category level (minimum level across all games in category)
export function calculateCategoryLevel(
  category: GameCategory,
  games: Array<{ id: string; name: string }>,
  gameStats: Array<{ id: string; userBest: { score?: any } | null }>
): CategoryLevelInfo {
  const categoryGames = games.filter(g => {
    // We'll need to get category from game data
    return true // Placeholder - will be filtered by caller
  })

  const gameLevels = categoryGames.map(game => {
    const gameStat = gameStats.find(gs => gs.id === game.id)
    const levelInfo = calculateGameLevel(game.id, gameStat?.userBest?.score || null)
    return {
      gameId: game.id,
      gameName: game.name,
      levelInfo
    }
  })

  // Category level is the minimum level across all games
  const levels = gameLevels.map(g => g.levelInfo.currentLevel)
  const categoryLevel = levels.length > 0 ? Math.min(...levels) : 1

  return {
    category,
    level: categoryLevel,
    educationLevel: EDUCATION_LEVELS[categoryLevel] || 'Unknown',
    games: gameLevels
  }
}

// Get threshold for a specific game and level
export function getGameThreshold(gameId: string, level: number): number[] | null {
  const thresholds = GAME_THRESHOLDS[gameId] || []
  const threshold = thresholds.find(t => t.level === level)
  return threshold ? threshold.threshold : null
}

// Format threshold for display
export function formatThreshold(gameId: string, threshold: number | number[]): string {
  switch (gameId) {
    case 'aim-trainer':
      // For aim-trainer, threshold is [accuracy, reaction_time] - show reaction time
      if (Array.isArray(threshold) && threshold.length >= 2) {
        return `${formatNumber(threshold[1])}ms or faster`
      }
      const aimThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(aimThreshold)}% accuracy`
    case 'stroop-test':
      const stroopThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(stroopThreshold)}% accuracy`
    case 'typing-test':
      const typingThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(typingThreshold)} WPM`
    case 'reaction-time':
      const reactionThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(reactionThreshold)}ms or faster`
    case 'memory':
      // For memory, threshold represents correct sequences needed
      const memoryThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(memoryThreshold)} correct sequences`
    case 'visual-memory':
      const visualThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `Level ${formatNumber(visualThreshold)}`
    case 'sequence-memory':
      // For sequence-memory, threshold represents longest sequence needed
      const seqThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(seqThreshold)} sequence length`
    case 'chimp-test':
      const chimpThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(chimpThreshold)} correct`
    case 'number-memory':
      const numThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(numThreshold)} digits`
    case 'pattern-recognition':
      const patternThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(patternThreshold)} patterns`
    case 'maze':
      const mazeThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      const seconds = Math.floor(mazeThreshold / 1000)
      const milliseconds = Math.floor((mazeThreshold % 1000) / 100)
      return `${formatNumber(seconds)}.${milliseconds}s or faster`
    case 'algebra':
    case 'arithmetic':
    case 'linear-algebra':
    case 'geometry':
      // For algebra, arithmetic, linear-algebra, and geometry, threshold is [correct_answers, average_time]
      if (Array.isArray(threshold) && threshold.length >= 2) {
        const timeMs = threshold[1]
        return `${formatNumber(threshold[0])} correct, ${formatNumber(timeMs)}ms avg or faster`
      }
      const mathThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(mathThreshold)}`
    case 'word-search':
      const wordThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(wordThreshold)} characters`
    case 'time-estimation':
      const timeThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(timeThreshold)}ms error or less`
    default:
      const defaultThreshold = Array.isArray(threshold) ? threshold[0] : threshold
      return `${formatNumber(defaultThreshold)}`
  }
}

// Format user's score for display
export function formatUserScore(gameId: string, score: any): string {
  if (!score) return 'No score'
  
  switch (gameId) {
    case 'aim-trainer':
      return `${formatNumber(score.accuracy || 0)}% accuracy`
    case 'typing-test':
      return `${formatNumber(score.wpm || 0)} WPM`
    case 'reaction-time':
      return `${formatNumber(score.fastest_time || 0)}ms`
    case 'memory':
      return `${formatNumber(score.total_sequences || 0)} sequences (${formatNumber(score.correct_sequences || 0)} correct)`
    case 'visual-memory':
    case 'sequence-memory':
      return `Level ${formatNumber(score.level_reached || 0)}`
    case 'chimp-test':
      return `${formatNumber(score.patterns_remembered || 0)} correct`
    case 'number-memory':
      return `${formatNumber(score.longest_sequence || 0)} digits`
    case 'pattern-recognition':
      return `${formatNumber(score.patterns_solved || 0)} patterns`
    case 'stroop-test':
      return `${formatNumber(score.correct_answers || 0)} correct (${formatNumber(score.average_time || 0)}ms)`
    case 'time-estimation':
      return `${formatNumber(score.average_accuracy || 0)}ms avg (${formatNumber(score.best_accuracy || 0)}ms best)`
    case 'maze':
      const seconds = Math.floor((score.time_taken || 0) / 1000)
      const milliseconds = Math.floor(((score.time_taken || 0) % 1000) / 100)
      return `${formatNumber(seconds)}.${milliseconds}s`
    case 'algebra':
    case 'arithmetic':
    case 'linear-algebra':
    case 'geometry':
      const correctAnswers = score.correct_answers || 0
      const avgTime = score.average_time || 0
      return `${formatNumber(correctAnswers)} correct (${formatNumber(avgTime)}ms avg)`
    case 'word-search':
      return `${formatNumber(score.characters_found || 0)} characters`
    default:
      return 'No score'
  }
}

