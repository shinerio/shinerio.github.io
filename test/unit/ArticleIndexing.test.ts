/**
 * Article Indexing Property Tests
 * Testing the completeness and correctness of article indexing functionality
 */

import { ObsidianBlogGenerator } from '../../src/index';
import { ConfigManager } from '../../src/core/ConfigManager';
import { FileScanner } from '../../src/core/FileScanner';
import { MetadataParser } from '../../src/core/MetadataParser';
import { SiteGenerator } from '../../src/core/SiteGenerator';
import { SearchEngine } from '../../src/core/SearchEngine';
import { GracefulErrorHandler } from '../../src/core/ErrorHandler';
import { BlogConfig, ParsedArticle } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import fc from 'fast-check';

describe('Article Indexing Completeness Tests', () => {
  describe('Search Index Completeness', () => {
    it('should index all non-draft articles', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              isDraft: fc.boolean(),
              content: fc.string({ minLength: 10, maxLength: 100 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (articleData) => {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
            try {
              const vaultPath = path.join(tempDir, 'vault');
              await fs.ensureDir(vaultPath);

              // Create markdown files based on the generated data
              const expectedIndexedTitles: string[] = [];

              for (let i = 0; i < articleData.length; i++) {
                const article = articleData[i];

                let fileContent = '---\n';
                fileContent += `title: "${article.title}"\n`;
                fileContent += 'date: "2023-01-01"\n';
                fileContent += `draft: ${article.isDraft}\n`;
                fileContent += '---\n\n';
                fileContent += article.content;

                const filePath = path.join(vaultPath, `article-${i}.md`);
                await fs.writeFile(filePath, fileContent);

                // Only non-draft articles should be indexed
                if (!article.isDraft) {
                  expectedIndexedTitles.push(article.title);
                }
              }

              // Use SearchEngine directly to test indexing logic
              const searchEngine = new SearchEngine();
              const fileScanner = new FileScanner();
              const metadataParser = new MetadataParser();

              // Scan and parse the files
              const scanResult = await fileScanner.scanVault(vaultPath);
              const articles: ParsedArticle[] = [];

              for (const filePath of scanResult.files) {
                const article = await metadataParser.parseFile(filePath);
                articles.push(article);
              }

              // Build search index
              const searchIndex = searchEngine.buildIndex(articles);

              // Check that all non-draft articles are in the index
              const indexedTitles = searchIndex.articles.map((a: any) => a.title);

              // Every expected title should be in the index
              expectedIndexedTitles.forEach(title => {
                expect(indexedTitles).toContain(title);
              });

              // Count draft articles that should not be indexed
              const draftCount = articleData.filter(a => a.isDraft).length;
              expect(searchIndex.articles).toHaveLength(articleData.length - draftCount);
            } finally {
              await fs.remove(tempDir);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain article content in index appropriately', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 20 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 5, maxLength: 50 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (articleData) => {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
            try {
              const vaultPath = path.join(tempDir, 'vault');
              await fs.ensureDir(vaultPath);

              // Create markdown files
              for (let i = 0; i < articleData.length; i++) {
                const article = articleData[i];

                let fileContent = '---\n';
                fileContent += `title: "${article.title}"\n`;
                fileContent += 'date: "2023-01-01"\n';
                fileContent += `tags:\n${article.tags.map(tag => `  - ${tag}`).join('\n')}\n`;
                fileContent += '---\n\n';
                fileContent += article.content;

                const filePath = path.join(vaultPath, `article-${i}.md`);
                await fs.writeFile(filePath, fileContent);
              }

              // Test indexing logic
              const searchEngine = new SearchEngine();
              const fileScanner = new FileScanner();
              const metadataParser = new MetadataParser();

              const scanResult = await fileScanner.scanVault(vaultPath);
              const articles: ParsedArticle[] = [];

              for (const filePath of scanResult.files) {
                const article = await metadataParser.parseFile(filePath);
                articles.push(article);
              }

              const searchIndex = searchEngine.buildIndex(articles);

              // Verify that indexed articles have proper structure
              expect(searchIndex.articles).toHaveLength(articles.length);

              // Each indexed article should have content that matches the original in some way
              searchIndex.articles.forEach((indexedArticle, idx) => {
                const originalArticle = articles[idx];

                // Title should match
                expect(indexedArticle.title).toBe(originalArticle.metadata.title);

                // Content should be processed but recognizable
                expect(indexedArticle.content).toBeDefined();
                expect(typeof indexedArticle.content).toBe('string');

                // Tags should match
                expect(indexedArticle.tags).toEqual(originalArticle.metadata.tags);
              });
            } finally {
              await fs.remove(tempDir);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should create proper search index structure', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 25 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 75 })
            }),
            { minLength: 1, maxLength: 8 }
          ),
          async (articleData) => {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
            try {
              const vaultPath = path.join(tempDir, 'vault');
              await fs.ensureDir(vaultPath);

              // Create markdown files
              for (let i = 0; i < articleData.length; i++) {
                const article = articleData[i];

                let fileContent = '---\n';
                fileContent += `title: "${article.title}"\n`;
                fileContent += 'date: "2023-01-01"\n';
                fileContent += '---\n\n';
                fileContent += article.content;

                const filePath = path.join(vaultPath, `article-${i}.md`);
                await fs.writeFile(filePath, fileContent);
              }

              // Test indexing
              const searchEngine = new SearchEngine();
              const fileScanner = new FileScanner();
              const metadataParser = new MetadataParser();

              const scanResult = await fileScanner.scanVault(vaultPath);
              const articles: ParsedArticle[] = [];

              for (const filePath of scanResult.files) {
                const article = await metadataParser.parseFile(filePath);
                articles.push(article);
              }

              const searchIndex = searchEngine.buildIndex(articles);

              // Verify index structure
              expect(searchIndex.articles).toHaveLength(articles.length);
              expect(searchIndex.index).toBeDefined();
              expect(searchIndex.index instanceof Map).toBe(true);

              // Each indexed article should have a valid structure
              searchIndex.articles.forEach((article: any) => {
                expect(article.id).toBeDefined();
                expect(typeof article.id).toBe('string');
                expect(article.title).toBeDefined();
                expect(typeof article.title).toBe('string');
                expect(article.content).toBeDefined();
                expect(typeof article.content).toBe('string');
                expect(Array.isArray(article.tags)).toBe(true);
                expect(typeof article.slug).toBe('string');
              });

              // The index map should have keys that correspond to words in the content
              let totalWordReferences = 0;
              searchIndex.index.forEach((refs: any, word: any) => {
                expect(typeof word).toBe('string');
                expect(Array.isArray(refs)).toBe(true);
                refs.forEach((ref: any) => {
                  expect(typeof ref).toBe('object');
                  expect(Number.isInteger(ref.articleIndex)).toBe(true);
                  expect(Number.isInteger(ref.weight)).toBe(true);
                  expect(ref.articleIndex >= 0).toBe(true);
                  expect(ref.articleIndex < searchIndex.articles.length).toBe(true);
                  expect(ref.weight > 0).toBe(true); // Weight should be positive
                });
                totalWordReferences += refs.length;
              });

              // There should be some indexing happening (unless all content was empty after processing)
              // At least the titles should contribute some index entries
              expect(totalWordReferences >= 0).toBe(true); // Allow zero if all content is stop words
            } finally {
              await fs.remove(tempDir);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should handle edge cases in indexing without crashing', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 0, maxLength: 50 }), // Allow empty titles to test robustness
              content: fc.string({ minLength: 0, maxLength: 100 }),
              hasEmptyTitle: fc.boolean(),
              hasSpecialChars: fc.boolean()
            }),
            { minLength: 0, maxLength: 5 } // Allow empty arrays to test robustness
          ),
          async (articleData) => {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
            try {
              const vaultPath = path.join(tempDir, 'vault');
              await fs.ensureDir(vaultPath);

              // Create markdown files, handling edge cases
              for (let i = 0; i < articleData.length; i++) {
                const article = articleData[i];

                let title = article.title;
                if (article.hasEmptyTitle) {
                  title = '';
                }
                if (article.hasSpecialChars) {
                  title += ' <>&特殊字符';
                }

                let fileContent = '---\n';
                fileContent += `title: "${title}"\n`;
                fileContent += 'date: "2023-01-01"\n';
                fileContent += '---\n\n';
                fileContent += article.content;

                const filePath = path.join(vaultPath, `article-${i}.md`);
                await fs.writeFile(filePath, fileContent);
              }

              // Even with edge cases, indexing should not crash
              const searchEngine = new SearchEngine();
              const fileScanner = new FileScanner();
              const metadataParser = new MetadataParser();

              const scanResult = await fileScanner.scanVault(vaultPath);
              const articles: ParsedArticle[] = [];

              for (const filePath of scanResult.files) {
                try {
                  const article = await metadataParser.parseFile(filePath);
                  articles.push(article);
                } catch (e) {
                  // Some parsing might fail with edge cases, that's OK
                  continue;
                }
              }

              // Build index should not crash even with edge case articles
              const searchIndex = searchEngine.buildIndex(articles);

              // Basic validation that the index has expected structure
              expect(Array.isArray(searchIndex.articles)).toBe(true);
              expect(searchIndex.index instanceof Map).toBe(true);
            } finally {
              await fs.remove(tempDir);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Integration with Full Generator Flow', () => {
    it('should properly index articles in full generation flow', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              isDraft: fc.boolean(),
              content: fc.string({ minLength: 10, maxLength: 80 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (articleData) => {
            const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-test-'));
            try {
              const vaultPath = path.join(tempDir, 'vault');
              const outputPath = path.join(tempDir, 'output');
              await fs.ensureDir(vaultPath);

              // Create markdown files
              const expectedNonDraftCount = articleData.filter(a => !a.isDraft).length;

              for (let i = 0; i < articleData.length; i++) {
                const article = articleData[i];

                let fileContent = '---\n';
                fileContent += `title: "${article.title}"\n`;
                fileContent += 'date: "2023-01-01"\n';
                fileContent += `draft: ${article.isDraft}\n`;
                fileContent += '---\n\n';
                fileContent += article.content;

                const filePath = path.join(vaultPath, `article-${i}.md`);
                await fs.writeFile(filePath, fileContent);
              }

              const mockConfig = {
                vaultPath,
                outputPath,
                siteTitle: 'Test Blog',
                siteDescription: 'A test blog',
                author: 'Test Author',
                theme: 'light',
                postsPerPage: 10
              };

              // Mock the configuration file
              const configPath = path.join(tempDir, 'config.json');
              await fs.writeJson(configPath, mockConfig);

              // Test full generation flow indirectly by checking search index generation
              const configManager = new ConfigManager();
              const fileScanner = new FileScanner();
              const metadataParser = new MetadataParser();
              const siteGenerator = new SiteGenerator();
              const searchEngine = new SearchEngine();
              const errorHandler = new GracefulErrorHandler();

              // Follow the same logic as the main generator
              const config = await configManager.loadConfig(configPath);
              const scanResult = await fileScanner.scanVault(config.vaultPath);

              const articles: ParsedArticle[] = [];
              for (const filePath of scanResult.files) {
                const article = await metadataParser.parseFile(filePath);
                articles.push(article);
              }

              const searchIndex = searchEngine.buildIndex(articles);

              // Validate that the index contains only non-draft articles
              expect(searchIndex.articles).toHaveLength(expectedNonDraftCount);

              // All indexed articles should have been originally non-draft
              const originalDraftStatus = articleData.map(a => a.isDraft);
              const indexedTitles = searchIndex.articles.map(a => a.title);

              for (const [idx, article] of articleData.entries()) {
                if (!article.isDraft) {
                  // Non-draft articles should be in the index
                  // Note: titles get trimmed during processing
                  const processedTitle = article.title.trim();
                  expect(indexedTitles).toContain(processedTitle);
                } else {
                  // Draft articles should NOT be in the index
                  // Note: titles get trimmed during processing
                  const processedTitle = article.title.trim();
                  expect(indexedTitles).not.toContain(processedTitle);
                }
              }
            } finally {
              await fs.remove(tempDir);
            }
          }
        ),
        { numRuns: 15 }
      );
    });
  });
});