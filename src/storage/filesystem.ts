/**
 * File System Adapter
 *
 * Handles file operations for avatars, exports, backups, etc.
 */

import * as FileSystem from 'expo-file-system';

// Directory paths
const AVATARS_DIR = `${FileSystem.documentDirectory}avatars/`;
const EXPORTS_DIR = `${FileSystem.documentDirectory}exports/`;
const BACKUPS_DIR = `${FileSystem.documentDirectory}backups/`;
const TEMP_DIR = `${FileSystem.cacheDirectory}temp/`;

/**
 * Initialize file system directories
 */
export async function initFileSystem(): Promise<void> {
  const dirs = [AVATARS_DIR, EXPORTS_DIR, BACKUPS_DIR, TEMP_DIR];

  for (const dir of dirs) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}

// ============================================
// Avatar Operations
// ============================================

/**
 * Save an avatar image
 * @param id Character or persona ID
 * @param base64Data Base64 encoded image data
 * @returns File path
 */
export async function saveAvatar(id: string, base64Data: string): Promise<string> {
  const filePath = `${AVATARS_DIR}${id}.png`;
  await FileSystem.writeAsStringAsync(filePath, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return filePath;
}

/**
 * Get avatar file path
 */
export function getAvatarPath(id: string): string {
  return `${AVATARS_DIR}${id}.png`;
}

/**
 * Check if avatar exists
 */
export async function avatarExists(id: string): Promise<boolean> {
  const filePath = getAvatarPath(id);
  const info = await FileSystem.getInfoAsync(filePath);
  return info.exists;
}

/**
 * Read avatar as base64
 */
export async function readAvatar(id: string): Promise<string | null> {
  const filePath = getAvatarPath(id);
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists) return null;

  return await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Delete avatar
 */
export async function deleteAvatar(id: string): Promise<void> {
  const filePath = getAvatarPath(id);
  const info = await FileSystem.getInfoAsync(filePath);

  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}

// ============================================
// Export Operations
// ============================================

/**
 * Save export file
 * @param filename File name
 * @param content File content (string or base64)
 * @param encoding Encoding type
 * @returns File path
 */
export async function saveExport(
  filename: string,
  content: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<string> {
  const filePath = `${EXPORTS_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding:
      encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  return filePath;
}

/**
 * Read export file
 */
export async function readExport(
  filename: string,
  encoding: 'utf8' | 'base64' = 'utf8'
): Promise<string | null> {
  const filePath = `${EXPORTS_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists) return null;

  return await FileSystem.readAsStringAsync(filePath, {
    encoding:
      encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
}

/**
 * List export files
 */
export async function listExports(): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(EXPORTS_DIR);
  if (!info.exists) return [];

  return await FileSystem.readDirectoryAsync(EXPORTS_DIR);
}

/**
 * Delete export file
 */
export async function deleteExport(filename: string): Promise<void> {
  const filePath = `${EXPORTS_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}

// ============================================
// Backup Operations
// ============================================

/**
 * Save backup file
 */
export async function saveBackup(filename: string, content: string): Promise<string> {
  const filePath = `${BACKUPS_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return filePath;
}

/**
 * Read backup file
 */
export async function readBackup(filename: string): Promise<string | null> {
  const filePath = `${BACKUPS_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists) return null;

  return await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

/**
 * List backup files
 */
export async function listBackups(): Promise<string[]> {
  const info = await FileSystem.getInfoAsync(BACKUPS_DIR);
  if (!info.exists) return [];

  return await FileSystem.readDirectoryAsync(BACKUPS_DIR);
}

/**
 * Delete backup file
 */
export async function deleteBackup(filename: string): Promise<void> {
  const filePath = `${BACKUPS_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (info.exists) {
    await FileSystem.deleteAsync(filePath);
  }
}

// ============================================
// Temp File Operations
// ============================================

/**
 * Save temp file
 */
export async function saveTempFile(filename: string, content: string): Promise<string> {
  const filePath = `${TEMP_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(filePath, content, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return filePath;
}

/**
 * Read temp file
 */
export async function readTempFile(filename: string): Promise<string | null> {
  const filePath = `${TEMP_DIR}${filename}`;
  const info = await FileSystem.getInfoAsync(filePath);

  if (!info.exists) return null;

  return await FileSystem.readAsStringAsync(filePath, {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

/**
 * Clear temp directory
 */
export async function clearTempDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TEMP_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(TEMP_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true });
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get file info
 */
export async function getFileInfo(
  path: string
): Promise<{ exists: boolean; size?: number; modificationTime?: number }> {
  const info = await FileSystem.getInfoAsync(path);
  return {
    exists: info.exists,
    size: info.exists ? (info as FileSystem.FileInfo).size : undefined,
    modificationTime: info.exists ? (info as FileSystem.FileInfo).modificationTime : undefined,
  };
}

/**
 * Copy file
 */
export async function copyFile(from: string, to: string): Promise<void> {
  await FileSystem.copyAsync({ from, to });
}

/**
 * Move file
 */
export async function moveFile(from: string, to: string): Promise<void> {
  await FileSystem.moveAsync({ from, to });
}

/**
 * Get exports directory path
 */
export function getExportsDir(): string {
  return EXPORTS_DIR;
}

/**
 * Get backups directory path
 */
export function getBackupsDir(): string {
  return BACKUPS_DIR;
}
