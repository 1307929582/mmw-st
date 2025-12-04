/**
 * Character Card Parser
 *
 * Parses V1 and V2 character card formats.
 */

import type {
  CharacterCard,
  CharacterCardV1,
  CharacterData,
  Character,
} from '@/types';
import { generateId, getCurrentTimestamp } from '@/storage/database';

/**
 * Check if data is a V2 character card
 */
export function isV2Card(data: unknown): data is CharacterCard {
  return (
    typeof data === 'object' &&
    data !== null &&
    'spec' in data &&
    (data as CharacterCard).spec === 'chara_card_v2'
  );
}

/**
 * Check if data is a V1 character card
 */
export function isV1Card(data: unknown): data is CharacterCardV1 {
  return (
    typeof data === 'object' &&
    data !== null &&
    'name' in data &&
    'description' in data &&
    'first_mes' in data &&
    !('spec' in data)
  );
}

/**
 * Convert V1 card to V2 format
 */
export function convertV1ToV2(v1Card: CharacterCardV1): CharacterCard {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: v1Card.name || '',
      description: v1Card.description || '',
      personality: v1Card.personality || '',
      scenario: v1Card.scenario || '',
      first_mes: v1Card.first_mes || '',
      mes_example: v1Card.mes_example || '',
    },
  };
}

/**
 * Parse character card from JSON string
 */
export function parseCharacterCard(jsonString: string): CharacterCard {
  const data = JSON.parse(jsonString);

  if (isV2Card(data)) {
    return validateV2Card(data);
  }

  if (isV1Card(data)) {
    return convertV1ToV2(data);
  }

  // Try to extract character data from various formats
  if (typeof data === 'object' && data !== null) {
    // Check for nested data structure
    if ('data' in data && typeof data.data === 'object') {
      const nestedData = data.data as Record<string, unknown>;
      if ('name' in nestedData) {
        return {
          spec: 'chara_card_v2',
          spec_version: '2.0',
          data: extractCharacterData(nestedData),
        };
      }
    }

    // Try to extract from root object
    if ('name' in data) {
      return {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: extractCharacterData(data as Record<string, unknown>),
      };
    }
  }

  throw new Error('Invalid character card format');
}

/**
 * Extract character data from an object
 */
function extractCharacterData(obj: Record<string, unknown>): CharacterData {
  return {
    name: String(obj.name || ''),
    description: String(obj.description || ''),
    personality: String(obj.personality || ''),
    scenario: String(obj.scenario || ''),
    first_mes: String(obj.first_mes || obj.first_message || ''),
    mes_example: String(obj.mes_example || obj.example_dialogue || ''),
    creator_notes: obj.creator_notes ? String(obj.creator_notes) : undefined,
    system_prompt: obj.system_prompt ? String(obj.system_prompt) : undefined,
    post_history_instructions: obj.post_history_instructions
      ? String(obj.post_history_instructions)
      : undefined,
    alternate_greetings: Array.isArray(obj.alternate_greetings)
      ? obj.alternate_greetings.map(String)
      : undefined,
    tags: Array.isArray(obj.tags) ? obj.tags.map(String) : undefined,
    creator: obj.creator ? String(obj.creator) : undefined,
    character_version: obj.character_version ? String(obj.character_version) : undefined,
    extensions: obj.extensions as CharacterData['extensions'],
  };
}

/**
 * Validate V2 card structure
 */
function validateV2Card(card: CharacterCard): CharacterCard {
  if (!card.data) {
    throw new Error('V2 card missing data field');
  }

  if (!card.data.name) {
    throw new Error('Character name is required');
  }

  // Ensure all required fields have at least empty strings
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: card.data.name,
      description: card.data.description || '',
      personality: card.data.personality || '',
      scenario: card.data.scenario || '',
      first_mes: card.data.first_mes || '',
      mes_example: card.data.mes_example || '',
      creator_notes: card.data.creator_notes,
      system_prompt: card.data.system_prompt,
      post_history_instructions: card.data.post_history_instructions,
      alternate_greetings: card.data.alternate_greetings,
      tags: card.data.tags,
      creator: card.data.creator,
      character_version: card.data.character_version,
      extensions: card.data.extensions,
    },
  };
}

/**
 * Create a Character from CharacterData
 */
export function createCharacterFromData(data: CharacterData, avatar?: string): Character {
  const now = getCurrentTimestamp();
  return {
    ...data,
    id: generateId(),
    avatar,
    createdAt: now,
    updatedAt: now,
    isFavorite: false,
    chatCount: 0,
  };
}

/**
 * Create a Character from a CharacterCard
 */
export function createCharacterFromCard(card: CharacterCard, avatar?: string): Character {
  return createCharacterFromData(card.data, avatar);
}

/**
 * Export character to V2 card format
 */
export function exportToV2Card(character: Character): CharacterCard {
  const { id, avatar, createdAt, updatedAt, isFavorite, chatCount, ...data } = character;

  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data,
  };
}

/**
 * Export character to JSON string
 */
export function exportCharacterToJson(character: Character, pretty = false): string {
  const card = exportToV2Card(character);
  return pretty ? JSON.stringify(card, null, 2) : JSON.stringify(card);
}

/**
 * Validate character data
 */
export function validateCharacterData(data: Partial<CharacterData>): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Character name is required');
  }

  if (data.name && data.name.length > 100) {
    errors.push('Character name must be 100 characters or less');
  }

  if (data.description && data.description.length > 50000) {
    errors.push('Description must be 50000 characters or less');
  }

  return errors;
}
