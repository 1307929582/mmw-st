/**
 * Test utilities for property-based testing
 */

import * as fc from 'fast-check';

// ============================================
// Arbitrary Generators for Domain Types
// ============================================

/**
 * Generate a valid character name
 */
export const arbCharacterName = fc.string({ minLength: 1, maxLength: 100 }).filter(
  (s) => s.trim().length > 0
);

/**
 * Generate a valid character description
 */
export const arbDescription = fc.string({ minLength: 0, maxLength: 5000 });

/**
 * Generate a valid API key
 */
export const arbApiKey = fc.string({ minLength: 10, maxLength: 200 }).filter(
  (s) => /^[a-zA-Z0-9_-]+$/.test(s)
);

/**
 * Generate a valid UUID
 */
export const arbUuid = fc.uuid();

/**
 * Generate a valid timestamp
 */
export const arbTimestamp = fc.integer({ min: 0, max: Date.now() + 1000000000 });

/**
 * Generate a valid message role
 */
export const arbMessageRole = fc.constantFrom('user', 'assistant', 'system') as fc.Arbitrary<
  'user' | 'assistant' | 'system'
>;

/**
 * Generate a valid message content
 */
export const arbMessageContent = fc.string({ minLength: 1, maxLength: 10000 });

/**
 * Generate a valid chat message
 */
export const arbChatMessage = fc.record({
  id: arbUuid,
  role: arbMessageRole,
  content: arbMessageContent,
  timestamp: arbTimestamp,
});

/**
 * Generate a valid character data object
 */
export const arbCharacterData = fc.record({
  name: arbCharacterName,
  description: arbDescription,
  personality: arbDescription,
  scenario: arbDescription,
  first_mes: arbMessageContent,
  mes_example: fc.string({ maxLength: 5000 }),
  creator_notes: fc.option(arbDescription, { nil: undefined }),
  system_prompt: fc.option(arbDescription, { nil: undefined }),
  tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }), {
    nil: undefined,
  }),
  creator: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

/**
 * Generate a valid world info entry
 */
export const arbWorldInfoEntry = fc.record({
  id: arbUuid,
  keys: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
  content: arbDescription,
  enabled: fc.boolean(),
  order: fc.integer({ min: 0, max: 1000 }),
});

// ============================================
// Test Configuration
// ============================================

/**
 * Default number of test iterations for property tests
 */
export const DEFAULT_NUM_RUNS = 100;

/**
 * Configure fast-check with default settings
 */
export const fcConfig: fc.Parameters<unknown> = {
  numRuns: DEFAULT_NUM_RUNS,
  verbose: false,
  endOnFailure: true,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Deep equality check for objects
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Check if two objects are equivalent (ignoring undefined values)
 */
export function isEquivalent(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const cleanA = JSON.parse(JSON.stringify(a));
  const cleanB = JSON.parse(JSON.stringify(b));
  return deepEqual(cleanA, cleanB);
}
