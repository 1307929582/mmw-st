/**
 * Property-based tests for world info matching
 *
 * **Feature: mobile-app, Property 15: World Info Keyword Matching**
 * **Feature: mobile-app, Property 16: World Info Regex Matching**
 * **Validates: Requirements 8.3, 8.4**
 */

import * as fc from 'fast-check';
import { fcConfig } from './test-utils';
import { matchesEntry, scanForMatches, isValidRegex } from '../core/worldinfo/matcher';
import type { WorldInfoEntry } from '@/types';

describe('World Info Keyword Matching', () => {
  /**
   * Property 15: World Info Keyword Matching
   * For any text containing a world info keyword, the matcher
   * SHALL return entries that contain that keyword.
   */

  const arbKeyword = fc.string({ minLength: 3, maxLength: 20 }).filter(
    (s) => s.trim().length >= 3 && /^[a-zA-Z0-9]+$/.test(s)
  );

  it('text containing keyword matches entry with that keyword', () => {
    fc.assert(
      fc.property(
        arbKeyword,
        fc.string({ maxLength: 100 }),
        fc.string({ maxLength: 100 }),
        (keyword, prefix, suffix) => {
          const text = `${prefix} ${keyword} ${suffix}`;

          const entry: WorldInfoEntry = {
            id: 'test',
            keys: [keyword],
            content: 'Test content',
            enabled: true,
            order: 0,
          };

          expect(matchesEntry(text, entry)).toBe(true);
        }
      ),
      fcConfig
    );
  });

  it('text not containing keyword does not match', () => {
    fc.assert(
      fc.property(
        arbKeyword,
        fc.string({ minLength: 10, maxLength: 100 }).filter((s) => !s.includes('UNIQUE_KEYWORD')),
        (keyword, text) => {
          // Use a keyword that definitely won't be in the text
          const uniqueKeyword = 'UNIQUE_KEYWORD_' + keyword;

          const entry: WorldInfoEntry = {
            id: 'test',
            keys: [uniqueKeyword],
            content: 'Test content',
            enabled: true,
            order: 0,
          };

          expect(matchesEntry(text, entry)).toBe(false);
        }
      ),
      fcConfig
    );
  });

  it('disabled entries never match', () => {
    fc.assert(
      fc.property(arbKeyword, (keyword) => {
        const text = `This text contains ${keyword} for sure`;

        const entry: WorldInfoEntry = {
          id: 'test',
          keys: [keyword],
          content: 'Test content',
          enabled: false, // Disabled
          order: 0,
        };

        expect(matchesEntry(text, entry)).toBe(false);
      }),
      fcConfig
    );
  });

  it('constant entries always match', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (text) => {
          const entry: WorldInfoEntry = {
            id: 'test',
            keys: ['nonexistent_keyword_xyz'],
            content: 'Test content',
            enabled: true,
            constant: true, // Always matches
            order: 0,
          };

          expect(matchesEntry(text, entry)).toBe(true);
        }
      ),
      fcConfig
    );
  });

  it('case insensitive matching works', () => {
    fc.assert(
      fc.property(arbKeyword, (keyword) => {
        const upperKeyword = keyword.toUpperCase();
        const lowerKeyword = keyword.toLowerCase();
        const text = `Text with ${upperKeyword} in it`;

        const entry: WorldInfoEntry = {
          id: 'test',
          keys: [lowerKeyword],
          content: 'Test content',
          enabled: true,
          caseSensitive: false,
          order: 0,
        };

        expect(matchesEntry(text, entry)).toBe(true);
      }),
      fcConfig
    );
  });

  it('case sensitive matching respects case', () => {
    fc.assert(
      fc.property(arbKeyword, (keyword) => {
        const upperKeyword = keyword.toUpperCase();
        const lowerKeyword = keyword.toLowerCase();

        // Skip if upper and lower are the same (e.g., numbers)
        if (upperKeyword === lowerKeyword) return;

        const text = `Text with ${upperKeyword} in it`;

        const entry: WorldInfoEntry = {
          id: 'test',
          keys: [lowerKeyword],
          content: 'Test content',
          enabled: true,
          caseSensitive: true,
          order: 0,
        };

        expect(matchesEntry(text, entry)).toBe(false);
      }),
      fcConfig
    );
  });

  it('whole word matching only matches complete words', () => {
    const entry: WorldInfoEntry = {
      id: 'test',
      keys: ['cat'],
      content: 'Test content',
      enabled: true,
      matchWholeWords: true,
      order: 0,
    };

    // Should match
    expect(matchesEntry('I have a cat', entry)).toBe(true);
    expect(matchesEntry('cat is here', entry)).toBe(true);
    expect(matchesEntry('the cat.', entry)).toBe(true);

    // Should not match (part of another word)
    expect(matchesEntry('I have a category', entry)).toBe(false);
    expect(matchesEntry('concatenate', entry)).toBe(false);
  });

  it('multiple keywords - any match triggers', () => {
    fc.assert(
      fc.property(
        arbKeyword,
        arbKeyword,
        fc.string({ maxLength: 50 }),
        (keyword1, keyword2, otherText) => {
          // Text contains only keyword1
          const text = `${otherText} ${keyword1} more text`;

          const entry: WorldInfoEntry = {
            id: 'test',
            keys: [keyword1, keyword2],
            content: 'Test content',
            enabled: true,
            order: 0,
          };

          expect(matchesEntry(text, entry)).toBe(true);
        }
      ),
      fcConfig
    );
  });
});

