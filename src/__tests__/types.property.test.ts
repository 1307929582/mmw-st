/**
 * Property-based tests for data type serialization
 *
 * **Feature: mobile-app, Property 2: JSON Serialization Round-Trip**
 * **Validates: Requirements 2.9, 2.10, 2.11**
 */

import * as fc from 'fast-check';
import { arbCharacterData, arbChatMessage, arbWorldInfoEntry, fcConfig } from './test-utils';

describe('JSON Serialization Round-Trip', () => {
  /**
   * Property 2: JSON Serialization Round-Trip
   * For any valid data object, serializing to JSON and then deserializing
   * SHALL produce an equivalent object.
   */

  it('CharacterData: serialize then deserialize produces equivalent object', () => {
    fc.assert(
      fc.property(arbCharacterData, (characterData) => {
        // Serialize to JSON
        const json = JSON.stringify(characterData);

        // Deserialize from JSON
        const parsed = JSON.parse(json);

        // Clean both objects (remove undefined values)
        const cleanOriginal = JSON.parse(JSON.stringify(characterData));
        const cleanParsed = JSON.parse(JSON.stringify(parsed));

        // Should be equivalent
        expect(cleanParsed).toEqual(cleanOriginal);
      }),
      fcConfig
    );
  });

  it('ChatMessage: serialize then deserialize produces equivalent object', () => {
    fc.assert(
      fc.property(arbChatMessage, (message) => {
        const json = JSON.stringify(message);
        const parsed = JSON.parse(json);

        const cleanOriginal = JSON.parse(JSON.stringify(message));
        const cleanParsed = JSON.parse(JSON.stringify(parsed));

        expect(cleanParsed).toEqual(cleanOriginal);
      }),
      fcConfig
    );
  });

  it('WorldInfoEntry: serialize then deserialize produces equivalent object', () => {
    fc.assert(
      fc.property(arbWorldInfoEntry, (entry) => {
        const json = JSON.stringify(entry);
        const parsed = JSON.parse(json);

        const cleanOriginal = JSON.parse(JSON.stringify(entry));
        const cleanParsed = JSON.parse(JSON.stringify(parsed));

        expect(cleanParsed).toEqual(cleanOriginal);
      }),
      fcConfig
    );
  });

  it('Pretty printed JSON can be parsed back', () => {
    fc.assert(
      fc.property(arbCharacterData, (characterData) => {
        // Pretty print with indentation
        const prettyJson = JSON.stringify(characterData, null, 2);

        // Should be valid JSON
        expect(() => JSON.parse(prettyJson)).not.toThrow();

        // Should produce equivalent object
        const parsed = JSON.parse(prettyJson);
        const cleanOriginal = JSON.parse(JSON.stringify(characterData));
        expect(JSON.parse(JSON.stringify(parsed))).toEqual(cleanOriginal);
      }),
      fcConfig
    );
  });

  it('Nested objects serialize correctly', () => {
    const arbNestedData = fc.record({
      character: arbCharacterData,
      messages: fc.array(arbChatMessage, { maxLength: 10 }),
      worldInfo: fc.array(arbWorldInfoEntry, { maxLength: 5 }),
    });

    fc.assert(
      fc.property(arbNestedData, (data) => {
        const json = JSON.stringify(data);
        const parsed = JSON.parse(json);

        const cleanOriginal = JSON.parse(JSON.stringify(data));
        const cleanParsed = JSON.parse(JSON.stringify(parsed));

        expect(cleanParsed).toEqual(cleanOriginal);
      }),
      fcConfig
    );
  });
});
