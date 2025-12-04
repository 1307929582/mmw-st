/**
 * Prompt Builder
 *
 * Constructs prompts for LLM APIs from character data, chat history,
 * world info, and other context.
 */

import type {
  CharacterData,
  ChatMessage,
  PromptContext,
  PromptResult,
  WorldInfoBook,
  WorldInfoEntry,
  Persona,
  AuthorsNote,
  InstructTemplate,
} from '@/types';

/**
 * Build a complete prompt from context
 */
export function buildPrompt(context: PromptContext): PromptResult {
  const {
    character,
    chatHistory,
    worldInfo,
    persona,
    authorsNote,
    systemPrompt,
    instructTemplate,
    maxContextTokens,
  } = context;

  // Build system message
  const systemContent = buildSystemMessage(character, persona, systemPrompt);

  // Scan for world info entries to inject
  const worldInfoContent = worldInfo
    ? scanAndCollectWorldInfo(chatHistory, worldInfo)
    : '';

  // Build messages array
  const messages: Array<{ role: string; content: string }> = [];

  // Add system message
  if (systemContent || worldInfoContent) {
    let fullSystemContent = systemContent;
    if (worldInfoContent) {
      fullSystemContent += '\n\n' + worldInfoContent;
    }
    messages.push({ role: 'system', content: fullSystemContent });
  }

  // Add character description and scenario as context
  const characterContext = buildCharacterContext(character);
  if (characterContext) {
    messages.push({ role: 'system', content: characterContext });
  }

  // Add example messages if present
  if (character.mes_example) {
    const examples = parseExampleMessages(character.mes_example, character.name);
    messages.push(...examples);
  }

  // Add chat history
  for (let i = 0; i < chatHistory.length; i++) {
    const msg = chatHistory[i];
    let content = msg.content;

    // Inject author's note at specified depth
    if (authorsNote && authorsNote.position === 'in_chat') {
      const depthFromEnd = chatHistory.length - 1 - i;
      if (depthFromEnd === authorsNote.depth) {
        content = injectAuthorsNote(content, authorsNote);
      }
    }

    messages.push({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content,
    });
  }

  // Apply instruct template if provided
  const finalMessages = instructTemplate
    ? applyInstructTemplate(messages, instructTemplate)
    : messages;

  // Estimate token count (rough approximation: 4 chars per token)
  const totalChars = finalMessages.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);

  // Check if truncation is needed
  const truncated = estimatedTokens > maxContextTokens;

  return {
    messages: finalMessages,
    tokenCount: estimatedTokens,
    truncated,
  };
}

/**
 * Build system message from character and persona
 */
function buildSystemMessage(
  character: CharacterData,
  persona?: Persona,
  customSystemPrompt?: string
): string {
  const parts: string[] = [];

  // Custom system prompt takes priority
  if (customSystemPrompt) {
    parts.push(customSystemPrompt);
  }

  // Character's system prompt
  if (character.system_prompt) {
    parts.push(character.system_prompt);
  }

  // Persona description
  if (persona?.description) {
    parts.push(`User's persona: ${persona.description}`);
  }

  return parts.join('\n\n');
}

/**
 * Build character context (description, personality, scenario)
 */
function buildCharacterContext(character: CharacterData): string {
  const parts: string[] = [];

  if (character.description) {
    parts.push(`Character: ${character.name}\n${character.description}`);
  }

  if (character.personality) {
    parts.push(`Personality: ${character.personality}`);
  }

  if (character.scenario) {
    parts.push(`Scenario: ${character.scenario}`);
  }

  return parts.join('\n\n');
}

/**
 * Parse example messages from mes_example format
 */
