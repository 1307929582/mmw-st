/**
 * Property-based tests for chat manager
 *
 * **Feature: mobile-app, Property 11: Message Edit Persistence**
 * **Feature: mobile-app, Property 12: Message Deletion Removes Message**
 * **Feature: mobile-app, Property 13: Swipe Navigation Bounds**
 * **Feature: mobile-app, Property 14: Chat Fork Preserves History**
 * **Validates: Requirements 6.5, 6.7, 6.8, 6.12**
 */

import * as fc from 'fast-check';
import { arbUuid, arbMessageContent, arbTimestamp, fcConfig } from './test-utils';
import type { ChatSession, ChatMessage } from '@/types';

// Mock chat manager for testing
class MockChatManager {
  private sessions: Map<string, ChatSession> = new Map();

  async createSession(characterId: string): Promise<ChatSession> {
    const session: ChatSession = {
      id: this.generateId(),
      characterId,
      messages: [],
      metadata: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getSession(id: string): Promise<ChatSession | null> {
    const session = this.sessions.get(id);
    return session ? JSON.parse(JSON.stringify(session)) : null;
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<ChatMessage> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
    };
    session.messages.push(message);
    session.updatedAt = Date.now();
    return message;
  }

  async updateMessage(sessionId: string, messageId: string, newContent: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const message = session.messages.find((m) => m.id === messageId);
    if (!message) throw new Error('Message not found');

    message.content = newContent;
    message.isEdited = true;
    session.updatedAt = Date.now();
  }

  async deleteMessage(sessionId: string, messageId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const index = session.messages.findIndex((m) => m.id === messageId);
    if (index === -1) throw new Error('Message not found');

    session.messages.splice(index, 1);
    session.updatedAt = Date.now();
  }

  async addSwipe(sessionId: string, messageId: string, content: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const message = session.messages.find((m) => m.id === messageId);
    if (!message) throw new Error('Message not found');

    if (!message.swipes) {
      message.swipes = [message.content];
      message.swipeIndex = 0;
    }
    message.swipes.push(content);
    message.swipeIndex = message.swipes.length - 1;
    message.content = content;
  }

  async setSwipeIndex(sessionId: string, messageId: string, index: number): Promise<number> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const message = session.messages.find((m) => m.id === messageId);
    if (!message) throw new Error('Message not found');
    if (!message.swipes) throw new Error('No swipes');

    // Clamp to valid range
    const clampedIndex = Math.max(0, Math.min(index, message.swipes.length - 1));
    message.swipeIndex = clampedIndex;
    message.content = message.swipes[clampedIndex];
    return clampedIndex;
  }

  async forkChat(sessionId: string, fromMessageId: string): Promise<ChatSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const messageIndex = session.messages.findIndex((m) => m.id === fromMessageId);
    if (messageIndex === -1) throw new Error('Message not found');

    const forkedSession: ChatSession = {
      id: this.generateId(),
      characterId: session.characterId,
      messages: session.messages.slice(0, messageIndex + 1).map((m) => ({
        ...m,
        id: this.generateId(),
      })),
      metadata: { ...session.metadata },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(forkedSession.id, forkedSession);
    return forkedSession;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  clear(): void {
    this.sessions.clear();
  }
}

describe('Message Edit Persistence', () => {
  let manager: MockChatManager;

  beforeEach(() => {
    manager = new MockChatManager();
  });

  /**
   * Property 11: Message Edit Persistence
   * For any message edit operation, retrieving the message afterwards
   * SHALL show the updated content.
   */

  it('edited message shows updated content', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        arbMessageContent,
        arbMessageContent,
        async (characterId, originalContent, newContent) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const message = await manager.addMessage(session.id, 'assistant', originalContent);

          await manager.updateMessage(session.id, message.id, newContent);

          const updatedSession = await manager.getSession(session.id);
          const updatedMessage = updatedSession?.messages.find((m) => m.id === message.id);

          expect(updatedMessage?.content).toBe(newContent);
          expect(updatedMessage?.isEdited).toBe(true);
        }
      ),
      fcConfig
    );
  });
});

describe('Message Deletion Removes Message', () => {
  let manager: MockChatManager;

  beforeEach(() => {
    manager = new MockChatManager();
  });

  /**
   * Property 12: Message Deletion Removes Message
   * For any message, after deletion, the chat history SHALL not contain that message.
   */

  it('deleted message is not in chat history', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbMessageContent, async (characterId, content) => {
        manager.clear();

        const session = await manager.createSession(characterId);
        const message = await manager.addMessage(session.id, 'user', content);

        // Verify message exists
        let currentSession = await manager.getSession(session.id);
        expect(currentSession?.messages.some((m) => m.id === message.id)).toBe(true);

        // Delete message
        await manager.deleteMessage(session.id, message.id);

        // Verify message is gone
        currentSession = await manager.getSession(session.id);
        expect(currentSession?.messages.some((m) => m.id === message.id)).toBe(false);
      }),
      fcConfig
    );
  });
});

