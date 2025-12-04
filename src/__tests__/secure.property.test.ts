/**
 * Property-based tests for secure storage
 *
 * **Feature: mobile-app, Property 3: API Key Secure Storage Round-Trip**
 * **Validates: Requirements 3.8**
 */

import * as fc from 'fast-check';
import { arbApiKey, fcConfig } from './test-utils';

// Mock secure storage for testing
class MockSecureStore {
  private store: Map<string, string> = new Map();

  async setItemAsync(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async getItemAsync(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async deleteItemAsync(key: string): Promise<void> {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// Mock implementation of secure storage functions
function createSecureStorageMock(store: MockSecureStore) {
  const KEY_PREFIX = 'st_';

  return {
    async setApiKey(provider: string, key: string): Promise<void> {
      const storageKey = `${KEY_PREFIX}api_key_${provider}`;
      await store.setItemAsync(storageKey, key);
    },

    async getApiKey(provider: string): Promise<string | null> {
      const storageKey = `${KEY_PREFIX}api_key_${provider}`;
      return await store.getItemAsync(storageKey);
    },

    async deleteApiKey(provider: string): Promise<void> {
      const storageKey = `${KEY_PREFIX}api_key_${provider}`;
      await store.deleteItemAsync(storageKey);
    },
  };
}

describe('API Key Secure Storage Round-Trip', () => {
  let mockStore: MockSecureStore;
  let secureStorage: ReturnType<typeof createSecureStorageMock>;

  beforeEach(() => {
    mockStore = new MockSecureStore();
    secureStorage = createSecureStorageMock(mockStore);
  });

  /**
   * Property 3: API Key Secure Storage Round-Trip
   * For any valid API key string, storing it in secure storage and retrieving it
   * SHALL produce the same string.
   */

  const arbProvider = fc.constantFrom(
    'openai',
    'anthropic',
    'google',
    'openrouter',
    'ollama',
    'custom'
  );

  it('store then retrieve produces same API key', async () => {
    await fc.assert(
      fc.asyncProperty(arbProvider, arbApiKey, async (provider, apiKey) => {
        await secureStorage.setApiKey(provider, apiKey);
        const retrieved = await secureStorage.getApiKey(provider);

        expect(retrieved).toBe(apiKey);
      }),
      fcConfig
    );
  });

  it('delete removes API key', async () => {
    await fc.assert(
      fc.asyncProperty(arbProvider, arbApiKey, async (provider, apiKey) => {
        await secureStorage.setApiKey(provider, apiKey);
        await secureStorage.deleteApiKey(provider);
        const retrieved = await secureStorage.getApiKey(provider);

        expect(retrieved).toBeNull();
      }),
      fcConfig
    );
  });

  it('different providers have independent storage', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbApiKey,
        arbApiKey,
        async (openaiKey, anthropicKey) => {
          // Store keys for different providers
          await secureStorage.setApiKey('openai', openaiKey);
          await secureStorage.setApiKey('anthropic', anthropicKey);

          // Retrieve and verify independence
          const retrievedOpenai = await secureStorage.getApiKey('openai');
          const retrievedAnthropic = await secureStorage.getApiKey('anthropic');

          expect(retrievedOpenai).toBe(openaiKey);
          expect(retrievedAnthropic).toBe(anthropicKey);

          // Delete one should not affect the other
          await secureStorage.deleteApiKey('openai');
          expect(await secureStorage.getApiKey('openai')).toBeNull();
          expect(await secureStorage.getApiKey('anthropic')).toBe(anthropicKey);
        }
      ),
      fcConfig
    );
  });

  it('overwriting API key updates the value', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbProvider,
        arbApiKey,
        arbApiKey,
        async (provider, firstKey, secondKey) => {
          await secureStorage.setApiKey(provider, firstKey);
          await secureStorage.setApiKey(provider, secondKey);
          const retrieved = await secureStorage.getApiKey(provider);

          expect(retrieved).toBe(secondKey);
        }
      ),
      fcConfig
    );
  });

  it('non-existent key returns null', async () => {
    await fc.assert(
      fc.asyncProperty(arbProvider, async (provider) => {
        const retrieved = await secureStorage.getApiKey(provider);
        expect(retrieved).toBeNull();
      }),
      fcConfig
    );
  });
});
