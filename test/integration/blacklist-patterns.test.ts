/**
 * Integration tests for blacklist functionality
 * These tests verify the complete flow from configuration to file scanning with blacklist patterns
 */

import { ObsidianBlogGenerator } from '../../src';
import { ConfigManager } from '../../src/core/ConfigManager';
import { FileScanner } from '../../src/core/FileScanner';
import { createTempDir, cleanupTempDir, createTestMarkdownFile } from '../setup/test-setup';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('Blacklist Integration Tests', () => {
  let tempDir: string;
  let vaultDir: string;
  let outputDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await createTempDir();
    vaultDir = path.join(tempDir, 'vault');
    outputDir = path.join(tempDir, 'output');
    configPath = path.join(tempDir, 'blog.config.json');

    await fs.ensureDir(vaultDir);
  });

  afterEach(async () => {
    await cleanupTempDir(tempDir);
  });

  it('should exclude files based on blacklist configuration in full generation flow', async () => {
    // Setup vault with files
    await createTestMarkdownFile(path.join(vaultDir, 'included-post.md'), 'This should be included');
    await createTestMarkdownFile(path.join(vaultDir, 'draft-post.tmp.md'), 'This is a draft');
    await createTestMarkdownFile(path.join(vaultDir, 'secret-note.md'), 'Secret content');

    // Create config with blacklist
    const config = {
      vaultPath: vaultDir,
      outputPath: outputDir,
      siteTitle: 'Test Blog',
      author: 'Test Author',
      theme: 'auto',
      postsPerPage: 10,
      blacklist: ['*.tmp.md', 'secret-note.md']
    };

    await fs.writeJson(configPath, config);

    // Use ConfigManager to load the config
    const configManager = new ConfigManager();
    const loadedConfig = await configManager.loadConfig(configPath);

    // Verify config was loaded with blacklist
    expect(loadedConfig.blacklist).toEqual(['*.tmp.md', 'secret-note.md']);

    // Use FileScanner to scan with blacklist
    const fileScanner = new FileScanner();
    const scanResult = await fileScanner.scanVault(loadedConfig.vaultPath, loadedConfig.blacklist || []);

    // Verify only the included file is found
    expect(scanResult.files).toHaveLength(1);
    expect(scanResult.files[0]).toContain('included-post.md');
  });

  it('should exclude directories based on blacklist configuration', async () => {
    // Setup vault with nested directories
    await createTestMarkdownFile(path.join(vaultDir, 'public-post.md'), 'Public content');

    const draftsDir = path.join(vaultDir, 'drafts');
    await fs.ensureDir(draftsDir);
    await createTestMarkdownFile(path.join(draftsDir, 'draft1.md'), 'Draft 1');
    await createTestMarkdownFile(path.join(draftsDir, 'draft2.md'), 'Draft 2');

    const privateDir = path.join(vaultDir, 'private');
    await fs.ensureDir(privateDir);
    await createTestMarkdownFile(path.join(privateDir, 'private-note.md'), 'Private content');

    // Create config with directory blacklist
    const config = {
      vaultPath: vaultDir,
      outputPath: outputDir,
      siteTitle: 'Test Blog',
      author: 'Test Author',
      theme: 'auto',
      postsPerPage: 10,
      blacklist: ['drafts/', 'private/']
    };

    await fs.writeJson(configPath, config);

    // Use ConfigManager to load the config
    const configManager = new ConfigManager();
    const loadedConfig = await configManager.loadConfig(configPath);

    // Use FileScanner to scan with blacklist
    const fileScanner = new FileScanner();
    const scanResult = await fileScanner.scanVault(loadedConfig.vaultPath, loadedConfig.blacklist || []);

    // Verify only the public file is found
    expect(scanResult.files).toHaveLength(1);
    expect(scanResult.files[0]).toContain('public-post.md');
  });

  it('should support recursive pattern matching in full flow', async () => {
    // Setup nested structure
    await createTestMarkdownFile(path.join(vaultDir, 'top-level.md'), 'Top level post');

    const level1Dir = path.join(vaultDir, 'level1');
    await fs.ensureDir(level1Dir);
    await createTestMarkdownFile(path.join(level1Dir, 'level1-post.md'), 'Level 1 post');

    const level2Dir = path.join(level1Dir, 'level2');
    await fs.ensureDir(level2Dir);
    await createTestMarkdownFile(path.join(level2Dir, 'level2-post.md'), 'Level 2 post');
    await createTestMarkdownFile(path.join(level2Dir, 'private.md'), 'Private deep content');

    // Create config with recursive blacklist
    const config = {
      vaultPath: vaultDir,
      outputPath: outputDir,
      siteTitle: 'Test Blog',
      author: 'Test Author',
      theme: 'auto',
      postsPerPage: 10,
      blacklist: ['**/private.md']
    };

    await fs.writeJson(configPath, config);

    // Use ConfigManager to load the config
    const configManager = new ConfigManager();
    const loadedConfig = await configManager.loadConfig(configPath);

    // Use FileScanner to scan with blacklist
    const fileScanner = new FileScanner();
    const scanResult = await fileScanner.scanVault(loadedConfig.vaultPath, loadedConfig.blacklist || []);

    // Verify that private.md is excluded but other files are included
    expect(scanResult.files).toHaveLength(3); // top-level.md, level1-post.md, level2-post.md
    const fileBasenames = scanResult.files.map(f => path.basename(f));
    expect(fileBasenames).toContain('top-level.md');
    expect(fileBasenames).toContain('level1-post.md');
    expect(fileBasenames).toContain('level2-post.md');
    expect(fileBasenames).not.toContain('private.md');
  });

  it('should work with multiple different pattern types in the same blacklist', async () => {
    // Setup complex structure
    await createTestMarkdownFile(path.join(vaultDir, 'keep1.md'), 'Keep this');
    await createTestMarkdownFile(path.join(vaultDir, 'temp.tmp.md'), 'Temp file to exclude');

    const draftDir = path.join(vaultDir, 'drafts');
    await fs.ensureDir(draftDir);
    await createTestMarkdownFile(path.join(draftDir, 'draft.md'), 'Draft to exclude');

    const archiveDir = path.join(vaultDir, 'archive');
    await fs.ensureDir(archiveDir);
    await createTestMarkdownFile(path.join(archiveDir, 'old-post.md'), 'Old post to exclude');

    const workDir = path.join(vaultDir, 'work');
    await fs.ensureDir(workDir);
    await createTestMarkdownFile(path.join(workDir, 'work-note.md'), 'Work note to exclude');
    await createTestMarkdownFile(path.join(workDir, 'keep-this.md'), 'Keep this work file');

    // Create config with mixed pattern types
    const config = {
      vaultPath: vaultDir,
      outputPath: outputDir,
      siteTitle: 'Test Blog',
      author: 'Test Author',
      theme: 'auto',
      postsPerPage: 10,
      blacklist: [
        '*.tmp.md',        // Wildcard file pattern
        'drafts/',         // Directory pattern
        'archive/',        // Another directory
        '**/work-note.md'  // Recursive file pattern
      ]
    };

    await fs.writeJson(configPath, config);

    // Use ConfigManager to load the config
    const configManager = new ConfigManager();
    const loadedConfig = await configManager.loadConfig(configPath);

    // Use FileScanner to scan with blacklist
    const fileScanner = new FileScanner();
    const scanResult = await fileScanner.scanVault(loadedConfig.vaultPath, loadedConfig.blacklist || []);

    // Verify only the expected files remain
    expect(scanResult.files).toHaveLength(2); // keep1.md and work/keep-this.md
    const filePaths = scanResult.files.map(f => path.relative(vaultDir, f));
    expect(filePaths).toContain('keep1.md');
    expect(filePaths).toContain(path.join('work', 'keep-this.md'));
  });
});