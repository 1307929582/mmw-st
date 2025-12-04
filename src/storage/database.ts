/**
 * SQLite Database Adapter
 *
 * Provides persistent storage for characters, chats, settings, and other data.
 */

import * as SQLite from 'expo-sqlite';
import type {
  Character,
  CharacterData,
  ChatSession,
  ChatMessage,
  WorldInfoBook,
  WorldInfoEntry,
  Preset,
  Persona,
  Group,
  AppSettings,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'sillytavern.db';
const DB_VERSION = 1;

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database and create tables
 */
export async function initDatabase(): Promise<void> {
  db = SQLite.openDatabaseSync(DB_NAME);

  // Create tables
  await db.execAsync(`
    -- Characters table
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_favorite INTEGER DEFAULT 0,
      chat_count INTEGER DEFAULT 0
    );

    -- Chat sessions table
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      group_id TEXT,
      messages TEXT NOT NULL,
      metadata TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    -- World info books table
    CREATE TABLE IF NOT EXISTS world_info_books (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      entries TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Presets table
    CREATE TABLE IF NOT EXISTS presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT,
      config TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Personas table
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      avatar TEXT,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Groups table
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      character_ids TEXT NOT NULL,
      avatar TEXT,
      description TEXT,
      generation_mode TEXT DEFAULT 'round-robin',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Settings table (key-value store)
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(data);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_character ON chat_sessions(character_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated ON chat_sessions(updated_at);
  `);
}

/**
 * Get database instance
 */
function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============================================
// Character Operations
// ============================================

export async function saveCharacter(character: Character): Promise<void> {
  const database = getDb();
  const { id, avatar, createdAt, updatedAt, isFavorite, chatCount, ...data } = character;

  await database.runAsync(
    `INSERT OR REPLACE INTO characters (id, data, avatar, created_at, updated_at, is_favorite, chat_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, JSON.stringify(data), avatar || null, createdAt, updatedAt, isFavorite ? 1 : 0, chatCount]
  );
}

export async function getCharacter(id: string): Promise<Character | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    data: string;
    avatar: string | null;
    created_at: number;
    updated_at: number;
    is_favorite: number;
    chat_count: number;
  }>('SELECT * FROM characters WHERE id = ?', [id]);

  if (!row) return null;

  const data = JSON.parse(row.data) as CharacterData;
  return {
    ...data,
    id: row.id,
    avatar: row.avatar || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isFavorite: row.is_favorite === 1,
    chatCount: row.chat_count,
  };
}

export async function getAllCharacters(): Promise<Character[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    data: string;
    avatar: string | null;
    created_at: number;
    updated_at: number;
    is_favorite: number;
    chat_count: number;
  }>('SELECT * FROM characters ORDER BY updated_at DESC');

  return rows.map((row) => {
    const data = JSON.parse(row.data) as CharacterData;
    return {
      ...data,
      id: row.id,
      avatar: row.avatar || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      isFavorite: row.is_favorite === 1,
      chatCount: row.chat_count,
    };
  });
}

export async function deleteCharacter(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM characters WHERE id = ?', [id]);
}

// ============================================
// Chat Session Operations
// ============================================

export async function saveChatSession(session: ChatSession): Promise<void> {
  const database = getDb();

  await database.runAsync(
    `INSERT OR REPLACE INTO chat_sessions (id, character_id, group_id, messages, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.characterId,
      session.groupId || null,
      JSON.stringify(session.messages),
      JSON.stringify(session.metadata),
      session.createdAt,
      session.updatedAt,
    ]
  );
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    character_id: string;
    group_id: string | null;
    messages: string;
    metadata: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM chat_sessions WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    characterId: row.character_id,
    groupId: row.group_id || undefined,
    messages: JSON.parse(row.messages) as ChatMessage[],
    metadata: JSON.parse(row.metadata || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getChatSessionsForCharacter(characterId: string): Promise<ChatSession[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    character_id: string;
    group_id: string | null;
    messages: string;
    metadata: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM chat_sessions WHERE character_id = ? ORDER BY updated_at DESC', [characterId]);

  return rows.map((row) => ({
    id: row.id,
    characterId: row.character_id,
    groupId: row.group_id || undefined,
    messages: JSON.parse(row.messages) as ChatMessage[],
    metadata: JSON.parse(row.metadata || '{}'),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteChatSession(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM chat_sessions WHERE id = ?', [id]);
}

// ============================================
// World Info Operations
// ============================================

export async function saveWorldInfoBook(book: WorldInfoBook): Promise<void> {
  const database = getDb();

  await database.runAsync(
    `INSERT OR REPLACE INTO world_info_books (id, name, description, entries, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      book.id,
      book.name,
      book.description || null,
      JSON.stringify(book.entries),
      book.createdAt,
      book.updatedAt,
    ]
  );
}

export async function getWorldInfoBook(id: string): Promise<WorldInfoBook | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    name: string;
    description: string | null;
    entries: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM world_info_books WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    entries: JSON.parse(row.entries) as WorldInfoEntry[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllWorldInfoBooks(): Promise<WorldInfoBook[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    description: string | null;
    entries: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM world_info_books ORDER BY name');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    entries: JSON.parse(row.entries) as WorldInfoEntry[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deleteWorldInfoBook(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM world_info_books WHERE id = ?', [id]);
}

// ============================================
// Preset Operations
// ============================================

export async function savePreset(preset: Preset): Promise<void> {
  const database = getDb();

  await database.runAsync(
    `INSERT OR REPLACE INTO presets (id, name, provider, config, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      preset.id,
      preset.name,
      preset.provider || null,
      JSON.stringify(preset.config),
      preset.createdAt,
      preset.updatedAt,
    ]
  );
}

export async function getPreset(id: string): Promise<Preset | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{
    id: string;
    name: string;
    provider: string | null;
    config: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM presets WHERE id = ?', [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    provider: row.provider as Preset['provider'],
    config: JSON.parse(row.config),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllPresets(): Promise<Preset[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    provider: string | null;
    config: string;
    created_at: number;
    updated_at: number;
  }>('SELECT * FROM presets ORDER BY name');

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    provider: row.provider as Preset['provider'],
    config: JSON.parse(row.config),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function deletePreset(id: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM presets WHERE id = ?', [id]);
}

// ============================================
// Settings Operations
// ============================================

export async function saveSetting(key: string, value: unknown): Promise<void> {
  const database = getDb();
  await database.runAsync(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, JSON.stringify(value)]
  );
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ key: string; value: string }>(
    'SELECT * FROM settings WHERE key = ?',
    [key]
  );

  if (!row) return null;
  return JSON.parse(row.value) as T;
}

export async function deleteSetting(key: string): Promise<void> {
  const database = getDb();
  await database.runAsync('DELETE FROM settings WHERE key = ?', [key]);
}

// ============================================
// Utility Functions
// ============================================

export function generateId(): string {
  return uuidv4();
}

export function getCurrentTimestamp(): number {
  return Date.now();
}