function parseExampleMessages(
  mesExample: string,
  characterName: string
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  if (!mesExample.trim()) {
    return messages;
  }

  // Split by message markers
  const lines = mesExample.split('\n');
  let currentRole: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check for role markers
    const userMatch = line.match(/^<START>$/i);
    const charMatch = line.match(new RegExp(`^${characterName}:`, 'i'));
    const userMsgMatch = line.match(/^{{user}}:|^User:/i);

    if (userMatch) {
      // Save previous message
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim(),
        });
      }
      currentRole = null;
      currentContent = [];
    } else if (charMatch) {
      // Save previous message
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim(),
        });
      }
      currentRole = 'assistant';
      currentContent = [line.replace(charMatch[0], '').trim()];
    } else if (userMsgMatch) {
      // Save previous message
      if (currentRole && currentContent.length > 0) {
        messages.push({
          role: currentRole,
          content: currentContent.join('\n').trim(),
        });
      }
      currentRole = 'user';
      currentContent = [line.replace(userMsgMatch[0], '').trim()];
    } else if (currentRole) {
      currentContent.push(line);
    }
  }

  // Save last message
  if (currentRole && currentContent.length > 0) {
    messages.push({
      role: currentRole,
      content: currentContent.join('\n').trim(),
    });
  }

  return messages;
}

/**
 * Scan chat history and collect matching world info entries
 */
function scanAndCollectWorldInfo(
  chatHistory: ChatMessage[],
  worldInfoBooks: WorldInfoBook[]
): string {
  const matchedEntries: WorldInfoEntry[] = [];

  // Combine recent messages for scanning
  const recentMessages = chatHistory.slice(-10);
  const scanText = recentMessages.map((m) => m.content).join(' ').toLowerCase();

  for (const book of worldInfoBooks) {
    for (const entry of book.entries) {
      if (!entry.enabled) continue;

      // Check if any keyword matches
      const matches = entry.keys.some((key) => {
        if (entry.useRegex) {
          try {
            const regex = new RegExp(key, entry.caseSensitive ? '' : 'i');
            return regex.test(scanText);
          } catch {
            return false;
          }
        } else {
          const searchKey = entry.caseSensitive ? key : key.toLowerCase();
          const searchText = entry.caseSensitive ? scanText : scanText.toLowerCase();

          if (entry.matchWholeWords) {
            const regex = new RegExp(`\\b${escapeRegex(searchKey)}\\b`, 'i');
            return regex.test(searchText);
          }
          return searchText.includes(searchKey);
        }
      });

      if (matches || entry.constant) {
        matchedEntries.push(entry);
      }
    }
  }

  // Sort by order/priority
  matchedEntries.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Combine content
  return matchedEntries.map((e) => e.content).join('\n\n');
}

/**
 * Inject author's note into content
 */
function injectAuthorsNote(content: string, authorsNote: AuthorsNote): string {
  const noteText = `[Author's Note: ${authorsNote.content}]`;

  switch (authorsNote.position) {
    case 'before_char':
      return noteText + '\n' + content;
    case 'after_char':
      return content + '\n' + noteText;
    default:
      return content;
  }
}

/**
 * Apply instruct template to messages
 */
function applyInstructTemplate(
  messages: Array<{ role: string; content: string }>,
  template: InstructTemplate
): Array<{ role: string; content: string }> {
  return messages.map((msg) => {
    let content = msg.content;

    switch (msg.role) {
      case 'system':
        content = template.systemPromptPrefix + content + template.systemPromptSuffix;
        break;
      case 'user':
        content = template.userPrefix + content + template.userSuffix;
        break;
      case 'assistant':
        content = template.assistantPrefix + content + template.assistantSuffix;
        break;
    }

    if (template.wrapInNewlines) {
      content = '\n' + content + '\n';
    }

    return { role: msg.role, content };
  });
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if prompt contains all required components
 */
export function validatePromptCompleteness(
  result: PromptResult,
  context: PromptContext
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check for character name in messages
  const hasCharacterContext = result.messages.some(
    (m) => m.content.includes(context.character.name)
  );
  if (!hasCharacterContext && context.character.name) {
    missing.push('character_name');
  }

  // Check for chat history
  if (context.chatHistory.length > 0) {
    const hasUserMessages = result.messages.some((m) => m.role === 'user');
    if (!hasUserMessages) {
      missing.push('chat_history');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}
