/**
 * PNG Metadata Embedding/Extraction
 *
 * Handles embedding and extracting character data from PNG files.
 * Uses the tEXt chunk format with 'chara' keyword.
 */

import type { CharacterCard } from '@/types';
import { parseCharacterCard, exportToV2Card } from './parser';
import type { Character } from '@/types';

// PNG signature bytes
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

// Chunk type for character data
const CHARA_KEYWORD = 'chara';

/**
 * Extract character data from PNG base64 string
 */
export function extractCharacterFromPng(base64Data: string): CharacterCard | null {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Verify PNG signature
    for (let i = 0; i < PNG_SIGNATURE.length; i++) {
      if (bytes[i] !== PNG_SIGNATURE[i]) {
        throw new Error('Invalid PNG signature');
      }
    }

    // Parse chunks
    let offset = 8; // Skip signature
    while (offset < bytes.length) {
      // Read chunk length (4 bytes, big-endian)
      const length =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
      offset += 4;

      // Read chunk type (4 bytes)
      const type = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      offset += 4;

      // Check for tEXt chunk
      if (type === 'tEXt') {
        // Read chunk data
        const chunkData = bytes.slice(offset, offset + length);

        // Find null separator between keyword and text
        let nullIndex = 0;
        while (nullIndex < chunkData.length && chunkData[nullIndex] !== 0) {
          nullIndex++;
        }

        // Extract keyword
        const keyword = String.fromCharCode(...chunkData.slice(0, nullIndex));

        if (keyword === CHARA_KEYWORD) {
          // Extract text (base64 encoded character data)
          const textBytes = chunkData.slice(nullIndex + 1);
          const base64Text = String.fromCharCode(...textBytes);

          // Decode base64 to JSON
          const jsonString = atob(base64Text);

          // Parse character card
          return parseCharacterCard(jsonString);
        }
      }

      // Skip chunk data and CRC
      offset += length + 4;

      // Check for IEND chunk
      if (type === 'IEND') {
        break;
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting character from PNG:', error);
    return null;
  }
}

/**
 * Embed character data into PNG base64 string
 */
export function embedCharacterIntoPng(
  base64PngData: string,
  character: Character
): string {
  try {
    // Decode base64 to binary
    const binaryString = atob(base64PngData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Verify PNG signature
    for (let i = 0; i < PNG_SIGNATURE.length; i++) {
      if (bytes[i] !== PNG_SIGNATURE[i]) {
        throw new Error('Invalid PNG signature');
      }
    }

    // Export character to V2 card JSON
    const card = exportToV2Card(character);
    const jsonString = JSON.stringify(card);

    // Encode JSON to base64
    const base64Json = btoa(jsonString);

    // Create tEXt chunk
    const textChunk = createTextChunk(CHARA_KEYWORD, base64Json);

    // Find position to insert chunk (before IEND)
    let insertPosition = bytes.length;
    let offset = 8;
    while (offset < bytes.length) {
      const length =
        (bytes[offset] << 24) |
        (bytes[offset + 1] << 16) |
        (bytes[offset + 2] << 8) |
        bytes[offset + 3];
      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );

      if (type === 'IEND') {
        insertPosition = offset;
        break;
      }

      offset += 12 + length; // 4 (length) + 4 (type) + length + 4 (CRC)
    }

    // Remove existing chara tEXt chunk if present
    const cleanedBytes = removeExistingCharaChunk(bytes);

    // Find new insert position after cleaning
    offset = 8;
    insertPosition = cleanedBytes.length;
    while (offset < cleanedBytes.length) {
      const length =
        (cleanedBytes[offset] << 24) |
        (cleanedBytes[offset + 1] << 16) |
        (cleanedBytes[offset + 2] << 8) |
        cleanedBytes[offset + 3];
      const type = String.fromCharCode(
        cleanedBytes[offset + 4],
        cleanedBytes[offset + 5],
        cleanedBytes[offset + 6],
        cleanedBytes[offset + 7]
      );

      if (type === 'IEND') {
        insertPosition = offset;
        break;
      }

      offset += 12 + length;
    }

    // Create new PNG with embedded character data
    const newBytes = new Uint8Array(cleanedBytes.length + textChunk.length);
    newBytes.set(cleanedBytes.slice(0, insertPosition), 0);
    newBytes.set(textChunk, insertPosition);
    newBytes.set(cleanedBytes.slice(insertPosition), insertPosition + textChunk.length);

    // Convert back to base64
    let newBinaryString = '';
    for (let i = 0; i < newBytes.length; i++) {
      newBinaryString += String.fromCharCode(newBytes[i]);
    }

    return btoa(newBinaryString);
  } catch (error) {
    console.error('Error embedding character into PNG:', error);
    throw error;
  }
}

/**
 * Create a tEXt chunk
 */
function createTextChunk(keyword: string, text: string): Uint8Array {
  // Chunk data: keyword + null + text
  const keywordBytes = new TextEncoder().encode(keyword);
  const textBytes = new TextEncoder().encode(text);
  const dataLength = keywordBytes.length + 1 + textBytes.length;

  // Chunk: length (4) + type (4) + data + CRC (4)
  const chunk = new Uint8Array(12 + dataLength);

  // Length (big-endian)
  chunk[0] = (dataLength >> 24) & 0xff;
  chunk[1] = (dataLength >> 16) & 0xff;
  chunk[2] = (dataLength >> 8) & 0xff;
  chunk[3] = dataLength & 0xff;

  // Type: tEXt
  chunk[4] = 0x74; // t
  chunk[5] = 0x45; // E
  chunk[6] = 0x58; // X
  chunk[7] = 0x74; // t

  // Data: keyword + null + text
  chunk.set(keywordBytes, 8);
  chunk[8 + keywordBytes.length] = 0; // null separator
  chunk.set(textBytes, 9 + keywordBytes.length);

  // Calculate CRC
  const crcData = chunk.slice(4, 8 + dataLength);
  const crc = calculateCRC32(crcData);
  chunk[8 + dataLength] = (crc >> 24) & 0xff;
  chunk[8 + dataLength + 1] = (crc >> 16) & 0xff;
  chunk[8 + dataLength + 2] = (crc >> 8) & 0xff;
  chunk[8 + dataLength + 3] = crc & 0xff;

  return chunk;
}

/**
 * Remove existing chara tEXt chunk from PNG
 */
function removeExistingCharaChunk(bytes: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  let offset = 0;

  // Copy signature
  chunks.push(bytes.slice(0, 8));
  offset = 8;

  while (offset < bytes.length) {
    const length =
      (bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3];
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    const chunkEnd = offset + 12 + length;
    const chunk = bytes.slice(offset, chunkEnd);

    // Skip existing chara tEXt chunks
    if (type === 'tEXt') {
      const chunkData = bytes.slice(offset + 8, offset + 8 + length);
      let nullIndex = 0;
      while (nullIndex < chunkData.length && chunkData[nullIndex] !== 0) {
        nullIndex++;
      }
      const keyword = String.fromCharCode(...chunkData.slice(0, nullIndex));

      if (keyword !== CHARA_KEYWORD) {
        chunks.push(chunk);
      }
    } else {
      chunks.push(chunk);
    }

    offset = chunkEnd;

    if (type === 'IEND') {
      break;
    }
  }

  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
}

/**
 * Calculate CRC32 for PNG chunk
 */
function calculateCRC32(data: Uint8Array): number {
  // CRC32 lookup table
  const crcTable: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Check if PNG contains character data
 */
export function pngHasCharacterData(base64Data: string): boolean {
  return extractCharacterFromPng(base64Data) !== null;
}
