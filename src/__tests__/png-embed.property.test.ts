/**
 * Property-based tests for PNG character embedding
 *
 * **Feature: mobile-app, Property 5: Character Card PNG Round-Trip**
 * **Validates: Requirements 5.3, 5.5**
 */

import * as fc from 'fast-check';
import { arbCharacterData, fcConfig } from './test-utils';
import { createCharacterFromData } from '../core/character/parser';
import {
  embedCharacterIntoPng,
  extractCharacterFromPng,
  pngHasCharacterData,
} from '../core/character/png-embed';

// Minimal valid PNG (1x1 transparent pixel)
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Character Card PNG Round-Trip', () => {
  /**
   * Property 5: Character Card PNG Round-Trip
   * For any valid character data, embedding it into a PNG and extracting it
   * SHALL produce equivalent character data.
   */

  it('embed then extract produces equivalent character data', () => {
    fc.assert(
      fc.property(arbCharacterData, (data) => {
        // Create character from data
        const character = createCharacterFromData(data);

        // Embed into PNG
        const pngWithData = embedCharacterIntoPng(MINIMAL_PNG_BASE64, character);

        // Extract from PNG
        const extracted = extractCharacterFromPng(pngWithData);

        // Should have extracted data
        expect(extracted).not.toBeNull();

        if (extracted) {
          // Compare core fields
          expect(extracted.data.name).toBe(data.name);
          expect(extracted.data.description).toBe(data.description);
          expect(extracted.data.personality).toBe(data.personality);
          expect(extracted.data.scenario).toBe(data.scenario);
          expect(extracted.data.first_mes).toBe(data.first_mes);
          expect(extracted.data.mes_example).toBe(data.mes_example);
        }
      }),
      fcConfig
    );
  });

  it('PNG with embedded data is detected', () => {
    fc.assert(
      fc.property(arbCharacterData, (data) => {
        const character = createCharacterFromData(data);
        const pngWithData = embedCharacterIntoPng(MINIMAL_PNG_BASE64, character);

        expect(pngHasCharacterData(pngWithData)).toBe(true);
      }),
      fcConfig
    );
  });

  it('PNG without embedded data returns null on extraction', () => {
    const extracted = extractCharacterFromPng(MINIMAL_PNG_BASE64);
    expect(extracted).toBeNull();
  });

  it('PNG without embedded data is not detected', () => {
    expect(pngHasCharacterData(MINIMAL_PNG_BASE64)).toBe(false);
  });

  it('re-embedding overwrites previous data', () => {
    fc.assert(
      fc.property(arbCharacterData, arbCharacterData, (data1, data2) => {
        const character1 = createCharacterFromData(data1);
        const character2 = createCharacterFromData(data2);

        // Embed first character
        const png1 = embedCharacterIntoPng(MINIMAL_PNG_BASE64, character1);

        // Embed second character (should overwrite)
        const png2 = embedCharacterIntoPng(png1, character2);

        // Extract should return second character's data
        const extracted = extractCharacterFromPng(png2);

        expect(extracted).not.toBeNull();
        if (extracted) {
          expect(extracted.data.name).toBe(data2.name);
        }
      }),
      fcConfig
    );
  });

  it('embedded PNG is still valid base64', () => {
    fc.assert(
      fc.property(arbCharacterData, (data) => {
        const character = createCharacterFromData(data);
        const pngWithData = embedCharacterIntoPng(MINIMAL_PNG_BASE64, character);

        // Should be valid base64
        expect(() => atob(pngWithData)).not.toThrow();

        // Should start with PNG signature when decoded
        const decoded = atob(pngWithData);
        expect(decoded.charCodeAt(0)).toBe(0x89);
        expect(decoded.charCodeAt(1)).toBe(0x50); // P
        expect(decoded.charCodeAt(2)).toBe(0x4e); // N
        expect(decoded.charCodeAt(3)).toBe(0x47); // G
      }),
      fcConfig
    );
  });
});
