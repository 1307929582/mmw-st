/**
 * Secure Storage Adapter
 *
 * Uses platform-specific secure storage (Keychain on iOS, Keystore on Android)
 * for storing sensitive data like API keys.
 */

import * as SecureStore from 'expo-secure-store';

const KEY_PREFIX = 'st_';

/**
 * Store an API key securely
 */
export async function setApiKey(provider: string, key: string): Promise<void> {
  const storageKey = `${KEY_PREFIX}api_key_${provider}`;
  await SecureStore.setItemAsync(storageKey, key);
}

/**
 * Retrieve an API key
 */
export async function getApiKey(provider: string): Promise<string | null> {
  const storageKey = `${KEY_PREFIX}api_key_${provider}`;
  return await SecureStore.getItemAsync(storageKey);
}

/**
 * Delete an API key
 */
export async function deleteApiKey(provider: string): Promise<void> {
  const storageKey = `${KEY_PREFIX}api_key_${provider}`;
  await SecureStore.deleteItemAsync(storageKey);
}

/**
 * Store a generic secret
 */
export async function setSecret(key: string, value: string): Promise<void> {
  const storageKey = `${KEY_PREFIX}secret_${key}`;
  await SecureStore.setItemAsync(storageKey, value);
}

/**
 * Retrieve a generic secret
 */
export async function getSecret(key: string): Promise<string | null> {
  const storageKey = `${KEY_PREFIX}secret_${key}`;
  return await SecureStore.getItemAsync(storageKey);
}

/**
 * Delete a generic secret
 */
export async function deleteSecret(key: string): Promise<void> {
  const storageKey = `${KEY_PREFIX}secret_${key}`;
  await SecureStore.deleteItemAsync(storageKey);
}

/**
 * Check if secure storage is available on this device
 */
export async function isSecureStorageAvailable(): Promise<boolean> {
  return await SecureStore.isAvailableAsync();
}

/**
 * Store API endpoint configuration (base URL, headers, etc.)
 * Note: API keys should be stored separately using setApiKey
 */
export async function setEndpointConfig(
  endpointId: string,
  config: { baseUrl: string; headers?: Record<string, string> }
): Promise<void> {
  const storageKey = `${KEY_PREFIX}endpoint_${endpointId}`;
  await SecureStore.setItemAsync(storageKey, JSON.stringify(config));
}

/**
 * Retrieve API endpoint configuration
 */
export async function getEndpointConfig(
  endpointId: string
): Promise<{ baseUrl: string; headers?: Record<string, string> } | null> {
  const storageKey = `${KEY_PREFIX}endpoint_${endpointId}`;
  const value = await SecureStore.getItemAsync(storageKey);
  if (!value) return null;
  return JSON.parse(value);
}

/**
 * Delete API endpoint configuration
 */
export async function deleteEndpointConfig(endpointId: string): Promise<void> {
  const storageKey = `${KEY_PREFIX}endpoint_${endpointId}`;
  await SecureStore.deleteItemAsync(storageKey);
}
