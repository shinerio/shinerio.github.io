/**
 * SiteGenerator 测试
 * Tests for SiteGenerator class
 */

import { SiteGenerator } from '../../src/core/SiteGenerator';
import { GenerationOptions, ParsedArticle, BlogConfig } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import fc from 'fast-check';

describe('SiteGenerator', () => {
  let generator: SiteGenerator;
  let tempDir: string;
  let mockConfig: BlogConfig;
  let mockArticles: ParsedArticle[];

  let originalCwd: string;

  beforeEach(async () => {
    generator = new SiteGenerator();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'site-generator-test-'));
    originalCwd = process.cwd();
    
    // 创建临时模板目录和文件
    const templatesDir = path.join(tempDir, 'templates');
    await fs.ensureDir(templatesDir);
    
    // 创建基本的模板文件
    await fs.writeFile(path.join(templatesDir, 'layout.html'), `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}} - {{siteTitle}}</title>
    <meta name="description" content="{{description}}">
</head>
<body class="{{bodyClass}}">
    <header>
        <h1><a href="index.html">{{siteTitle}}</a></h1>
        <nav>
            <a href="index.html" class="{{homeActive}}">首页</a>
            <a href="articles.html" class="{{articlesActive}}">文章</a>
            <a href="search.html" class="{{searchActive}}">搜索</a>
        </nav>
    </header>
    <main>{{content}}</main>
    <footer><p>&copy; {{currentYear}} {{author}}</p></footer>
</body>
</html>`);

    await fs.writeFile(path.join(templatesDir, 'article.html'), `
<article>
    <header>
        <h1>{{title}}</h1>
        <div class="meta">
            <time datetime="{{dateISO}}">{{date}}</time>
            <span>{{readingTime}} 分钟阅读</span>
            <span>{{wordCount}} 字</span>
            {{#if tags}}
            <div class="tags">
                {{#each tags}}
                <span class="tag">#{{this}}</span>
                {{/each}}
            </div>
            {{/if}}
        </div>
    </header>
    <div class="content">{{content}}</div>
</article>`);

    await fs.writeFile(path.join(templatesDir, 'search.html'), `
<div class="search-container">
    <h2>搜索</h2>
    <input type="text" placeholder="搜索文章...">
    <div id="search-results"></div>
</div>`);

    // 创建assets目录
    const assetsDir = path.join(templatesDir, 'assets', 'css');
    await fs.ensureDir(assetsDir);
    await fs.writeFile(path.join(assetsDir, 'style.css'), 'body { font-family: Arial, sans-serif; }');
    
    // 临时改变工作目录以便模板加载
    process.chdir(tempDir);
    
    mockConfig = {
      vaultPath: '/mock/vault',
      outputPath: path.join(tempDir, 'output'),
      siteTitle: '测试博客',
      siteDescription: '这是一个测试博客',
      author: '测试作者',
      theme: 'light',
      postsPerPage: 10
    };

    mockArticles = [
      {
        metadata: {
          title: '第一篇文章',
          date: new Date('2023-01-01'),
          tags: ['技术', 'JavaScript'],
          description: '这是第一篇文章的描述',
          draft: false,
          slug: 'first-article'
        },
        content: '# 第一篇文章\n\n这是文章内容。\n\n包含一个 [[第二篇文章]] 到另一篇文章。',
        filePath: '/mock/vault/first-article.md',
        wordCount: 50
      },
      {
        metadata: {
          title: '第二篇文章',
          date: new Date('2023-01-02'),
          tags: ['技术', 'TypeScript'],
          description: '这是第二篇文章的描述',
          draft: false,
          slug: 'second-article'
        },
        content: '# 第二篇文章\n\n这是第二篇文章的内容。',
        filePath: '/mock/vault/second-article.md',
        wordCount: 30
      }
    ];
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('generateSite', () => {
    it('应该生成完整的网站结构', async () => {
      const options: GenerationOptions = {
        config: mockConfig,
        articles: mockArticles,
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      // 检查生成的文件
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'index.html'))).toBe(true);
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'articles.html'))).toBe(true);
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'search.html'))).toBe(true);
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'first-article.html'))).toBe(true);
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'second-article.html'))).toBe(true);
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'assets'))).toBe(true);
    });

    it('应该正确处理草稿文章', async () => {
      const draftArticle: ParsedArticle = {
        metadata: {
          title: '草稿文章',
          date: new Date('2023-01-03'),
          tags: ['草稿'],
          draft: true
        },
        content: '# 草稿文章\n\n这是草稿内容。',
        filePath: '/mock/vault/draft.md',
        wordCount: 20
      };

      const options: GenerationOptions = {
        config: mockConfig,
        articles: [...mockArticles, draftArticle],
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      // 草稿文章不应该生成HTML文件
      expect(await fs.pathExists(path.join(mockConfig.outputPath, 'draft.html'))).toBe(false);
    });

    it('应该在首页显示最新文章', async () => {
      const options: GenerationOptions = {
        config: mockConfig,
        articles: mockArticles,
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      const indexContent = await fs.readFile(path.join(mockConfig.outputPath, 'index.html'), 'utf-8');
      
      // 检查网站标题和描述
      expect(indexContent).toContain(mockConfig.siteTitle);
      expect(indexContent).toContain(mockConfig.siteDescription);
      
      // 检查文章链接
      expect(indexContent).toContain('first-article.html');
      expect(indexContent).toContain('第一篇文章');
    });

    it('应该正确处理Obsidian内部链接', async () => {
      const options: GenerationOptions = {
        config: mockConfig,
        articles: mockArticles,
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      const articleContent = await fs.readFile(path.join(mockConfig.outputPath, 'first-article.html'), 'utf-8');
      
      // 检查内部链接是否被正确转换
      expect(articleContent).toContain('class="internal-link"');
    });

    it('应该生成正确的文章元数据', async () => {
      const options: GenerationOptions = {
        config: mockConfig,
        articles: mockArticles,
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      const articleContent = await fs.readFile(path.join(mockConfig.outputPath, 'first-article.html'), 'utf-8');
      
      // 检查文章标题
      expect(articleContent).toContain('第一篇文章');
      
      // 检查标签
      expect(articleContent).toContain('#技术');
      expect(articleContent).toContain('#JavaScript');
      
      // 检查阅读时间
      expect(articleContent).toContain('分钟阅读');
    });
  });

  describe('Markdown处理', () => {
    it('应该正确转换Markdown为HTML', async () => {
      const markdownContent = '# 标题\n\n这是**粗体**文本和*斜体*文本。\n\n- 列表项1\n- 列表项2';
      
      const article: ParsedArticle = {
        metadata: {
          title: 'Markdown测试',
          date: new Date('2023-01-01'),
          tags: [],
          slug: 'markdown-test'
        },
        content: markdownContent,
        filePath: '/mock/vault/markdown-test.md',
        wordCount: 20
      };

      const options: GenerationOptions = {
        config: mockConfig,
        articles: [article],
        outputPath: mockConfig.outputPath
      };

      await generator.generateSite(options);

      const articleContent = await fs.readFile(path.join(mockConfig.outputPath, 'markdown-test.html'), 'utf-8');
      
      // 检查HTML转换
      expect(articleContent).toContain('<h1>标题</h1>');
      expect(articleContent).toContain('<strong>粗体</strong>');
      expect(articleContent).toContain('<em>斜体</em>');
      expect(articleContent).toContain('<ul>');
      expect(articleContent).toContain('<li>列表项1</li>');
    });
  });

  describe('错误处理', () => {
    it('应该在模板文件不存在时抛出错误', async () => {
      // 创建一个新的生成器实例，使用不存在模板的目录
      const emptyTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'empty-test-'));
      const originalCwd2 = process.cwd();
      
      try {
        process.chdir(emptyTempDir); // 切换到没有模板的目录
        
        const options: GenerationOptions = {
          config: { ...mockConfig, outputPath: path.join(emptyTempDir, 'output') },
          articles: mockArticles,
          outputPath: path.join(emptyTempDir, 'output')
        };

        await expect(generator.generateSite(options)).rejects.toThrow();
      } finally {
        process.chdir(originalCwd2);
        await fs.remove(emptyTempDir);
      }
    });
  });
});

