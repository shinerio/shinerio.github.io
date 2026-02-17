import { SiteGenerator } from '../../src/core/SiteGenerator';
import { GenerationOptions, ParsedArticle, BlogConfig } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Article TOC Generation', () => {
  let generator: SiteGenerator;
  let tempDir: string;
  let originalCwd: string;
  let mockConfig: BlogConfig;

  beforeEach(async () => {
    generator = new SiteGenerator();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'article-toc-test-'));
    originalCwd = process.cwd();

    const templatesDir = path.join(tempDir, 'templates');
    await fs.ensureDir(templatesDir);
    await fs.ensureDir(path.join(templatesDir, 'assets', 'css'));
    await fs.writeFile(path.join(templatesDir, 'assets', 'css', 'style.css'), 'body{}');

    await fs.writeFile(path.join(templatesDir, 'layout.html'), `
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body class="{{bodyClass}}"><main>{{content}}</main></body>
</html>`);

    await fs.writeFile(path.join(templatesDir, 'article.html'), `
<article>
  <section class="content">{{content}}</section>
  <aside class="toc">{{tableOfContents}}</aside>
</article>`);

    await fs.writeFile(path.join(templatesDir, 'search.html'), '<div>search</div>');

    process.chdir(tempDir);

    mockConfig = {
      vaultPath: '/mock/vault',
      outputPath: path.join(tempDir, 'output'),
      siteTitle: 'Test Blog',
      siteDescription: 'Test site',
      author: 'Tester',
      theme: 'light',
      postsPerPage: 10
    };
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.remove(tempDir);
  });

  it('builds H1/H2/H3 anchors and TOC links with unique ids', async () => {
    const article: ParsedArticle = {
      metadata: {
        title: 'TOC Test',
        date: new Date('2023-01-03'),
        tags: [],
        slug: 'toc-test'
      },
      content: '# Main\n\n## Section One\nA\n\n### Child\nB\n\n## Section One\nC\n\n#### Ignore Level 4\nD',
      filePath: '/mock/vault/toc-test.md',
      wordCount: 20
    };

    const options: GenerationOptions = {
      config: mockConfig,
      articles: [article],
      outputPath: mockConfig.outputPath
    };

    await generator.generateSite(options);

    const html = await fs.readFile(path.join(mockConfig.outputPath, 'toc-test.html'), 'utf-8');
    expect(html).toContain('<h1 id="main">Main</h1>');
    expect(html).toContain('<h2 id="section-one">Section One</h2>');
    expect(html).toContain('<h2 id="section-one-2">Section One</h2>');
    expect(html).toContain('<h3 id="child">Child</h3>');
    expect(html).toContain('<h4>Ignore Level 4</h4>');
    expect(html).toContain('href="#main"');
    expect(html).toContain('href="#section-one"');
    expect(html).toContain('href="#section-one-2"');
    expect(html).toContain('href="#child"');
    expect(html).not.toContain('href="#ignore-level-4"');
  });

  it('falls back to section-* ids when heading slug is empty', async () => {
    const article: ParsedArticle = {
      metadata: {
        title: 'Chinese TOC',
        date: new Date('2023-01-03'),
        tags: [],
        slug: 'chinese-toc'
      },
      content: '# Main\n\n## 中文标题\nA\n\n### 第二节\nB',
      filePath: '/mock/vault/chinese-toc.md',
      wordCount: 20
    };

    const options: GenerationOptions = {
      config: mockConfig,
      articles: [article],
      outputPath: mockConfig.outputPath
    };

    await generator.generateSite(options);

    const html = await fs.readFile(path.join(mockConfig.outputPath, 'chinese-toc.html'), 'utf-8');
    expect(html).toContain('<h2 id="section-1">中文标题</h2>');
    expect(html).toContain('<h3 id="section-2">第二节</h3>');
    expect(html).toContain('href="#section-1"');
    expect(html).toContain('href="#section-2"');
  });
});
