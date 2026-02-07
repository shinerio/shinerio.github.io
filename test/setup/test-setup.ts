/**
 * Test setup utilities
 * Shared utilities for tests
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary directory for testing
 */
export async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
  return tempDir;
}

/**
 * Clean up a temporary directory
 */
export async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    await fs.remove(tempDir);
  } catch (error) {
    // If the directory doesn't exist anymore, that's fine
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Create a test markdown file with optional frontmatter
 */
export async function createTestMarkdownFile(
  filePath: string,
  content: string,
  frontmatter?: Record<string, any>
): Promise<void> {
  let fileContent = '';

  if (frontmatter) {
    fileContent += '---\n';
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        fileContent += `${key}:\n`;
        value.forEach(item => {
          fileContent += `  - ${item}\n`;
        });
      } else if (typeof value === 'object' && value !== null) {
        fileContent += `${key}: ${JSON.stringify(value)}\n`;
      } else if (typeof value === 'string') {
        fileContent += `${key}: "${value}"\n`;
      } else {
        fileContent += `${key}: ${value}\n`;
      }
    }
    fileContent += '---\n\n';
  }

  fileContent += content;
  await fs.writeFile(filePath, fileContent);
}