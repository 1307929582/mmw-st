/**
 * Property-based tests for character card parsing
 *
 * **Feature: mobile-app, Property 6: Character Card JSON Round-Trip**
 * **Feature: mobile-app, Property 7: Character Card V1/V2 Compatibility**
 * **Validates: Requirements 5.4, 5.6, 5.7**
 */

import * as fc from 'fast-check';
import { arbCharacterData, fcConfig } from './test-utils';
import {
  parseCharacterCard,
  exportCharacterToJson,
  createCharacterFromData,
  isV1Card,
  isV2Card,
  convertV1ToV2,
} from '../core/character/parser';
import type { CharacterCard, CharacterCardV1 } from '@/types';

describe('Character Card JSON Round-Trip', () => {
  /**
   * Property 6: Character Card JSON Round-Trip
   * For any valid character data, exporting to JSON and importing
   * SHALL produce equivalent character data.
   */

  it('export then import produces equivalent character data', () => {
    fc.assert(
      fc.property(arbCharacterData, (data) => {
        // Create character from data
        const character = createCharacterFromData(data);

        // Export to JSON
        const json = exportCharacterToJson(character);

        // Parse back
        const parsed = parseCharacterCard(json);

        // Compare data (excluding metadata like id, timestamps)
        expect(parsed.data.name).toBe(data.name);
        expect(parsed.data.description).toBe(data.description);
        expect(parsed.data.personality).toBe(data.personality);
        expect(parsed.data.scenario).toBe(data.scenario);
        expect(parsed.data.first_mes).toBe(data.first_mes);
        expect(parsed.data.mes_example).toBe(data.mes_example);
      }),
      fcConfig
    );
  });

  it('pretty printed JSON can be parsed back', () => {
    fc.assert(
      fc.property(arbCharacterData, (data) => {
        const character = createCharacterFromData(data);

        // Export with pretty printing
        const prettyJson = exportCharacterToJson(character, true);

        // Should be valid JSON
        expect(() => JSON.parse(prettyJson)).not.toThrow();

        // Should parse correctly
        const parsed = parseCharacterCard(prettyJson);
        expect(parsed.data.name).toBe(data.name);
      }),
      fcConfig
    );
  });
});

describe('Character Card V1/V2 Compatibility', () => {
  /**
   * Property 7: Character Card V1/V2 Compatibility
   * For any valid V1 character card, parsing it SHALL produce valid character data.
   * For any valid V2 character card, parsing it SHALL produce valid character data.
   */

  const arbV1Card: fc.Arbitrary<CharacterCardV1> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ maxLength: 5000 }),
    personality: fc.string({ maxLength: 5000 }),
    scenario: fc.string({ maxLength: 5000 }),
    first_mes: fc.string({ maxLength: 5000 }),
    mes_example: fc.string({ maxLength: 5000 }),
  });

  const arbV2Card: fc.Arbitrary<CharacterCard> = fc.record({
    spec: fc.constant('chara_card_v2' as const),
    spec_version: fc.constant('2.0' as const),
    data: arbCharacterData,
  });

  it('V1 cards are correctly identified', () => {
    fc.assert(
      fc.property(arbV1Card, (v1Card) => {
        expect(isV1Card(v1Card)).toBe(true);
        expect(isV2Card(v1Card)).toBe(false);
      }),
      fcConfig
    );
  });

  it('V2 cards are correctly identified', () => {
    fc.assert(
      fc.property(arbV2Card, (v2Card) => {
        expect(isV2Card(v2Card)).toBe(true);
        expect(isV1Card(v2Card)).toBe(false);
      }),
      fcConfig
    );
  });

  it('V1 cards can be converted to V2 format', () => {
    fc.assert(
      fc.property(arbV1Card, (v1Card) => {
        const v2Card = convertV1ToV2(v1Card);

        expect(v2Card.spec).toBe('chara_card_v2');
        expect(v2Card.spec_version).toBe('2.0');
        expect(v2Card.data.name).toBe(v1Card.name);
        expect(v2Card.data.description).toBe(v1Card.description);
        expect(v2Card.data.personality).toBe(v1Card.personality);
        expect(v2Card.data.scenario).toBe(v1Card.scenario);
        expect(v2Card.data.first_mes).toBe(v1Card.first_mes);
        expect(v2Card.data.mes_example).toBe(v1Card.mes_example);
      }),
      fcConfig
    );
  });

  it('V1 cards can be parsed from JSON', () => {
    fc.assert(
      fc.property(arbV1Card, (v1Card) => {
        const json = JSON.stringify(v1Card);
        const parsed = parseCharacterCard(json);

        expect(parsed.spec).toBe('chara_card_v2');
        expect(parsed.data.name).toBe(v1Card.name);
      }),
      fcConfig
    );
  });

  it('V2 cards can be parsed from JSON', () => {
    fc.assert(
      fc.property(arbV2Card, (v2Card) => {
        const json = JSON.stringify(v2Card);
        const parsed = parseCharacterCard(json);

        expect(parsed.spec).toBe('chara_card_v2');
        expect(parsed.data.name).toBe(v2Card.data.name);
      }),
      fcConfig
    );
  });

  it('V1 to V2 conversion preserves all data', () => {
    fc.assert(
      fc.property(arbV1Card, (v1Card) => {
        const v2Card = convertV1ToV2(v1Card);

        // All V1 fields should be preserved
        const v1Fields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'];
        for (const field of v1Fields) {
          expect(v2Card.data[field as keyof typeof v2Card.data]).toBe(
            v1Card[field as keyof typeof v1Card]
          );
        }
      }),
      fcConfig
    );
  });
});