describe('World Info Regex Matching', () => {
  /**
   * Property 16: World Info Regex Matching
   * For any text and regex pattern, the matcher SHALL correctly
   * identify matches according to regex semantics.
   */

  it('valid regex patterns match correctly', () => {
    const entry: WorldInfoEntry = {
      id: 'test',
      keys: ['\\d+'], // Match any number
      content: 'Test content',
      enabled: true,
      useRegex: true,
      order: 0,
    };

    expect(matchesEntry('There are 42 items', entry)).toBe(true);
    expect(matchesEntry('No numbers here', entry)).toBe(false);
  });

  it('word boundary regex works', () => {
    const entry: WorldInfoEntry = {
      id: 'test',
      keys: ['\\bcat\\b'],
      content: 'Test content',
      enabled: true,
      useRegex: true,
      order: 0,
    };

    expect(matchesEntry('I have a cat', entry)).toBe(true);
    expect(matchesEntry('category', entry)).toBe(false);
  });

  it('invalid regex falls back to literal match', () => {
    const entry: WorldInfoEntry = {
      id: 'test',
      keys: ['[invalid(regex'],
      content: 'Test content',
      enabled: true,
      useRegex: true,
      order: 0,
    };

    // Should fall back to literal match
    expect(matchesEntry('text with [invalid(regex in it', entry)).toBe(true);
    expect(matchesEntry('other text', entry)).toBe(false);
  });

  it('isValidRegex correctly identifies valid patterns', () => {
    expect(isValidRegex('\\d+')).toBe(true);
    expect(isValidRegex('\\bword\\b')).toBe(true);
    expect(isValidRegex('[a-z]+')).toBe(true);
    expect(isValidRegex('[invalid(')).toBe(false);
    expect(isValidRegex('*invalid')).toBe(false);
  });
});

describe('World Info Scanning', () => {
  it('scanForMatches returns all matching entries', () => {
    const entries: WorldInfoEntry[] = [
      { id: '1', keys: ['apple'], content: 'Apple info', enabled: true, order: 0 },
      { id: '2', keys: ['banana'], content: 'Banana info', enabled: true, order: 1 },
      { id: '3', keys: ['cherry'], content: 'Cherry info', enabled: true, order: 2 },
    ];

    const text = 'I like apple and banana';
    const matches = scanForMatches(text, entries);

    expect(matches).toHaveLength(2);
    expect(matches.map((m) => m.id)).toContain('1');
    expect(matches.map((m) => m.id)).toContain('2');
    expect(matches.map((m) => m.id)).not.toContain('3');
  });

  it('scanForMatches respects order', () => {
    const entries: WorldInfoEntry[] = [
      { id: '1', keys: ['word'], content: 'First', enabled: true, order: 2 },
      { id: '2', keys: ['word'], content: 'Second', enabled: true, order: 0 },
      { id: '3', keys: ['word'], content: 'Third', enabled: true, order: 1 },
    ];

    const text = 'This has the word in it';
    const matches = scanForMatches(text, entries);

    expect(matches).toHaveLength(3);
    // Should be sorted by order
    expect(matches[0].id).toBe('2'); // order 0
    expect(matches[1].id).toBe('3'); // order 1
    expect(matches[2].id).toBe('1'); // order 2
  });

  it('scanForMatches respects priority over order', () => {
    const entries: WorldInfoEntry[] = [
      { id: '1', keys: ['word'], content: 'Low priority', enabled: true, order: 0, priority: 1 },
      { id: '2', keys: ['word'], content: 'High priority', enabled: true, order: 1, priority: 10 },
    ];

    const text = 'This has the word in it';
    const matches = scanForMatches(text, entries);

    expect(matches).toHaveLength(2);
    // Higher priority first
    expect(matches[0].id).toBe('2');
    expect(matches[1].id).toBe('1');
  });
});