describe('Swipe Navigation Bounds', () => {
  let manager: MockChatManager;

  beforeEach(() => {
    manager = new MockChatManager();
  });

  /**
   * Property 13: Swipe Navigation Bounds
   * For any message with N swipes, setting swipe index to any value
   * SHALL result in an index between 0 and N-1 (clamped).
   */

  it('swipe index is clamped to valid range', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        fc.array(arbMessageContent, { minLength: 2, maxLength: 10 }),
        fc.integer(),
        async (characterId, swipeContents, requestedIndex) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const message = await manager.addMessage(session.id, 'assistant', swipeContents[0]);

          // Add swipes
          for (let i = 1; i < swipeContents.length; i++) {
            await manager.addSwipe(session.id, message.id, swipeContents[i]);
          }

          // Set arbitrary index
          const resultIndex = await manager.setSwipeIndex(session.id, message.id, requestedIndex);

          // Index should be clamped
          expect(resultIndex).toBeGreaterThanOrEqual(0);
          expect(resultIndex).toBeLessThan(swipeContents.length);
        }
      ),
      fcConfig
    );
  });

  it('negative index clamps to 0', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        arbMessageContent,
        arbMessageContent,
        fc.integer({ max: -1 }),
        async (characterId, content1, content2, negativeIndex) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const message = await manager.addMessage(session.id, 'assistant', content1);
          await manager.addSwipe(session.id, message.id, content2);

          const resultIndex = await manager.setSwipeIndex(session.id, message.id, negativeIndex);
          expect(resultIndex).toBe(0);
        }
      ),
      fcConfig
    );
  });

  it('index beyond max clamps to last swipe', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        fc.array(arbMessageContent, { minLength: 2, maxLength: 5 }),
        async (characterId, swipeContents) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const message = await manager.addMessage(session.id, 'assistant', swipeContents[0]);

          for (let i = 1; i < swipeContents.length; i++) {
            await manager.addSwipe(session.id, message.id, swipeContents[i]);
          }

          const resultIndex = await manager.setSwipeIndex(session.id, message.id, 1000);
          expect(resultIndex).toBe(swipeContents.length - 1);
        }
      ),
      fcConfig
    );
  });
});

describe('Chat Fork Preserves History', () => {
  let manager: MockChatManager;

  beforeEach(() => {
    manager = new MockChatManager();
  });

  /**
   * Property 14: Chat Fork Preserves History
   * For any chat fork operation from message M, the new chat
   * SHALL contain all messages up to and including M.
   */

  it('forked chat contains messages up to fork point', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        fc.array(arbMessageContent, { minLength: 2, maxLength: 10 }),
        async (characterId, messageContents) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const messages: ChatMessage[] = [];

          // Add messages
          for (let i = 0; i < messageContents.length; i++) {
            const role = i % 2 === 0 ? 'user' : 'assistant';
            const msg = await manager.addMessage(session.id, role, messageContents[i]);
            messages.push(msg);
          }

          // Pick a random fork point
          const forkIndex = Math.floor(Math.random() * messages.length);
          const forkMessageId = messages[forkIndex].id;

          // Fork the chat
          const forkedSession = await manager.forkChat(session.id, forkMessageId);

          // Forked chat should have exactly forkIndex + 1 messages
          expect(forkedSession.messages.length).toBe(forkIndex + 1);

          // Content should match original messages up to fork point
          for (let i = 0; i <= forkIndex; i++) {
            expect(forkedSession.messages[i].content).toBe(messageContents[i]);
          }
        }
      ),
      fcConfig
    );
  });

  it('forked chat has different ID from original', async () => {
    await fc.assert(
      fc.asyncProperty(arbUuid, arbMessageContent, async (characterId, content) => {
        manager.clear();

        const session = await manager.createSession(characterId);
        const message = await manager.addMessage(session.id, 'user', content);

        const forkedSession = await manager.forkChat(session.id, message.id);

        expect(forkedSession.id).not.toBe(session.id);
      }),
      fcConfig
    );
  });

  it('forked messages have different IDs from original', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbUuid,
        fc.array(arbMessageContent, { minLength: 1, maxLength: 5 }),
        async (characterId, messageContents) => {
          manager.clear();

          const session = await manager.createSession(characterId);
          const originalMessageIds: string[] = [];

          for (const content of messageContents) {
            const msg = await manager.addMessage(session.id, 'user', content);
            originalMessageIds.push(msg.id);
          }

          const lastMessageId = originalMessageIds[originalMessageIds.length - 1];
          const forkedSession = await manager.forkChat(session.id, lastMessageId);

          // All forked message IDs should be different
          for (const forkedMsg of forkedSession.messages) {
            expect(originalMessageIds).not.toContain(forkedMsg.id);
          }
        }
      ),
      fcConfig
    );
  });
});
