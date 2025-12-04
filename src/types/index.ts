/**
 * SillyTavern Mobile - Core Type Definitions
 */

// ============================================
// Character Types
// ============================================

/**
 * V2 Character Card Specification
 */
export interface CharacterCard {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterData;
}

/**
 * V1 Character Card (legacy format)
 */
export interface CharacterCardV1 {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
}

/**
 * Character data fields (V2 spec)
 */
export interface CharacterData {
  // Required fields
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;

  // Optional fields
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  alternate_greetings?: string[];
  tags?: string[];
  creator?: string;
  character_version?: string;

  // Extensions
  extensions?: CharacterExtensions;
}

export interface CharacterExtensions {
  world?: string;
  depth_prompt?: {
    prompt: string;
    depth: number;
    role: 'system' | 'user' | 'assistant';
  };
  [key: string]: unknown;
}

/**
 * Internal character representation with metadata
 */
export interface Character extends CharacterData {
  id: string;
  avatar?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  chatCount: number;
}

// ============================================
// Chat Types
// ============================================

export interface ChatSession {
  id: string;
  characterId: string;
  groupId?: string;
  messages: ChatMessage[];
  metadata: ChatMetadata;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;

  // Swipes (alternative responses)
  swipes?: string[];
  swipeIndex?: number;

  // Metadata
  tokenCount?: number;
  isEdited?: boolean;
  generationConfig?: Partial<GenerationConfig>;
}

export interface ChatMetadata {
  authorsNote?: string;
  authorsNotePosition?: number;
  authorsNoteDepth?: number;
  worldInfoBooks?: string[];
  personaId?: string;
  instructTemplate?: string;
}

// ============================================
// Group Chat Types
// ============================================

export interface Group {
  id: string;
  name: string;
  characterIds: string[];
  avatar?: string;
  description?: string;
  generationMode: GroupGenerationMode;
  createdAt: number;
  updatedAt: number;
}

export type GroupGenerationMode = 'round-robin' | 'random' | 'manual';

// ============================================
// World Info Types
// ============================================

export interface WorldInfoBook {
  id: string;
  name: string;
  description?: string;
  entries: WorldInfoEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface WorldInfoEntry {
  id: string;
  keys: string[];
  secondaryKeys?: string[];
  content: string;
  comment?: string;

  // Conditions
  enabled: boolean;
  constant?: boolean;
  selective?: boolean;

  // Insertion
  position: WorldInfoPosition;
  depth?: number;

  // Matching
  caseSensitive?: boolean;
  matchWholeWords?: boolean;
  useRegex?: boolean;

  // Priority
  order: number;
  priority?: number;

  // Token budget
  tokenBudget?: number;
}

export type WorldInfoPosition =
  | 'before_char'
  | 'after_char'
  | 'before_example'
  | 'after_example'
  | 'depth';

// ============================================
// Persona Types
// ============================================

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// API Types
// ============================================

export type APIProvider =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'azure'
  | 'mistral'
  | 'novelai'
  | 'koboldai'
  | 'ollama'
  | 'textgen'
  | 'llamacpp'
  | 'horde'
  | 'tabby'
  | 'vllm'
  | 'custom';

export interface APIEndpoint {
  id: string;
  provider: APIProvider;
  name: string;
  baseUrl: string;
  model?: string;
  headers?: Record<string, string>;
  isDefault?: boolean;
}

export interface GenerationConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  topK?: number;
  repetitionPenalty?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  stream: boolean;
}

export interface GenerationRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  config: GenerationConfig;
}

export interface GenerationResponse {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | 'error';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// ============================================
// Preset Types
// ============================================

export interface Preset {
  id: string;
  name: string;
  provider?: APIProvider;
  config: Partial<GenerationConfig>;
  createdAt: number;
  updatedAt: number;
}

// ============================================
// Settings Types
// ============================================

export interface AppSettings {
  // UI
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: number;

  // API
  defaultProvider: APIProvider;
  defaultEndpointId?: string;
  defaultModel?: string;

  // Generation
  defaultPresetId?: string;
  streamingEnabled: boolean;
  maxContextTokens: number;

  // Features
  autoSave: boolean;
  confirmDelete: boolean;
  showTokenCount: boolean;

  // Privacy
  hideInAppSwitcher: boolean;
  biometricLock: boolean;
}

// ============================================
// Instruct Mode Types
// ============================================

export interface InstructTemplate {
  id: string;
  name: string;
  systemPromptPrefix: string;
  systemPromptSuffix: string;
  userPrefix: string;
  userSuffix: string;
  assistantPrefix: string;
  assistantSuffix: string;
  stopSequences: string[];
  wrapInNewlines: boolean;
}

// ============================================
// Author's Note Types
// ============================================

export interface AuthorsNote {
  content: string;
  position: 'before_char' | 'after_char' | 'in_chat';
  depth: number;
  role: 'system' | 'user' | 'assistant';
}

// ============================================
// Prompt Types
// ============================================

export interface PromptContext {
  character: CharacterData;
  chatHistory: ChatMessage[];
  worldInfo?: WorldInfoBook[];
  persona?: Persona;
  authorsNote?: AuthorsNote;
  systemPrompt?: string;
  instructTemplate?: InstructTemplate;
  maxContextTokens: number;
}

export interface PromptResult {
  messages: Array<{ role: string; content: string }>;
  tokenCount: number;
  truncated: boolean;
}

// ============================================
// Error Types
// ============================================

export enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  PARSE = 'parse',
  UNKNOWN = 'unknown',
}

export interface AppError {
  category: ErrorCategory;
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

// ============================================
// Filter Types
// ============================================

export interface CharacterFilter {
  search?: string;
  tags?: string[];
  favoritesOnly?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'chatCount';
  sortOrder?: 'asc' | 'desc';
}
