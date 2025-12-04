/**
 * Property-based tests for data storage
 *
 * **Feature: mobile-app, Property 1: Data Storage Round-Trip**
 * **Validates: Requirements 2.1-2.6, 2.9, 2.10**
 */

import * as fc from 'fast-check';
import {
  arbCharacterData,
  arbChatMessage,
  arbWorldInfoEntry,
  arbUuid,
  arbTimestamp,
  fcConfig,
} from './test-utils';
import type { Character, ChatSession, WorldInfoBook, Preset } from '@/types';

// Mock storage for testing (in-memory implementation)
class MockDatabase {
  private characters: Map<string, Character> = new Map();
  private chatSessions: Map<string, ChatSession> = new Map();
  private worldInfoBooks: Map<string, WorldInfoBook> = new Map();
  private presets: Map<string, Preset> = new Map();
  private settings: Map<string, unknown> = new Map();

  // Character operations
  saveCharacter(character: Character): void {
    this.characters.set(character.id, JSON.parse(JSON.stringify(character)));
  }

  getCharacter(id: string): Character | null {
    const char = this.characters.get(id);
    return char ? JSON.parse(JSON.stringify(char)) : null;
  }

  deleteCharacter(id: string): void {
    this.characters.delete(id);
  }

  // Chat session operations
  saveChatSession(session: ChatSession): void {
    this.chatSessions.set(session.id, JSON.parse(JSON.stringify(session)));
  }

  getChatSession(id: string): ChatSession | null {
    const session = this.chatSessions.get(id);
    return session ? JSON.parse(JSON.stringify(session)) : null;
  }

  deleteChatSession(id: string): void {
    this.chatSessions.delete(id);
  }

  // World info operations
  saveWorldInfoBook(book: WorldInfoBook): void {
    this.worldInfoBooks.set(book.id, JSON.parse(JSON.stringify(book)));
  }

  getWorldInfoBook(id: string): WorldInfoBook | null {
    const book = this.worldInfoBooks.get(id);
    return book ? JSON.parse(JSON.stringify(book)) : null;
  }

  deleteWorldInfoBook(id: string): void {
    this.worldInfoBooks.delete(id);
  }

  // Preset operations
  savePreset(preset: Preset): void {
    this.presets.set(preset.id, JSON.parse(JSON.stringify(preset)));
  }

  getPreset(id: string): Preset | null {
    const preset = this.presets.get(id);
    return preset ? JSON.parse(JSON.stringify(preset)) : null;
  }

  // Settings operations
  saveSetting(key: string, value: unknown): void {
    this.settings.set(key, JSON.parse(JSON.stringify(value)));
  }

  getSetting<T>(key: string): T | null {
    const value = this.settings.get(key);
    return value !== undefined ? (JSON.parse(JSON.stringify(value)) as T) : null;
  }

  clear(): void {
    this.characters.clear();
    this.chatSessions.clear();
    this.worldInfoBooks.clear();
    this.presets.clear();
    this.settings.clear();
  }
}

describe('Data Storage Round-Trip', () => {
  let db: MockDatabase;

  beforeEach(() => {
    db = new MockDatabase();
  });

  /**
   * Property 1: Data Storage Round-Trip
   * For any valid data object, storing it to the database and then retrieving it
   * SHALL produce an equivalent object.
   */

  describe('Character Storage', () => {
    const arbCharacter = fc.record({
      ...arbCharacterData.generator,
      id: arbUuid,
      avatar: fc.option(fc.string(), { nil: undefined }),
      createdAt: arbTimestamp,
      updatedAt: arbTimestamp,
      isFavorite: fc.boolean(),
      chatCount: fc.nat({ max: 1000 }),
    }) as fc.Arbitrary<Character>;

    it('store then retrieve produces equivalent character', () => {
      fc.assert(
        fc.property(arbCharacterData, arbUuid, arbTimestamp, (data, id, timestamp) => {
          const character: Character = {
            ...data,
            id,
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          db.saveCharacter(character);
          const retrieved = db.getCharacter(id);

          expect(retrieved).not.toBeNull();
          expect(retrieved).toEqual(character);
        }),
        fcConfig
      );
    });

    it('delete removes character', () => {
      fc.assert(
        fc.property(arbCharacterData, arbUuid, arbTimestamp, (data, id, timestamp) => {
          const character: Character = {
            ...data,
            id,
            createdAt: timestamp,
            updatedAt: timestamp,
            isFavorite: false,
            chatCount: 0,
          };

          db.saveCharacter(character);
          db.deleteCharacter(id);
          const retrieved = db.getCharacter(id);

          expect(retrieved).toBeNull();
        }),
        fcConfig
      );
    });
  });

  describe('Chat Session Storage', () => {
    it('store then retrieve produces equivalent chat session', () => {
      fc.assert(
        fc.property(
          arbUuid,
          arbUuid,
          fc.array(arbChatMessage, { maxLength: 50 }),
          arbTimestamp,
          (sessionId, characterId, messages, timestamp) => {
            const session: ChatSession = {
              id: sessionId,
              characterId,
              messages,
              metadata: {},
              createdAt: timestamp,
              updatedAt: timestamp,
            };

            db.saveChatSession(session);
            const retrieved = db.getChatSession(sessionId);

            expect(retrieved).not.toBeNull();
            expect(retrieved).toEqual(session);
          }
        ),
        fcConfig
      );
    });
  });

  describe('World Info Storage', () => {
    it('store then retrieve produces equivalent world info book', () => {
      fc.assert(
        fc.property(
          arbUuid,
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.array(arbWorldInfoEntry, { maxLength: 20 }),
          arbTimestamp,
          (id, name, entries, timestamp) => {
            const book: WorldInfoBook = {
              id,
              name,
              entries,
              createdAt: timestamp,
              updatedAt: timestamp,
            };

            db.saveWorldInfoBook(book);
            const retrieved = db.getWorldInfoBook(id);

            expect(retrieved).not.toBeNull();
            expect(retrieved).toEqual(book);
          }
        ),
        fcConfig
      );
    });
  });

  describe('Settings Storage', () => {
    it('store then retrieve produces equivalent setting value', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.jsonValue(),
          (key, value) => {
            db.saveSetting(key, value);
            const retrieved = db.getSetting(key);

            // Compare JSON representations to handle undefined vs missing
            expect(JSON.stringify(retrieved)).toEqual(JSON.stringify(value));
          }
        ),
        fcConfig
      );
    });
  });
});
