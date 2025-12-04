/**
 * Character Manager
 *
 * Handles character CRUD operations, import/export, and filtering.
 */

import type { Character, CharacterData, CharacterFilter, CharacterCard } from '@/types';
import {
  saveCharacter as dbSaveCharacter,
  getCharacter as dbGetCharacter,
  getAllCharacters as dbGetAllCharacters,
  deleteCharacter as dbDeleteCharacter,
  generateId,
  getCurrentTimestamp,
  deleteChatSession,
  getChatSessionsForCharacter,
} from '@/storage/database';
import { saveAvatar, deleteAvatar, readAvatar } from '@/storage/filesystem';
import {
  parseCharacterCard,
  createCharacterFromData,
  createCharacterFromCard,
  exportCharacterToJson,
  exportToV2Card,
  validateCharacterData,
} from './parser';
import { embedCharacterIntoPng, extractCharacterFromPng } from './png-embed';

/**
 * Create a new character
 */
export async function createCharacter(
  data: CharacterData,
  avatarBase64?: string
): Promise<Character> {
  // Validate data
  const errors = validateCharacterData(data);
  if (errors.length > 0) {
    throw new Error(`Invalid character data: ${errors.join(', ')}`);
  }

  // Create character
  const character = createCharacterFromData(data);

  // Save avatar if provided
  if (avatarBase64) {
    await saveAvatar(character.id, avatarBase64);
    character.avatar = character.id;
  }

  // Save to database
  await dbSaveCharacter(character);

  return character;
}

/**
 * Get a character by ID
 */
export async function getCharacter(id: string): Promise<Character | null> {
  return await dbGetCharacter(id);
}

/**
 * Update a character
 */
export async function updateCharacter(
  id: string,
  updates: Partial<CharacterData>,
  newAvatarBase64?: string
): Promise<Character> {
  const existing = await dbGetCharacter(id);
  if (!existing) {
    throw new Error(`Character not found: ${id}`);
  }

  // Merge updates
  const updated: Character = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: getCurrentTimestamp(),
    isFavorite: existing.isFavorite,
    chatCount: existing.chatCount,
  };

  // Validate
  const errors = validateCharacterData(updated);
  if (errors.length > 0) {
    throw new Error(`Invalid character data: ${errors.join(', ')}`);
  }

  // Update avatar if provided
  if (newAvatarBase64) {
    await saveAvatar(id, newAvatarBase64);
    updated.avatar = id;
  }

  // Save to database
  await dbSaveCharacter(updated);

  return updated;
}

/**
 * Delete a character
 */
export async function deleteCharacter(id: string, deleteChats = false): Promise<void> {
  // Delete associated chats if requested
  if (deleteChats) {
    const chats = await getChatSessionsForCharacter(id);
    for (const chat of chats) {
      await deleteChatSession(chat.id);
    }
  }

  // Delete avatar
  await deleteAvatar(id);

  // Delete from database
  await dbDeleteCharacter(id);
}

/**
 * List all characters with optional filtering
 */
export async function listCharacters(filter?: CharacterFilter): Promise<Character[]> {
  let characters = await dbGetAllCharacters();

  if (!filter) {
    return characters;
  }

  // Apply search filter
  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    characters = characters.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.description.toLowerCase().includes(searchLower) ||
        c.tags?.some((t) => t.toLowerCase().includes(searchLower))
    );
  }

  // Apply tag filter
  if (filter.tags && filter.tags.length > 0) {
    characters = characters.filter((c) =>
      filter.tags!.some((tag) => c.tags?.includes(tag))
    );
  }

  // Apply favorites filter
  if (filter.favoritesOnly) {
    characters = characters.filter((c) => c.isFavorite);
  }

  // Apply sorting
  if (filter.sortBy) {
    const sortOrder = filter.sortOrder === 'desc' ? -1 : 1;
    characters.sort((a, b) => {
      switch (filter.sortBy) {
        case 'name':
          return sortOrder * a.name.localeCompare(b.name);
        case 'createdAt':
          return sortOrder * (a.createdAt - b.createdAt);
        case 'updatedAt':
          return sortOrder * (a.updatedAt - b.updatedAt);
        case 'chatCount':
          return sortOrder * (a.chatCount - b.chatCount);
        default:
          return 0;
      }
    });
  }

  return characters;
}

