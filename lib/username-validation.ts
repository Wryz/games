import { Filter } from 'bad-words'
import { Profanity } from '@2toad/profanity'
import { FamilyFriendly } from 'family-friendly'

// Maximum character limit for usernames
export const MAX_USERNAME_LENGTH = 20

// Minimum character limit for usernames
export const MIN_USERNAME_LENGTH = 1

// Initialize multiple profanity filters for comprehensive coverage
// Using three different libraries to ensure maximum detection
const badWordsFilter = new Filter()
const profanityFilter = new Profanity()
const familyFriendlyFilter = new FamilyFriendly({ allLanguages: true })

/**
 * Checks if a username contains derogatory language using multiple filters
 * @param username - The username to check
 * @returns true if the username contains derogatory language, false otherwise
 */
export function containsDerogatoryLanguage(username: string): boolean {
  // Check with bad-words library
  if (badWordsFilter.isProfane(username)) {
    return true
  }
  
  // Check with @2toad/profanity library
  if (profanityFilter.exists(username)) {
    return true
  }
  
  // Check with family-friendly library (handles obfuscations and substitutions)
  if (familyFriendlyFilter.containsBadWord(username)) {
    return true
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

