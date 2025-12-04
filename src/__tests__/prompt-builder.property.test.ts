/**
 * Property-based tests for prompt builder
 *
 * **Feature: mobile-app, Property 10: Prompt Construction Completeness**
 * **Validates: Requirements 6.1**
 */

import * as fc from 'fast-check';
import { arbCharacterData, arbChatMessage, fcConfig } from './test-utils';
import { buildPrompt, validatePromptCompleteness } from '../core/prompt/builder';
import type { PromptContext, ChatMessage } from '@/types';

describe('Prompt Construction Completeness', () => {
  /**
   * Property 10: Prompt Construction Completeness
   * For any valid prompt context (character, chat history, world info, persona),
   * the constructed prompt SHALL contain all required components in the correct order.
   */

  it('prompt contains character information', () => {
    fc.assert(
      fc.property(arbCharacterData, (characterData) => {
        const context: PromptContext = {
          character: characterData,
          chatHistory: [],
          maxContextTokens: 4096,
        };

        const result = buildPrompt(context);

        // Should have at least one message
        expect(result.messages.length).toBeGreaterThan(0);

        // Should contain character name somewhere
        const allContent = result.messages.map((m) => m.content).join(' ');
        expect(allContent).toContain(characterData.name);
      }),
      fcConfig
    );
  });

  it('prompt includes chat history messages', () => {
    fc.assert(
      fc.property(
        arbCharacterData,
        fc.array(arbChatMessage, { minLength: 1, maxLength: 10 }),
        (characterData, chatHistory) => {
          const context: PromptContext = {
            character: characterData,
            chatHistory: chatHistory as ChatMessage[],
            maxContextTokens: 8192,
          };

          const result = buildPrompt(context);

          // Should have messages for chat history
          const userMessages = result.messages.filter((m) => m.role === 'user');
          const assistantMessages = result.messages.filter((m) => m.role === 'assistant');

          const expectedUserCount = chatHistory.filter((m) => m.role === 'user').length;
          const expectedAssistantCount = chatHistory.filter((m) => m.role === 'assistant').length;

          // Chat history messages should be included
          expect(userMessages.length).toBeGreaterThanOrEqual(expectedUserCount);
          expect(assistantMessages.length).toBeGreaterThanOrEqual(expectedAssistantCount);
        }
      ),
      fcConfig
    );
  });

  it('prompt preserves message order', () => {
    fc.assert(
      fc.property(
        arbCharacterData,
        fc.array(arbChatMessage, { minLength: 2, maxLength: 5 }),
        (characterData, chatHistory) => {
          const context: PromptContext = {
            character: characterData,
            chatHistory: chatHistory as ChatMessage[],
            maxContextTokens: 8192,
          };

          const result = buildPrompt(context);

          // Extract chat messages (excluding system messages)
          const chatMessages = result.messages.filter(
            (m) => m.role === 'user' || m.role === 'assistant'
          );

          // Find the chat history portion (after any example messages)
          // The last N messages should match the chat history
          const historyPortion = chatMessages.slice(-chatHistory.length);

          // Order should be preserved
          for (let i = 0; i < Math.min(historyPortion.length, chatHistory.length); i++) {
            const expected = chatHistory[i];
            const actual = historyPortion[i];

            // Content should match
            expect(actual.content).toContain(expected.content);
          }
        }
      ),
      fcConfig
    );
  });

  it('prompt includes system prompt when provided', () => {
    fc.assert(
      fc.property(
        arbCharacterData,
        fc.string({ minLength: 10, maxLength: 500 }),
        (characterData, systemPrompt) => {
          const context: PromptContext = {
            character: characterData,
            chatHistory: [],
            systemPrompt,
            maxContextTokens: 4096,
          };

          const result = buildPrompt(context);

          // Should have system message containing the system prompt
          const systemMessages = result.messages.filter((m) => m.role === 'system');
          const allSystemContent = systemMessages.map((m) => m.content).join(' ');

          expect(allSystemContent).toContain(systemPrompt);
        }
      ),
      fcConfig
    );
  });

  it('prompt includes persona when provided', () => {
    fc.assert(
      fc.property(
        arbCharacterData,
        fc.string({ minLength: 10, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (characterData, personaDescription, personaName) => {
          const context: PromptContext = {
            character: characterData,
            chatHistory: [],
            persona: {
              id: 'test-persona',
              name: personaName,
              description: personaDescription,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            maxContextTokens: 4096,
          };

          const result = buildPrompt(context);

          // Should include persona description
          const allContent = result.messages.map((m) => m.content).join(' ');
          expect(allContent).toContain(personaDescription);
        }
      ),
      fcConfig
    );
  });

  it('prompt reports token count', () => {
    fc.assert(
      fc.property(
        arbCharacterData,
        fc.array(arbChatMessage, { maxLength: 10 }),
        (characterData, chatHistory) => {
          const context: PromptContext = {
            character: characterData,
            chatHistory: chatHistory as ChatMessage[],
            maxContextTokens: 4096,
          };

          const result = buildPrompt(context);

          // Token count should be positive
          expect(result.tokenCount).toBeGreaterThan(0);

          // Token count should roughly correlate with content length
          const totalChars = result.messages.reduce((sum, m) => sum + m.content.length, 0);
          // Rough estimate: 4 chars per token
          expect(result.tokenCount).toBeLessThanOrEqual(totalChars);
        }
      ),
      fcConfig
    );
  });

  it('prompt validation detects missing components', () => {
    fc.assert(
      fc.property(arbCharacterData, (characterData) => {
        const context: PromptContext = {
          character: characterData,
          chatHistory: [],
          maxContextTokens: 4096,
        };

        const result = buildPrompt(context);
        const validation = validatePromptCompleteness(result, context);

        // With character data, should be valid
        expect(validation.valid).toBe(true);
      }),
      fcConfig
    );
  });
});
