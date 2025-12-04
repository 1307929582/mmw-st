/**
 * World Info Manager
 *
 * Handles CRUD operations for world info books and entries.
 */

import type { WorldInfoBook, WorldInfoEntry } from '@/types';
import {
  saveWorldInfoBook,
  getWorldInfoBook,
  getAllWorldInfoBooks,
  deleteWorldInfoBook as dbDeleteWorldInfoBook,
  generateId,
  getCurrentTimestamp,
} from '@/storage/database';

/**
 * Create a new world info book
 */
export async function createWorldInfoBook(
  name: string,
  description?: string
): Promise<WorldInfoBook> {
  const now = getCurrentTimestamp();
  const book: WorldInfoBook = {
    id: generateId(),
    name,
    description,
    entries: [],
    createdAt: now,
    updatedAt: now,
  };

  await saveWorldInfoBook(book);
  return book;
}

/**
 * Get a world info book by ID
 */
export async function getWorldInfoBookById(id: string): Promise<WorldInfoBook | null> {
  return await getWorldInfoBook(id);
}

/**
 * Get all world info books
 */
export async function listWorldInfoBooks(): Promise<WorldInfoBook[]> {
  return await getAllWorldInfoBooks();
}

/**
 * Update a world info book
 */
export async function updateWorldInfoBook(
  id: string,
  updates: Partial<Pick<WorldInfoBook, 'name' | 'description'>>
): Promise<WorldInfoBook> {
  const book = await getWorldInfoBook(id);
  if (!book) {
    throw new Error(`World info book not found: ${id}`);
  }

  if (updates.name !== undefined) book.name = updates.name;
  if (updates.description !== undefined) book.description = updates.description;
  book.updatedAt = getCurrentTimestamp();

  await saveWorldInfoBook(book);
  return book;
}

/**
 * Delete a world info book
 */
export async function deleteWorldInfoBook(id: string): Promise<void> {
  await dbDeleteWorldInfoBook(id);
}

/**
 * Add an entry to a world info book
 */
export async function addEntry(
  bookId: string,
  entry: Omit<WorldInfoEntry, 'id'>
): Promise<WorldInfoEntry> {
  const book = await getWorldInfoBook(bookId);
  if (!book) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  const newEntry: WorldInfoEntry = {
    ...entry,
    id: generateId(),
  };

  book.entries.push(newEntry);
  book.updatedAt = getCurrentTimestamp();

  await saveWorldInfoBook(book);
  return newEntry;
}

/**
 * Update an entry in a world info book
 */
export async function updateEntry(
  bookId: string,
  entryId: string,
  updates: Partial<Omit<WorldInfoEntry, 'id'>>
): Promise<WorldInfoEntry> {
  const book = await getWorldInfoBook(bookId);
  if (!book) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  const entryIndex = book.entries.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  book.entries[entryIndex] = {
    ...book.entries[entryIndex],
    ...updates,
  };
  book.updatedAt = getCurrentTimestamp();

  await saveWorldInfoBook(book);
  return book.entries[entryIndex];
}

/**
 * Delete an entry from a world info book
 */
export async function deleteEntry(bookId: string, entryId: string): Promise<void> {
  const book = await getWorldInfoBook(bookId);
  if (!book) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  const entryIndex = book.entries.findIndex((e) => e.id === entryId);
  if (entryIndex === -1) {
    throw new Error(`Entry not found: ${entryId}`);
  }

  book.entries.splice(entryIndex, 1);
  book.updatedAt = getCurrentTimestamp();

  await saveWorldInfoBook(book);
}

/**
 * Reorder entries in a world info book
 */
export async function reorderEntries(
  bookId: string,
  entryIds: string[]
): Promise<WorldInfoBook> {
  const book = await getWorldInfoBook(bookId);
  if (!book) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  // Create a map of entries by ID
  const entryMap = new Map(book.entries.map((e) => [e.id, e]));

  // Reorder based on provided IDs
  const reorderedEntries: WorldInfoEntry[] = [];
  for (let i = 0; i < entryIds.length; i++) {
    const entry = entryMap.get(entryIds[i]);
    if (entry) {
      entry.order = i;
      reorderedEntries.push(entry);
      entryMap.delete(entryIds[i]);
    }
  }

  // Add any remaining entries that weren't in the reorder list
  for (const entry of entryMap.values()) {
    entry.order = reorderedEntries.length;
    reorderedEntries.push(entry);
  }

  book.entries = reorderedEntries;
  book.updatedAt = getCurrentTimestamp();

  await saveWorldInfoBook(book);
  return book;
}

/**
 * Import world info from JSON
 */
export async function importWorldInfo(jsonString: string): Promise<WorldInfoBook> {
  const data = JSON.parse(jsonString);

  // Handle different import formats
  let book: WorldInfoBook;

  if (data.entries && Array.isArray(data.entries)) {
    // Standard format
    const now = getCurrentTimestamp();
    book = {
      id: generateId(),
      name: data.name || 'Imported World Info',
      description: data.description,
      entries: data.entries.map((e: Partial<WorldInfoEntry>, index: number) => ({
        id: generateId(),
        keys: e.keys || [],
        secondaryKeys: e.secondaryKeys,
        content: e.content || '',
        comment: e.comment,
        enabled: e.enabled !== false,
        constant: e.constant || false,
        selective: e.selective || false,
        position: e.position || 'before_char',
        depth: e.depth,
        caseSensitive: e.caseSensitive || false,
        matchWholeWords: e.matchWholeWords || false,
        useRegex: e.useRegex || false,
        order: e.order ?? index,
        priority: e.priority,
        tokenBudget: e.tokenBudget,
      })),
      createdAt: now,
      updatedAt: now,
    };
  } else {
    throw new Error('Invalid world info format');
  }

  await saveWorldInfoBook(book);
  return book;
}

/**
 * Export world info to JSON
 */
export async function exportWorldInfo(bookId: string, pretty = false): Promise<string> {
  const book = await getWorldInfoBook(bookId);
  if (!book) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  const exportData = {
    name: book.name,
    description: book.description,
    entries: book.entries,
  };

  return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
}

/**
 * Duplicate a world info book
 */
export async function duplicateWorldInfoBook(bookId: string): Promise<WorldInfoBook> {
  const original = await getWorldInfoBook(bookId);
  if (!original) {
    throw new Error(`World info book not found: ${bookId}`);
  }

  const now = getCurrentTimestamp();
  const duplicate: WorldInfoBook = {
    id: generateId(),
    name: `${original.name} (Copy)`,
    description: original.description,
    entries: original.entries.map((e) => ({
      ...e,
      id: generateId(),
    })),
    createdAt: now,
    updatedAt: now,
  };

  await saveWorldInfoBook(duplicate);
  return duplicate;
}
