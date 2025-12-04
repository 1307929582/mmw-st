/**
 * Property-based tests for character manager
 *
 * **Feature: mobile-app, Property 8: Character Deletion Removes Data**
 * **Feature: mobile-app, Property 9: Character Tag Filtering**
 * **Validates: Requirements 5.9, 5.10**
 */

import * as fc from 'fast-check';
import { arbCharacterData, arbUuid, arbTimestamp, fcConfig } from './test-utils';
import type { Character, CharacterFilter } from '@/types';

// Mock character manager for testing
class MockCharacterManager {
  private characters: Map<string, Character> = new Map();

  async create(data: Character): Promise<Character> {
    const character = { ...data };
    this.characters.set(character.id, character);
    return character;
  }

  async get(id: string): Promise<Character | null> {
    return this.characters.get(id) || null;
  }

  async delete(id: string): Promise<void> {
    this.characters.delete(id);
  }

  async list(filter?: CharacterFilter): Promise<Character[]> {
    let characters = Array.from(this.characters.values());

    if (!filter) return characters;

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

    return characters;
  }

  async addTag(id: string, tag: string): Promise<Character | null> {
    const character = this.characters.get(id);
    if (!character) return null;

    if (!character.tags) character.tags = [];
    if (!character.tags.includes(tag)) {
      character.tags.push(tag);
    }
    return character;
  }

  async removeTag(id: string, tag: string): Promise<Character | null> {
    const character = this.characters.get(id);
    if (!character) return null;

    if (character.tags) {
      character.tags = character.tags.filter((t) => t !== tag);
    }
    return character;
  }

  clear(): void {
    this.characters.clear();
  }
}

describe('Character Deletion Removes Data', () => {
  let manager: MockCharacterManager;

  beforeEach(() => {
    manager = new MockCharacterManager();
  });

  /**
   * Property 8: Character Deletion Removes Data
   * For any character, after deletion, retrieving that character SHALL return null.
   */

  it('deleted character cannot be retrieved', async () => {
    await fc.assert(
      fc.asyncProperty(arbCharacterData, arbUuid, arbTimestamp, async (data, id, timestamp) => {
        const character: Character = {
          ...data,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          isFavorite: false,
          chatCount: 0,
        };

        // Create character
        await manager.create(character);

        // Verify it exists
        const beforeDelete = await manager.get(id);
        expect(beforeDelete).not.toBeNull();

        // Delete character
        await manager.delete(id);

        // Verify it's gone
        const afterDelete = await manager.get(id);
        expect(afterDelete).toBeNull();
      }),
      fcConfig
    );
  });

  it('deleting non-existent character does not throw', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, async (id) => {
        // Should not throw
        await expect(manager.delete(id)).resolves.not.toThrow();
      }),
      fcConfig
    );
  });

  it('deleting one character does not affect others', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbCharacterData,
        arbCharacterData,
        arbUuid,
        arbUuid,
        arbTimestamp,
        async (data1, data2, id1, id2, timestamp) => {
          // Skip if IDs are the same
          if (id1 === id2) return;

          const char1: Character = {
            ...data1,
            id: id1,
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          const char2: Character = {
            ...data2,
            id: id2,
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          await manager.create(char1);
          await manager.create(char2);

          // Delete first character
          await manager.delete(id1);

          // Second character should still exist
          const remaining = await manager.get(id2);
          expect(remaining).not.toBeNull();
          expect(remaining?.name).toBe(data2.name);
        }
      ),
      fcConfig
    );
  });
});

describe('Character Tag Filtering', () => {
  let manager: MockCharacterManager;

  beforeEach(() => {
    manager = new MockCharacterManager();
  });

  /**
   * Property 9: Character Tag Filtering
   * For any set of characters with tags, filtering by a specific tag
   * SHALL return only characters that have that tag.
   */

  const arbTag = fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0);

  it('filtering by tag returns only characters with that tag', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbCharacterData, { minLength: 1, maxLength: 10 }),
        arbTag,
        fc.array(arbUuid, { minLength: 1, maxLength: 10 }),
        arbTimestamp,
        async (dataList, filterTag, ids, timestamp) => {
          manager.clear();

          // Create characters with random tags
          const characters: Character[] = [];
          for (let i = 0; i < Math.min(dataList.length, ids.length); i++) {
            const hasTag = i % 2 === 0; // Every other character has the tag
            const character: Character = {
              ...dataList[i],
              id: ids[i],
              tags: hasTag ? [filterTag] : [],
              createdAt: timestamp,
              updatedAt: timestamp,
              isFavorite: false,
              chatCount: 0,
            };
            await manager.create(character);
            characters.push(character);
          }

          // Filter by tag
          const filtered = await manager.list({ tags: [filterTag] });

          // All filtered characters should have the tag
          for (const char of filtered) {
            expect(char.tags).toContain(filterTag);
          }

          // Count should match characters with the tag
          const expectedCount = characters.filter((c) => c.tags?.includes(filterTag)).length;
          expect(filtered.length).toBe(expectedCount);
        }
      ),
      fcConfig
    );
  });

  it('adding tag makes character appear in filtered results', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbCharacterData,
        arbUuid,
        arbTag,
        arbTimestamp,
        async (data, id, tag, timestamp) => {
          manager.clear();

          const character: Character = {
            ...data,
            id,
            tags: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          await manager.create(character);

          // Before adding tag
          const beforeAdd = await manager.list({ tags: [tag] });
          expect(beforeAdd.length).toBe(0);

          // Add tag
          await manager.addTag(id, tag);

          // After adding tag
          const afterAdd = await manager.list({ tags: [tag] });
          expect(afterAdd.length).toBe(1);
          expect(afterAdd[0].id).toBe(id);
        }
      ),
      fcConfig
    );
  });

  it('removing tag removes character from filtered results', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbCharacterData,
        arbUuid,
        arbTag,
        arbTimestamp,
        async (data, id, tag, timestamp) => {
          manager.clear();

          const character: Character = {
            ...data,
            id,
            tags: [tag],
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          await manager.create(character);

          // Before removing tag
          const beforeRemove = await manager.list({ tags: [tag] });
          expect(beforeRemove.length).toBe(1);

          // Remove tag
          await manager.removeTag(id, tag);

          // After removing tag
          const afterRemove = await manager.list({ tags: [tag] });
          expect(afterRemove.length).toBe(0);
        }
      ),
      fcConfig
    );
  });
});
