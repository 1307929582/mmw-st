/**
 * World Info Matcher
 *
 * Handles keyword matching for world info entries.
 */

import type { WorldInfoEntry } from '@/types';

/**
 * Check if a single entry matches the given text
 */
export function matchesEntry(text: string, entry: WorldInfoEntry): boolean {
  if (!entry.enabled) {
    return false;
  }

  // Constant entries always match
  if (entry.constant) {
    return true;
  }

  // Check primary keys
  const primaryMatch = entry.keys.some((key) =>
    matchesKeyword(text, key, entry)
  );

  if (!primaryMatch) {
    return false;
  }

  // If selective and has secondary keys, check them too
  if (entry.selective && entry.secondaryKeys && entry.secondaryKeys.length > 0) {
    const secondaryMatch = entry.secondaryKeys.some((key) =>
      matchesKeyword(text, key, entry)
    );
    return secondaryMatch;
  }

  return true;
}

/**
 * Check if a keyword matches in the text
 */
function matchesKeyword(
  text: string,
  keyword: string,
  entry: WorldInfoEntry
): boolean {
  if (!keyword || keyword.trim().length === 0) {
    return false;
  }

  const searchText = entry.caseSensitive ? text : text.toLowerCase();
  const searchKey = entry.caseSensitive ? keyword : keyword.toLowerCase();

  if (entry.useRegex) {
    try {
      const flags = entry.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(keyword, flags);
      return regex.test(text);
    } catch {
      // Invalid regex, fall back to literal match
      return searchText.includes(searchKey);
    }
  }

  if (entry.matchWholeWords) {
    // Use word boundary matching
    const escapedKey = escapeRegex(searchKey);
    const flags = entry.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`\\b${escapedKey}\\b`, flags);
    return regex.test(text);
  }

  // Simple substring match
  return searchText.includes(searchKey);
}

/**
 * Scan text and return all matching entries
 */
export function scanForMatches(
  text: string,
  entries: WorldInfoEntry[]
): WorldInfoEntry[] {
  const matches: WorldInfoEntry[] = [];

  for (const entry of entries) {
    if (matchesEntry(text, entry)) {
      matches.push(entry);
    }
  }

  // Sort by order/priority
  matches.sort((a, b) => {
    // First by priority (higher first)
    const priorityDiff = (b.priority || 0) - (a.priority || 0);
    if (priorityDiff !== 0) return priorityDiff;

    // Then by order (lower first)
    return (a.order || 0) - (b.order || 0);
  });

  return matches;
}

/**
 * Scan text with depth limit (only scan recent messages)
 */
export function scanWithDepth(
  messages: Array<{ content: string }>,
  entries: WorldInfoEntry[],
  scanDepth: number = 10
): WorldInfoEntry[] {
  // Get recent messages up to scan depth
  const recentMessages = messages.slice(-scanDepth);
  const combinedText = recentMessages.map((m) => m.content).join('\n');

  return scanForMatches(combinedText, entries);
}

/**
 * Get entries that should always be included (constant entries)
 */
export function getConstantEntries(entries: WorldInfoEntry[]): WorldInfoEntry[] {
  return entries.filter((e) => e.enabled && e.constant);
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate a regex pattern
 */
export function isValidRegex(pattern: string): boolean {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

/**
 * Test a keyword against sample text
 */
export function testKeyword(
  keyword: string,
  sampleText: string,
  options: {
    useRegex?: boolean;
    caseSensitive?: boolean;
    matchWholeWords?: boolean;
  } = {}
): { matches: boolean; matchCount: number; positions: number[] } {
  const entry: WorldInfoEntry = {
    id: 'test',
    keys: [keyword],
    content: '',
    enabled: true,
    order: 0,
    useRegex: options.useRegex,
    caseSensitive: options.caseSensitive,
    matchWholeWords: options.matchWholeWords,
  };

  const matches = matchesEntry(sampleText, entry);

  // Find match positions
  const positions: number[] = [];
  if (matches) {
    const searchText = options.caseSensitive ? sampleText : sampleText.toLowerCase();
    const searchKey = options.caseSensitive ? keyword : keyword.toLowerCase();

    if (options.useRegex) {
      try {
        const flags = options.caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(keyword, flags);
        let match;
        while ((match = regex.exec(sampleText)) !== null) {
          positions.push(match.index);
        }
      } catch {
        // Invalid regex
      }
    } else if (options.matchWholeWords) {
      const escapedKey = escapeRegex(searchKey);
      const flags = options.caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(`\\b${escapedKey}\\b`, flags);
      let match;
      while ((match = regex.exec(sampleText)) !== null) {
        positions.push(match.index);
      }
    } else {
      let pos = 0;
      while ((pos = searchText.indexOf(searchKey, pos)) !== -1) {
        positions.push(pos);
        pos += searchKey.length;
      }
    }
  }

  return {
    matches,
    matchCount: positions.length,
    positions,
  };
}
