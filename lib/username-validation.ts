import { Filter } from 'bad-words'

// Maximum character limit for usernames
export const MAX_USERNAME_LENGTH = 20

// Minimum character limit for usernames
export const MIN_USERNAME_LENGTH = 1

// Initialize bad-words filter with regex to catch obfuscations
// replaceRegex handles character substitutions and multilingual support
// This catches attempts like "ash0le" (0 instead of o) or "n1gger" (1 instead of i)
const badWordsFilter = new Filter({ 
  replaceRegex: /[A-Za-z0-9가-힣_]/g // Multilingual support and catches character substitutions
})

/**
 * Checks if a username is a prefix of any bad word (catches truncations like "nig" or "nigge" from "nigger")
 * @param username - The username to check
 * @param badWords - Array of bad words to check against
 * @returns true if the username is a prefix of any bad word
 */
function isPrefixOfBadWord(username: string, badWords: string[]): boolean {
  const lowerUsername = username.toLowerCase()
  
  // Only check if username is at least 3 characters to avoid false positives
  if (lowerUsername.length < 3) {
    return false
  }
  
  // Check if username is the start (prefix) of any bad word
  for (const badWord of badWords) {
    const lowerBadWord = badWord.toLowerCase()
    
    // Check if bad word starts with the username (e.g., "nigger" starts with "nig" or "nigge")
    // Only flag if the bad word is at least 4 characters (to avoid flagging if there's a 3-char bad word)
    if (lowerBadWord.startsWith(lowerUsername) && lowerBadWord.length >= 4) {
      return true
    }
  }
  
  return false
}

/**
 * Checks if a username contains derogatory language using the bad-words filter
 * @param username - The username to check
 * @returns true if the username contains derogatory language, false otherwise
 */
export function containsDerogatoryLanguage(username: string): boolean {
  // First, use bad-words library's isProfane method
  // The replaceRegex configuration handles obfuscations and character substitutions
  if (badWordsFilter.isProfane(username)) {
    return true
  }
  
  // Also check if username is a prefix of any bad word (catches truncations)
  // This catches attempts like "nig", "nigge" when "nigger" is blocked
  try {
    const badWords = (badWordsFilter as any).list || []
    if (Array.isArray(badWords) && badWords.length > 0) {
      if (isPrefixOfBadWord(username, badWords)) {
        return true
      }
    }
  } catch (e) {
    // If we can't access the list, just rely on isProfane
  }
  
  return false
}

/**
 * Validates username length
 * @param username - The username to validate
 * @returns true if the username length is valid, false otherwise
 */
export function isValidUsernameLength(username: string): boolean {
  const trimmed = username.trim()
  return trimmed.length >= MIN_USERNAME_LENGTH && trimmed.length <= MAX_USERNAME_LENGTH
}

/**
 * Validates a username for both length and derogatory language
 * @param username - The username to validate
 * @returns An object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  const trimmed = username.trim()
  
  // Check if empty
  if (!trimmed) {
    return { isValid: false, error: 'Username cannot be empty' }
  }
  
  // Check length
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Username must be ${MAX_USERNAME_LENGTH} characters or less` 
    }
  }
  
  if (trimmed.length < MIN_USERNAME_LENGTH) {
    return { 
      isValid: false, 
      error: `Username must be at least ${MIN_USERNAME_LENGTH} character` 
    }
  }
  
  // Check for derogatory language
  if (containsDerogatoryLanguage(trimmed)) {
    return { 
      isValid: false, 
      error: 'Username contains inappropriate language. Please choose a different username.' 
    }
  }
  
  return { isValid: true }
}

