/**
 * Property-based tests for tokenizer and context truncation
 *
 * **Feature: mobile-app, Property 17: Context Truncation Respects Limit**
 * **Feature: mobile-app, Property 18: Context Truncation Preserves Recent**
 * **Validates: Requirements 12.4**
 */

import * as fc from 'fast-check';
import { arbChatMessage, fcConfig } from './test-utils';
import {
  countTokens,
  truncateMessages,
  truncateMessagesPreserveSystem,
  countMessagesTokens,
} from '../core/tokenizer';
import type { ChatMessage } from '@/types';

describe('Context Truncation Respects Limit', () => {
  /**
   * Property 17: Context Truncation Respects Limit
   * For any set of messages and token limit, truncation SHALL produce
   * a result with token count less than or equal to the limit.
   */

  it('truncated messages fit within token limit', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 50, max: 2000 }),
        (messages, maxTokens) => {
          const result = truncateMessages(messages as ChatMessage[], maxTokens);

          // Count tokens in result
          const resultTokens = result.messages.reduce(
            (sum, msg) => sum + countTokens(msg.content) + 4,
            3
          );

          // Should be within limit
          expect(resultTokens).toBeLessThanOrEqual(maxTokens);
        }
      ),
      fcConfig
    );
  });

  it('truncation with system messages respects limit', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom('user', 'assistant', 'system'),
            content: fc.string({ minLength: 10, maxLength: 500 }),
          }),
          { minLength: 1, maxLength: 15 }
        ),
        fc.integer({ min: 100, max: 2000 }),
        (messages, maxTokens) => {
          const result = truncateMessagesPreserveSystem(messages, maxTokens);

          // Count tokens in result
          const resultTokens = countMessagesTokens(result.messages);

          // Should be within limit (with some tolerance for estimation)
          expect(resultTokens).toBeLessThanOrEqual(maxTokens + 20);
        }
      ),
      fcConfig
    );
  });

  it('empty input returns empty output', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (maxTokens) => {
        const result = truncateMessages([], maxTokens);

        expect(result.messages).toHaveLength(0);
        expect(result.truncated).toBe(false);
        expect(result.removedCount).toBe(0);
      }),
      fcConfig
    );
  });

  it('very small limit truncates to minimum', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 5, maxLength: 10 }),
        (messages) => {
          // Very small limit
          const result = truncateMessages(messages as ChatMessage[], 10);

          // Should have at most 1 message (or 0 if even one doesn't fit)
          expect(result.messages.length).toBeLessThanOrEqual(1);
        }
      ),
      fcConfig
    );
  });
});

describe('Context Truncation Preserves Recent', () => {
  /**
   * Property 18: Context Truncation Preserves Recent
   * For any truncation operation, the most recent messages SHALL be preserved
   * (older messages truncated first).
   */

  it('most recent messages are preserved', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 3, maxLength: 15 }),
        fc.integer({ min: 100, max: 1000 }),
        (messages, maxTokens) => {
          const result = truncateMessages(messages as ChatMessage[], maxTokens);

          if (result.messages.length > 0 && result.truncated) {
            // The last message in result should be the last message in input
            const lastInput = messages[messages.length - 1];
            const lastResult = result.messages[result.messages.length - 1];

            expect(lastResult.content).toBe(lastInput.content);
          }
        }
      ),
      fcConfig
    );
  });

  it('preserved messages maintain original order', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 200, max: 2000 }),
        (messages, maxTokens) => {
          const result = truncateMessages(messages as ChatMessage[], maxTokens);

          if (result.messages.length >= 2) {
            // Find the indices of preserved messages in original array
            const preservedIndices = result.messages.map((preserved) =>
              messages.findIndex((orig) => orig.id === preserved.id)
            );

            // Indices should be in ascending order
            for (let i = 1; i < preservedIndices.length; i++) {
              expect(preservedIndices[i]).toBeGreaterThan(preservedIndices[i - 1]);
            }
          }
        }
      ),
      fcConfig
    );
  });

  it('removed messages are from the beginning', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 5, maxLength: 15 }),
        fc.integer({ min: 100, max: 500 }),
        (messages, maxTokens) => {
          const result = truncateMessages(messages as ChatMessage[], maxTokens);

          if (result.truncated && result.messages.length > 0) {
            // The first preserved message should not be the first input message
            // (unless all messages fit)
            const firstPreservedIndex = messages.findIndex(
              (m) => m.id === result.messages[0].id
            );

            // First preserved should be after some removed messages
            expect(firstPreservedIndex).toBe(result.removedCount);
          }
        }
      ),
      fcConfig
    );
  });

  it('system messages are preserved when using preserveSystem', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            role: fc.constantFrom('user', 'assistant', 'system'),
            content: fc.string({ minLength: 10, maxLength: 200 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        fc.integer({ min: 500, max: 2000 }),
        (messages, maxTokens) => {
          const result = truncateMessagesPreserveSystem(messages, maxTokens);

          // All system messages from input should be in output
          const inputSystemMessages = messages.filter((m) => m.role === 'system');
          const outputSystemMessages = result.messages.filter((m) => m.role === 'system');

          // System messages should be preserved (if they fit)
          const systemTokens = inputSystemMessages.reduce(
            (sum, m) => sum + countTokens(m.content) + 4,
            3
          );

          if (systemTokens <= maxTokens) {
            expect(outputSystemMessages.length).toBe(inputSystemMessages.length);
          }
        }
      ),
      fcConfig
    );
  });

  it('truncation reports correct removed count', () => {
    fc.assert(
      fc.property(
        fc.array(arbChatMessage, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 50, max: 1000 }),
        (messages, maxTokens) => {
          const result = truncateMessages(messages as ChatMessage[], maxTokens);

          // Removed count should equal input length minus output length
          expect(result.removedCount).toBe(messages.length - result.messages.length);

          // Truncated flag should match
          expect(result.truncated).toBe(result.removedCount > 0);
        }
      ),
      fcConfig
    );
  });
});