/**
 * Toggle character favorite status
 */
export async function toggleFavorite(id: string): Promise<Character> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  character.isFavorite = !character.isFavorite;
  character.updatedAt = getCurrentTimestamp();

  await dbSaveCharacter(character);
  return character;
}

/**
 * Update character tags
 */
export async function updateTags(id: string, tags: string[]): Promise<Character> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  character.tags = tags;
  character.updatedAt = getCurrentTimestamp();

  await dbSaveCharacter(character);
  return character;
}

/**
 * Add a tag to character
 */
export async function addTag(id: string, tag: string): Promise<Character> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  if (!character.tags) {
    character.tags = [];
  }

  if (!character.tags.includes(tag)) {
    character.tags.push(tag);
    character.updatedAt = getCurrentTimestamp();
    await dbSaveCharacter(character);
  }

  return character;
}

/**
 * Remove a tag from character
 */
export async function removeTag(id: string, tag: string): Promise<Character> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  if (character.tags) {
    character.tags = character.tags.filter((t) => t !== tag);
    character.updatedAt = getCurrentTimestamp();
    await dbSaveCharacter(character);
  }

  return character;
}

/**
 * Import character from JSON string
 */
export async function importFromJson(
  jsonString: string,
  avatarBase64?: string
): Promise<Character> {
  const card = parseCharacterCard(jsonString);
  const character = createCharacterFromCard(card, avatarBase64 ? generateId() : undefined);

  if (avatarBase64) {
    await saveAvatar(character.id, avatarBase64);
    character.avatar = character.id;
  }

  await dbSaveCharacter(character);
  return character;
}

/**
 * Import character from PNG with embedded data
 */
export async function importFromPng(pngBase64: string): Promise<Character> {
  const card = extractCharacterFromPng(pngBase64);
  if (!card) {
    throw new Error('No character data found in PNG');
  }

  const character = createCharacterFromCard(card);

  // Save the PNG as avatar
  await saveAvatar(character.id, pngBase64);
  character.avatar = character.id;

  await dbSaveCharacter(character);
  return character;
}

/**
 * Export character to JSON string
 */
export async function exportToJson(id: string, pretty = false): Promise<string> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  return exportCharacterToJson(character, pretty);
}

/**
 * Export character to PNG with embedded data
 */
export async function exportToPng(id: string): Promise<string> {
  const character = await dbGetCharacter(id);
  if (!character) {
    throw new Error(`Character not found: ${id}`);
  }

  // Get avatar or use a default
  let avatarBase64 = await readAvatar(id);
  if (!avatarBase64) {
    // Use a minimal 1x1 PNG as fallback
    avatarBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  return embedCharacterIntoPng(avatarBase64, character);
}

/**
 * Get all unique tags from all characters
 */
export async function getAllTags(): Promise<string[]> {
  const characters = await dbGetAllCharacters();
  const tagSet = new Set<string>();

  for (const character of characters) {
    if (character.tags) {
      for (const tag of character.tags) {
        tagSet.add(tag);
      }
    }
  }

  return Array.from(tagSet).sort();
}

/**
 * Bulk delete characters
 */
export async function bulkDelete(ids: string[], deleteChats = false): Promise<void> {
  for (const id of ids) {
    await deleteCharacter(id, deleteChats);
  }
}

/**
 * Bulk add tag to characters
 */
export async function bulkAddTag(ids: string[], tag: string): Promise<void> {
  for (const id of ids) {
    await addTag(id, tag);
  }
}

/**
 * Bulk remove tag from characters
 */
export async function bulkRemoveTag(ids: string[], tag: string): Promise<void> {
  for (const id of ids) {
    await removeTag(id, tag);
  }
}

/**
 * Increment chat count for a character
 */
export async function incrementChatCount(id: string): Promise<void> {
  const character = await dbGetCharacter(id);
  if (character) {
    character.chatCount += 1;
    await dbSaveCharacter(character);
  }
}
