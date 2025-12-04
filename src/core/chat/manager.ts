/**
 * Chat Manager
 *
 * Handles chat session CRUD, message management, swipes, and branching.
 */

import type { ChatSession, ChatMessage, ChatMetadata } from '@/types';
import {
  saveChatSession,
  getChatSession,
  getChatSessionsForCharacter,
  deleteChatSession,
  generateId,
  getCurrentTimestamp,
} from '@/storage/database';
import { incrementChatCount } from '@/core/character/manager';

/**
 * Create a new chat session
 */
export async function createChatSession(
  characterId: string,
  firstMessage?: string
): Promise<ChatSession> {
  const now = getCurrentTimestamp();
  const session: ChatSession = {
    id: generateId(),
    characterId,
    messages: [],
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  // Add first message if provided (usually the character's greeting)
  if (firstMessage) {
    session.messages.push({
      id: generateId(),
      role: 'assistant',
      content: firstMessage,
      timestamp: now,
    });
  }

  await saveChatSession(session);
  await incrementChatCount(characterId);

  return session;
}

/**
 * Get a chat session by ID
 */
export async function getChatSessionById(id: string): Promise<ChatSession | null> {
  return await getChatSession(id);
}

/**
 * Get all chat sessions for a character
 */
export async function getCharacterChats(characterId: string): Promise<ChatSession[]> {
  return await getChatSessionsForCharacter(characterId);
}

/**
 * Delete a chat session
 */
export async function deleteChatSessionById(id: string): Promise<void> {
  await deleteChatSession(id);
}

/**
 * Add a message to a chat session
 */
export async function addMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const message: ChatMessage = {
    id: generateId(),
    role,
    content,
    timestamp: getCurrentTimestamp(),
  };

  session.messages.push(message);
  session.updatedAt = getCurrentTimestamp();

  await saveChatSession(session);
  return message;
}

/**
 * Update a message content
 */
export async function updateMessage(
  sessionId: string,
  messageId: string,
  newContent: string
): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const messageIndex = session.messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  session.messages[messageIndex].content = newContent;
  session.messages[messageIndex].isEdited = true;
  session.updatedAt = getCurrentTimestamp();

  await saveChatSession(session);
  return session.messages[messageIndex];
}

/**
 * Delete a message from a chat session
 */
export async function deleteMessage(sessionId: string, messageId: string): Promise<void> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const messageIndex = session.messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  session.messages.splice(messageIndex, 1);
  session.updatedAt = getCurrentTimestamp();

  await saveChatSession(session);
}

/**
 * Add a swipe (alternative response) to a message
 */
export async function addSwipe(
  sessionId: string,
  messageId: string,
  content: string
): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const messageIndex = session.messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const message = session.messages[messageIndex];

  // Initialize swipes array if needed
  if (!message.swipes) {
    // First swipe: store original content as first swipe
    message.swipes = [message.content];
    message.swipeIndex = 0;
  }

  // Add new swipe
  message.swipes.push(content);
  // Switch to the new swipe
  message.swipeIndex = message.swipes.length - 1;
  message.content = content;

  session.updatedAt = getCurrentTimestamp();
  await saveChatSession(session);

  return message;
}

/**
 * Set the active swipe index for a message
 */
export async function setSwipeIndex(
  sessionId: string,
  messageId: string,
  index: number
): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const messageIndex = session.messages.findIndex((m) => m.id === messageId);
  if (messageIndex === -1) {
    throw new Error(`Message not found: ${messageId}`);
  }

  const message = session.messages[messageIndex];

  if (!message.swipes || message.swipes.length === 0) {
    throw new Error('Message has no swipes');
  }

  // Clamp index to valid range
  const clampedIndex = Math.max(0, Math.min(index, message.swipes.length - 1));

  message.swipeIndex = clampedIndex;
  message.content = message.swipes[clampedIndex];

  session.updatedAt = getCurrentTimestamp();
  await saveChatSession(session);

  return message;
}

/**
 * Navigate to next swipe
 */
export async function nextSwipe(sessionId: string, messageId: string): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const message = session.messages.find((m) => m.id === messageId);
  if (!message) {
    throw new Error(`Message not found: ${messageId}`);
  }

  if (!message.swipes || message.swipes.length <= 1) {
    return message;
  }

  const newIndex = Math.min((message.swipeIndex || 0) + 1, message.swipes.length - 1);
  return await setSwipeIndex(sessionId, messageId, newIndex);
}

/**
 * Navigate to previous swipe
 */
export async function prevSwipe(sessionId: string, messageId: string): Promise<ChatMessage> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const message = session.messages.find((m) => m.id === messageId);
  if (!message) {
    throw new Error(`Message not found: ${messageId}`);
  }

  if (!message.swipes || message.swipes.length <= 1) {
    return message;
  }

  const newIndex = Math.max((message.swipeIndex || 0) - 1, 0);
  return await setSwipeIndex(sessionId, messageId, newIndex);
}

/**
 * Fork a chat session from a specific message
 * Creates a new session with messages up to and including the specified message
 */
export async function forkChat(
  sessionId: string,
  fromMessageId: string
): Promise<ChatSession> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  const messageIndex = session.messages.findIndex((m) => m.id === fromMessageId);
  if (messageIndex === -1) {
    throw new Error(`Message not found: ${fromMessageId}`);
  }

  const now = getCurrentTimestamp();

  // Create new session with messages up to and including the fork point
  const forkedSession: ChatSession = {
    id: generateId(),
    characterId: session.characterId,
    groupId: session.groupId,
    messages: session.messages.slice(0, messageIndex + 1).map((m) => ({
      ...m,
      id: generateId(), // New IDs for forked messages
    })),
    metadata: { ...session.metadata },
    createdAt: now,
    updatedAt: now,
  };

  await saveChatSession(forkedSession);
  return forkedSession;
}

/**
 * Update chat metadata
 */
export async function updateMetadata(
  sessionId: string,
  metadata: Partial<ChatMetadata>
): Promise<ChatSession> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  session.metadata = { ...session.metadata, ...metadata };
  session.updatedAt = getCurrentTimestamp();

  await saveChatSession(session);
  return session;
}

/**
 * Get the last message in a chat session
 */
export async function getLastMessage(sessionId: string): Promise<ChatMessage | null> {
  const session = await getChatSession(sessionId);
  if (!session || session.messages.length === 0) {
    return null;
  }

  return session.messages[session.messages.length - 1];
}

/**
 * Get message count in a chat session
 */
export async function getMessageCount(sessionId: string): Promise<number> {
  const session = await getChatSession(sessionId);
  return session?.messages.length || 0;
}

/**
 * Clear all messages in a chat session (keep the session)
 */
export async function clearMessages(sessionId: string): Promise<ChatSession> {
  const session = await getChatSession(sessionId);
  if (!session) {
    throw new Error(`Chat session not found: ${sessionId}`);
  }

  session.messages = [];
  session.updatedAt = getCurrentTimestamp();

  await saveChatSession(session);
  return session;
}