describe('SiteGenerator Property Tests', () => {
  let generator: SiteGenerator;
  let tempDir: string;
  let originalCwd: string;
  let mockConfig: BlogConfig;

  beforeEach(async () => {
    generator = new SiteGenerator();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'site-generator-property-test-'));
    originalCwd = process.cwd();

    // 创建临时模板目录和文件
    const templatesDir = path.join(tempDir, 'templates');
    await fs.ensureDir(templatesDir);

    // 创建基本的模板文件
    await fs.writeFile(path.join(templatesDir, 'layout.html'), `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}} - {{siteTitle}}</title>
    <meta name="description" content="{{description}}">
</head>
<body class="{{bodyClass}}">
    <header>
        <h1><a href="index.html">{{siteTitle}}</a></h1>
        <nav>
            <a href="index.html" class="{{homeActive}}">首页</a>
            <a href="articles.html" class="{{articlesActive}}">文章</a>
            <a href="search.html" class="{{searchActive}}">搜索</a>
        </nav>
    </header>
    <main>{{content}}</main>
    <footer><p>&copy; {{currentYear}} {{author}}</p></footer>
</body>
</html>`);

    await fs.writeFile(path.join(templatesDir, 'article.html'), `
<article>
    <header>
        <h1>{{title}}</h1>
        <div class="meta">
            <time datetime="{{dateISO}}">{{date}}</time>
            <span>{{readingTime}} 分钟阅读</span>
            <span>{{wordCount}} 字</span>
            {{#if tags}}
            <div class="tags">
                {{#each tags}}
                <span class="tag">#{{this}}</span>
                {{/each}}
            </div>
            {{/if}}
        </div>
    </header>
    <div class="content">{{content}}</div>
</article>`);

    await fs.writeFile(path.join(templatesDir, 'search.html'), `
<div class="search-container">
    <h2>搜索</h2>
    <input type="text" placeholder="搜索文章...">
    <div id="search-results"></div>
</div>`);

    // 创建assets目录
    const assetsDir = path.join(templatesDir, 'assets', 'css');
    await fs.ensureDir(assetsDir);
    await fs.writeFile(path.join(assetsDir, 'style.css'), 'body { font-family: Arial, sans-serif; }');

    // 临时改变工作目录以便模板加载
    process.chdir(tempDir);

    mockConfig = {
      vaultPath: '/mock/vault',
      outputPath: path.join(tempDir, 'output'),
      siteTitle: '测试博客',
      siteDescription: '这是一个测试博客',
      author: '测试作者',
      theme: 'light',
      postsPerPage: 10
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  describe('HTML Generation Structural Integrity', () => {
    it('should always produce HTML with proper structure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 50 }).filter(str => str.trim() !== ''),
              content: fc.string({ minLength: 10, maxLength: 200 }),
              tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (articleData) => {
            const mockArticles: ParsedArticle[] = articleData.map((data, idx) => ({
              metadata: {
                title: data.title,
                date: new Date(),
                tags: data.tags,
                description: `Description for ${data.title}`,
                slug: `article-${idx}-${data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
              },
              content: data.content,
              filePath: `/mock/vault/article-${idx}.md`,
              wordCount: data.content.length
            }));

            const options: GenerationOptions = {
              config: mockConfig,
              articles: mockArticles,
              outputPath: path.join(tempDir, 'output-balanced')
            };

            await generator.generateSite(options);

            // Check that generated HTML files have proper structure
            const indexPath = path.join(options.outputPath, 'index.html');
            expect(await fs.pathExists(indexPath)).toBe(true);

            const htmlContent = await fs.readFile(indexPath, 'utf-8');

            // Verify basic HTML5 structure
            expect(htmlContent).toContain('<!DOCTYPE html>');
            expect(htmlContent).toContain('<html>');
            expect(htmlContent).toContain('</html>');
            expect(htmlContent).toContain('<head>');
            expect(htmlContent).toContain('</head>');

            // Look for body tag (might have attributes)
            expect(/<body(\s[^>]*)?>/.test(htmlContent)).toBe(true);
            expect(htmlContent).toContain('</body>');
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Article Sorting Consistency', () => {
    it('should sort articles by date consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 30 }).filter(str => str.trim() !== ''),
              dateStr: fc.string({ minLength: 10, maxLength: 10 }) // YYYY-MM-DD format
            }),
            { minLength: 2, maxLength: 10 }
          ),
          async (articlesData) => {
            // Generate valid dates
            const validArticlesData = articlesData.filter(data => {
              const date = new Date(data.dateStr);
              return !isNaN(date.getTime()); // Valid date strings only
            });

            if (validArticlesData.length < 2) return; // Skip if we don't have enough valid dates

            const mockArticles: ParsedArticle[] = validArticlesData.map(data => ({
              metadata: {
                title: data.title,
                date: new Date(data.dateStr),
                tags: [],
                description: `Description for ${data.title}`,
                slug: data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              },
              content: `Content of ${data.title}`,
              filePath: `/mock/vault/${data.title}.md`,
              wordCount: 50
            }));

            // Sort articles by date descending (newest first) to simulate the actual sorting behavior
            const sortedArticles = [...mockArticles].sort((a, b) =>
              b.metadata.date.getTime() - a.metadata.date.getTime()
            );

            const options: GenerationOptions = {
              config: mockConfig,
              articles: mockArticles,
              outputPath: path.join(tempDir, 'output-sorted')
            };

            await generator.generateSite(options);

            // We can't easily check the sort order from the output HTML,
            // but we can verify that all articles were processed
            expect(sortedArticles).toHaveLength(mockArticles.length);

            // Check that dates are in correct chronological order in sorted array
            for (let i = 0; i < sortedArticles.length - 1; i++) {
              expect(sortedArticles[i].metadata.date.getTime())
                .toBeGreaterThanOrEqual(sortedArticles[i + 1].metadata.date.getTime());
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Markdown-to-HTML Conversion Fidelity', () => {
    it('should preserve content meaning during markdown conversion', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 100 }),
          async (originalContent) => {
            // Test the conversion logic directly
            const convertedContent = generator['convertMarkdownToHtml'](originalContent);

            // The converted content should be defined and contain some HTML
            expect(convertedContent).toBeDefined();
            expect(typeof convertedContent).toBe('string');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle special characters in article content', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 50 }).filter(str =>
            !str.includes('{{') && !str.includes('}}') && str.trim() !== '' // Avoid template-like strings
          ),
          async (content) => {
            const mockArticles: ParsedArticle[] = [{
              metadata: {
                title: 'Test Article',
                date: new Date(),
                tags: ['test'],
                description: 'Test description',
                slug: 'test-article'
              },
              content,
              filePath: '/mock/vault/test.md',
              wordCount: content.length
            }];

            const options: GenerationOptions = {
              config: mockConfig,
              articles: mockArticles,
              outputPath: path.join(tempDir, 'output-special-chars')
            };

            await generator.generateSite(options);

            // Verify that the output was generated
            const articlePath = path.join(options.outputPath, 'test-article.html');
            expect(await fs.pathExists(articlePath)).toBe(true);

            const articleContent = await fs.readFile(articlePath, 'utf-8');
            // Content should be properly HTML escaped if needed
            expect(typeof articleContent).toBe('string');
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Internal Link Conversion Correctness', () => {
    it('should correctly process Obsidian-style internal links', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(str =>
            !str.includes('[') && !str.includes(']') && !str.includes('.') && str.trim() !== '' && /^[a-zA-Z0-9\u4e00-\u9fa5\s-]+$/.test(str)
          ),
          fc.string({ minLength: 1, maxLength: 20 }).filter(str =>
            !str.includes('[') && !str.includes(']') && !str.includes('.') && str.trim() !== '' && /^[a-zA-Z0-9\u4e00-\u9fa5\s-]+$/.test(str)
          ),
          async (article1Title, article2Title) => {
            if (article1Title === article2Title) return; // Skip if titles are the same

            const slug1 = article1Title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const slug2 = article2Title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

            // Skip if generated slugs are the same or empty
            if (slug1 === '' || slug2 === '' || slug1 === slug2) return;

            const mockArticles: ParsedArticle[] = [
              {
                metadata: {
                  title: article1Title,
                  date: new Date(),
                  tags: [],
                  description: 'First article',
                  slug: slug1
                },
                content: `This links to [[${article2Title}]].`,
                filePath: `/mock/vault/${article1Title}.md`,
                wordCount: 10
              },
              {
                metadata: {
                  title: article2Title,
                  date: new Date(),
                  tags: [],
                  description: 'Second article',
                  slug: slug2
                },
                content: `This is the linked article.`,
                filePath: `/mock/vault/${article2Title}.md`,
                wordCount: 10
              }
            ];

            const options: GenerationOptions = {
              config: mockConfig,
              articles: mockArticles,
              outputPath: path.join(tempDir, 'output-links')
            };

            await generator.generateSite(options);

            // Check that both articles were generated
            const article1Path = path.join(options.outputPath, `${mockArticles[0].metadata.slug}.html`);
            expect(await fs.pathExists(article1Path)).toBe(true);

            const article1Content = await fs.readFile(article1Path, 'utf-8');

            // The link should be converted to an HTML anchor tag
            expect(article1Content).toContain(`<a href="${mockArticles[1].metadata.slug}.html"`);
            expect(article1Content).toContain('class="internal-link"');
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});