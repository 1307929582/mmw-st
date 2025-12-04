/**
 * Tokenizer Module
 *
 * Provides token counting and context truncation for different LLM models.
 */

import type { ChatMessage } from '@/types';

/**
 * Supported tokenizer types
 */
export type TokenizerType = 'cl100k_base' | 'p50k_base' | 'llama' | 'simple';

/**
 * Simple character-based token estimation
 * Used as fallback when proper tokenizer is not available
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English
  // This is a simplification but works reasonably well
  return Math.ceil(text.length / 4);
}

/**
 * Count tokens in text using specified tokenizer
 * Note: In React Native, we use estimation since tiktoken requires WASM
 */
export function countTokens(text: string, _tokenizer: TokenizerType = 'cl100k_base'): number {
  // For now, use simple estimation
  // TODO: Integrate proper tokenizer when WASM support is available
  return estimateTokens(text);
}

/**
 * Count tokens in a message array
 */
export function countMessagesTokens(
  messages: Array<{ role: string; content: string }>,
  tokenizer: TokenizerType = 'cl100k_base'
): number {
  let total = 0;

  for (const msg of messages) {
    // Add overhead for message structure (role, separators)
    total += 4; // Approximate overhead per message
    total += countTokens(msg.content, tokenizer);
  }

  // Add overhead for the overall structure
  total += 3;

  return total;
}

/**
 * Truncate messages to fit within token limit
 * Preserves most recent messages, removes older ones
 */
export function truncateMessages(
  messages: ChatMessage[],
  maxTokens: number,
  tokenizer: TokenizerType = 'cl100k_base'
): { messages: ChatMessage[]; truncated: boolean; removedCount: number } {
  if (messages.length === 0) {
    return { messages: [], truncated: false, removedCount: 0 };
  }

  // Calculate tokens for all messages
  const messageTokens = messages.map((msg) => ({
    message: msg,
    tokens: countTokens(msg.content, tokenizer) + 4, // +4 for message overhead
  }));

  // Start from the end (most recent) and work backwards
  const result: ChatMessage[] = [];
  let totalTokens = 3; // Base overhead
  let removedCount = 0;

  for (let i = messageTokens.length - 1; i >= 0; i--) {
    const { message, tokens } = messageTokens[i];

    if (totalTokens + tokens <= maxTokens) {
      result.unshift(message);
      totalTokens += tokens;
    } else {
      removedCount++;
    }
  }

  return {
    messages: result,
    truncated: removedCount > 0,
    removedCount,
  };
}

/**
 * Truncate messages while preserving system messages
 * System messages are always kept, chat messages are truncated from oldest
 */
export function truncateMessagesPreserveSystem(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  tokenizer: TokenizerType = 'cl100k_base'
): { messages: Array<{ role: string; content: string }>; truncated: boolean } {
  // Separate system and non-system messages
  const systemMessages = messages.filter((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system');

  // Calculate system message tokens
  let systemTokens = 3; // Base overhead
  for (const msg of systemMessages) {
    systemTokens += countTokens(msg.content, tokenizer) + 4;
  }

  // Calculate remaining budget for chat messages
  const chatBudget = maxTokens - systemTokens;

  if (chatBudget <= 0) {
    // Not enough space even for system messages
    return { messages: systemMessages, truncated: chatMessages.length > 0 };
  }

  // Truncate chat messages
  const chatTokens = chatMessages.map((msg) => ({
    message: msg,
    tokens: countTokens(msg.content, tokenizer) + 4,
  }));

  const keptChat: Array<{ role: string; content: string }> = [];
  let usedTokens = 0;

  // Keep most recent messages
  for (let i = chatTokens.length - 1; i >= 0; i--) {
    const { message, tokens } = chatTokens[i];
    if (usedTokens + tokens <= chatBudget) {
      keptChat.unshift(message);
      usedTokens += tokens;
    }
  }

  // Combine: system messages first, then chat messages
  const result = [...systemMessages, ...keptChat];

  return {
    messages: result,
    truncated: keptChat.length < chatMessages.length,
  };
}

/**
 * Get recommended max tokens for a model
 */
export function getModelMaxTokens(model: string): number {
  const modelLower = model.toLowerCase();

  // OpenAI models
  if (modelLower.includes('gpt-4-turbo') || modelLower.includes('gpt-4o')) {
    return 128000;
  }
  if (modelLower.includes('gpt-4-32k')) {
    return 32768;
  }
  if (modelLower.includes('gpt-4')) {
    return 8192;
  }
  if (modelLower.includes('gpt-3.5-turbo-16k')) {
    return 16384;
  }
  if (modelLower.includes('gpt-3.5')) {
    return 4096;
  }

  // Claude models
  if (modelLower.includes('claude-3')) {
    return 200000;
  }
  if (modelLower.includes('claude-2')) {
    return 100000;
  }
  if (modelLower.includes('claude')) {
    return 100000;
  }

  // Default
  return 4096;
}

/**
 * Get tokenizer type for a model
 */
export function getTokenizerForModel(model: string): TokenizerType {
  const modelLower = model.toLowerCase();

  if (modelLower.includes('gpt-4') || modelLower.includes('gpt-3.5')) {
    return 'cl100k_base';
  }

  if (modelLower.includes('llama') || modelLower.includes('mistral')) {
    return 'llama';
  }

  return 'simple';
}
