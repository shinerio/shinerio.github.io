/**
 * ConfigManager单元测试
 * Unit tests for ConfigManager
 */

import { ConfigManager } from '../../src/core/ConfigManager';
import { BlogConfig, ConfigError } from '../../src/types';
import { createTempDir, cleanupTempDir } from '../setup/test-setup';
import * as fs from 'fs-extra';
import * as path from 'path';
import fc from 'fast-check';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(async () => {
    configManager = new ConfigManager();
    tempDir = await createTempDir();
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  describe('createDefaultConfig', () => {
    it('should create valid default configuration', () => {
      const config = configManager.createDefaultConfig();
      
      expect(config).toMatchObject({
        vaultPath: './vault',
        outputPath: './dist',
        siteTitle: 'My Obsidian Blog',
        siteDescription: 'A blog generated from Obsidian notes',
        author: '',
        theme: 'auto',
        postsPerPage: 10
      });
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config: BlogConfig = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light',
        postsPerPage: 5
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration with missing required fields', () => {
      const config = {
        vaultPath: '',
        outputPath: '',
        siteTitle: '',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 5
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('vaultPath 是必需的');
      expect(result.errors).toContain('outputPath 是必需的');
      expect(result.errors).toContain('siteTitle 是必需的');
    });

    it('should reject invalid theme', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'invalid' as any,
        postsPerPage: 5
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('theme 必须是 light、dark 或 auto');
    });

    it('should reject invalid postsPerPage', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 0
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('postsPerPage 必须大于 0');
    });

    it('should validate blacklist configuration properly', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 5,
        blacklist: ['*.tmp.md', 'drafts/', 'private/']
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject blacklist with invalid entries', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 5,
        blacklist: ['valid-pattern.md', '', '../forbidden']
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('blacklist[1] 不能是空字符串');
      expect(result.errors).toContain('blacklist[2] 包含非法路径遍历模式 \'../\'');
    });

    it('should allow empty blacklist array', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 5,
        blacklist: []
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow undefined blacklist', () => {
      const config = {
        vaultPath: tempDir,
        outputPath: './dist',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'light' as const,
        postsPerPage: 5
        // No blacklist property
      };

      const result = configManager.validateConfig(config);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('loadConfig', () => {
    it('should create default config when file does not exist', async () => {
      const configPath = path.join(tempDir, 'nonexistent.json');
      const config = await configManager.loadConfig(configPath);
      
      expect(config).toMatchObject(configManager.createDefaultConfig());
      expect(await fs.pathExists(configPath)).toBe(true);
    });

    it('should load existing valid config file', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const testConfig = {
        vaultPath: tempDir,
        outputPath: './test-output',
        siteTitle: 'Test Blog',
        siteDescription: 'Test Description',
        author: 'Test Author',
        theme: 'dark',
        postsPerPage: 15
      };

      await fs.writeJson(configPath, testConfig);
      const config = await configManager.loadConfig(configPath);
      
      expect(config).toMatchObject(testConfig);
    });

    it('should throw ConfigError for invalid config file', async () => {
      const configPath = path.join(tempDir, 'invalid-config.json');
      const invalidConfig = {
        vaultPath: '',
        outputPath: '',
        siteTitle: '',
        theme: 'invalid',
        postsPerPage: -1
      };

      await fs.writeJson(configPath, invalidConfig);
      
      await expect(configManager.loadConfig(configPath)).rejects.toThrow(ConfigError);
    });
  });

  describe('validatePath', () => {
    it('should validate existing readable path', () => {
      const result = configManager.validatePath(tempDir, 'read');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-existent path for reading', () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent');
      const result = configManager.validatePath(nonExistentPath, 'read');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('路径不存在');
    });

    it('should validate writable path', () => {
      const writablePath = path.join(tempDir, 'output');
      const result = configManager.validatePath(writablePath, 'write');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject empty path', () => {
      const result = configManager.validatePath('', 'read');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('路径不能为空');
    });

    it('should reject null path', () => {
      const result = configManager.validatePath(null as any, 'read');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('路径不能为空');
    });

    it('should reject undefined path', () => {
      const result = configManager.validatePath(undefined as any, 'read');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('路径不能为空');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const configPath = path.join(tempDir, 'saved-config.json');
      const config = configManager.createDefaultConfig();
      config.siteTitle = 'Saved Blog';

      await configManager.saveConfig(config, configPath);

      expect(await fs.pathExists(configPath)).toBe(true);
      const savedConfig = await fs.readJson(configPath);
      expect(savedConfig.siteTitle).toBe('Saved Blog');
    });

    it('should create directory if it does not exist', async () => {
      const configPath = path.join(tempDir, 'nested', 'dir', 'config.json');
      const config = configManager.createDefaultConfig();

      await configManager.saveConfig(config, configPath);

      expect(await fs.pathExists(configPath)).toBe(true);
    });
  });

  describe('Property Tests - Path Validation Consistency', () => {
    it('should consistently validate non-empty paths', () => {
      fc.assert(
        fc.property(
          fc.string().filter(str => str.length > 0 && !/\0/.test(str)), // Avoid null bytes which cause issues
          (str) => {
            const result = configManager.validatePath(str, 'read');
            // For non-empty string paths, should either be valid or have a specific error message
            // Empty path error should not occur for non-empty inputs
            if (result.error === '路径不能为空') {
              return false;
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate path type consistency (read vs write)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(str => /^[a-zA-Z0-9_-]+$/.test(str)),
          (validPathComponent) => {
            // Create a path that exists for testing
            const testPath = path.join(tempDir, validPathComponent);

            // Both read and write validation should not crash and should return consistent types
            const readResult = configManager.validatePath(testPath, 'read');
            const writeResult = configManager.validatePath(testPath, 'write');

            // Both should return objects with isValid boolean and optional error string
            return typeof readResult.isValid === 'boolean' &&
                   (readResult.error === undefined || typeof readResult.error === 'string') &&
                   typeof writeResult.isValid === 'boolean' &&
                   (writeResult.error === undefined || typeof writeResult.error === 'string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle special characters in paths consistently', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 30 }).filter(str =>
            !/[<>:"|?*]/.test(str) && // Avoid Windows forbidden chars
            !/\0/.test(str) &&         // Avoid null bytes
            str.trim() !== ''           // Avoid just whitespace
          ),
          (str) => {
            const testPath = path.join(tempDir, str);
            const result = configManager.validatePath(testPath, 'write');

            // Result should be properly structured regardless of path content
            return typeof result.isValid === 'boolean' &&
                   (result.error === undefined || typeof result.error === 'string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});