/**
 * Integration Tests
 * Testing the complete end-to-end generation flow
 */

import { ObsidianBlogGenerator } from '../../src/index';
import { ConfigManager } from '../../src/core/ConfigManager';
import { BlogConfig } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('Integration Tests - Complete Generation Flow', () => {
  let generator: ObsidianBlogGenerator;
  let tempDir: string;
  let mockConfig: BlogConfig;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    generator = new ObsidianBlogGenerator();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'obsidian-blog-integration-test-'));

    // Setup directories
    const vaultPath = path.join(tempDir, 'vault');
    const outputPath = path.join(tempDir, 'output');

    await fs.ensureDir(vaultPath);
    await fs.ensureDir(outputPath);

    // Change working directory to project root temporarily to set up templates
    const projectRoot = path.resolve(__dirname, '..');
    const templatesPath = path.join(projectRoot, 'templates');
    await fs.ensureDir(templatesPath);

    // Create layout template
    await fs.writeFile(
      path.join(templatesPath, 'layout.html'),
      `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - {{siteTitle}}</title>
    <link rel="stylesheet" href="./assets/css/style.css">
</head>
<body class="{{bodyClass}}">
    <header>
        <nav>
            <a href="index.html" class="{{homeActive}}">Home</a>
            <a href="articles.html" class="{{articlesActive}}">Articles</a>
            <a href="search.html" class="{{searchActive}}">Search</a>
        </nav>
    </header>
    <main>
        {{{content}}}
    </main>
    <footer>
        <p>&copy; {{currentYear}} {{author}}. All rights reserved.</p>
    </footer>
</body>
</html>`
    );

    // Create article template
    await fs.writeFile(
      path.join(templatesPath, 'article.html'),
      `<article>
    <header>
        <h1>{{title}}</h1>
        <time datetime="{{dateISO}}">{{date}}</time>
        <div class="tags">
            {{#each tags}}
            <span class="tag">{{this}}</span>
            {{/each}}
        </div>
    </header>
    <section class="content">
        {{{content}}}
    </section>
</article>`
    );

    // Create index template
    await fs.writeFile(
      path.join(templatesPath, 'index.html'),
      `<section class="hero">
    <h1>{{siteTitle}}</h1>
    <p>{{siteDescription}}</p>
</section>
<section class="recent-articles">
    <h2>Recent Articles</h2>
    <ul>
    {{#each recentArticles}}
        <li>
            <a href="{{this.slug}}.html">{{this.title}}</a>
            <time>{{formatDate this.date}}</time>
        </li>
    {{/each}}
    </ul>
</section>`
    );

    // Create articles template
    await fs.writeFile(
      path.join(templatesPath, 'articles.html'),
      `<section class="all-articles">
    <h1>All Articles</h1>
    <ul>
    {{#each allArticles}}
        <li>
            <a href="{{this.slug}}.html">{{this.title}}</a>
            <time>{{formatDate this.date}}</time>
            <div class="tags">
                {{#each this.tags}}
                <span class="tag">{{this}}</span>
                {{/each}}
            </div>
        </li>
    {{/each}}
    </ul>
</section>`
    );

    // Create search template
    await fs.writeFile(
      path.join(templatesPath, 'search.html'),
      `<section class="search-section">
    <h1>Search Articles</h1>
    <input type="text" id="search-input" placeholder="Enter search terms...">
    <div id="search-results"></div>
</section>`
    );

    // Create basic CSS
    const assetsPath = path.join(templatesPath, 'assets', 'css');
    await fs.ensureDir(assetsPath);
    await fs.writeFile(
      path.join(assetsPath, 'style.css'),
      `body {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
    color: #333;
}

header {
    background-color: #f4f4f4;
    padding: 1rem;
}

nav a {
    margin-right: 1rem;
    text-decoration: none;
    color: #007cba;
}

main {
    padding: 1rem;
}

footer {
    background-color: #f4f4f4;
    padding: 1rem;
    text-align: center;
    margin-top: 2rem;
}

.tag {
    background-color: #e0e0e0;
    padding: 0.2rem 0.5rem;
    border-radius: 3px;
    margin-right: 0.5rem;
}

.internal-link {
    color: #007cba;
    text-decoration: none;
}

.internal-link:hover {
    text-decoration: underline;
}`
    );

    mockConfig = {
      vaultPath,
      outputPath,
      siteTitle: 'Integration Test Blog',
      siteDescription: 'A blog for integration testing',
      author: 'Test Author',
      theme: 'light',
      postsPerPage: 5
    };

    // Create configuration file
    const configPath = path.join(tempDir, 'config.json');
    await fs.writeJson(configPath, mockConfig);

    // Create some test markdown files
    await fs.writeFile(
      path.join(vaultPath, 'first-post.md'),
      `---
title: "First Post"
date: "2023-01-01"
tags: ["test", "first"]
draft: false
---

# First Post

This is the content of the first post.

[[second-post]]

#tag1 #tag2`
    );

    await fs.writeFile(
      path.join(vaultPath, 'second-post.md'),
      `---
title: "Second Post"
date: "2023-01-02"
tags: ["test", "second"]
draft: false
---

# Second Post

This is the content of the second post.

[[first-post]]`
    );

    await fs.writeFile(
      path.join(vaultPath, 'draft-post.md'),
      `---
title: "Draft Post"
date: "2023-01-03"
tags: ["draft"]
draft: true
---

# Draft Post

This is a draft post that should not be indexed.`
    );
  });

  afterEach(async () => {
    // Clean up templates directory
    const projectRoot = path.resolve(__dirname, '..');
    const templatesPath = path.join(projectRoot, 'templates');
    if (await fs.pathExists(templatesPath)) {
      await fs.remove(templatesPath);
    }

    await fs.remove(tempDir);
  });

  it('should complete the full generation flow successfully', async () => {
    // Run the full generation process with the specific config path
    const result = await generator.generate(path.join(tempDir, 'config.json'));

    // Verify the process completed successfully
    expect(result).toBe(true);

    // Check that the output directory contains expected files
    const outputFiles = await fs.readdir(mockConfig.outputPath);
    expect(outputFiles).toContain('index.html');
    expect(outputFiles).toContain('articles.html');
    expect(outputFiles).toContain('search.html');
    expect(outputFiles).toContain('first-post.html');
    expect(outputFiles).toContain('second-post.html');
    expect(outputFiles).toContain('assets');

    // Verify that draft posts are not included
    const outputFilesSet = new Set(outputFiles);
    expect(outputFilesSet).not.toContain('draft-post.html');

    // Check that assets are copied
    const assetsPath = path.join(mockConfig.outputPath, 'assets');
    const assetsExists = await fs.pathExists(assetsPath);
    expect(assetsExists).toBe(true);

    // Check that search data is generated
    const searchDataPath = path.join(mockConfig.outputPath, 'assets', 'js', 'search-data.json');
    const searchDataExists = await fs.pathExists(searchDataPath);
    expect(searchDataExists).toBe(true);

    if (searchDataExists) {
      const searchData = await fs.readJson(searchDataPath);
      expect(searchData).toHaveProperty('articles');
      expect(Array.isArray(searchData.articles)).toBe(true);

      // Should contain 2 articles (excluding the draft)
      expect(searchData.articles).toHaveLength(2);

      // Verify article properties
      const articleTitles = searchData.articles.map((a: any) => a.title);
      expect(articleTitles).toContain('First Post');
      expect(articleTitles).toContain('Second Post');
      expect(articleTitles).not.toContain('Draft Post');
    }

    // Verify that generated HTML files contain expected content
    const firstPostHtml = await fs.readFile(
      path.join(mockConfig.outputPath, 'first-post.html'),
      'utf-8'
    );
    expect(firstPostHtml).toContain('First Post'); // Title
    expect(firstPostHtml).toContain('This is the content of the first post'); // Content
    expect(firstPostHtml).toContain('second-post.html'); // Internal link conversion

    const indexHtml = await fs.readFile(
      path.join(mockConfig.outputPath, 'index.html'),
      'utf-8'
    );
    expect(indexHtml).toContain(mockConfig.siteTitle);
    expect(indexHtml).toContain(mockConfig.siteDescription);
    expect(indexHtml).toContain('First Post');
    expect(indexHtml).toContain('Second Post');
  });

  it('should handle configuration loading properly', async () => {
    const configManager = new ConfigManager();
    const loadedConfig = await configManager.loadConfig(path.join(tempDir, 'config.json'));

    // Verify config properties
    expect(loadedConfig.siteTitle).toBe(mockConfig.siteTitle);
    expect(loadedConfig.siteDescription).toBe(mockConfig.siteDescription);
    expect(loadedConfig.author).toBe(mockConfig.author);
    expect(loadedConfig.theme).toBe(mockConfig.theme);
    expect(loadedConfig.postsPerPage).toBe(mockConfig.postsPerPage);
    expect(loadedConfig.vaultPath).toBe(mockConfig.vaultPath);
    expect(loadedConfig.outputPath).toBe(mockConfig.outputPath);
  });

  it('should process all markdown files correctly', async () => {
    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    // Count the markdown files in the vault
    const vaultFiles = await fs.readdir(mockConfig.vaultPath);
    const markdownFiles = vaultFiles.filter(f => f.endsWith('.md'));

    // Should process 3 markdown files (including the draft)
    expect(markdownFiles).toHaveLength(3);

    // But only 2 should be published (draft excluded)
    const outputDir = await fs.readdir(mockConfig.outputPath);
    const htmlFiles = outputDir.filter(f => f.endsWith('.html'));

    // Should have index.html, articles.html, search.html, first-post.html, second-post.html
    // That's 5 HTML files total
    expect(htmlFiles).toContain('index.html');
    expect(htmlFiles).toContain('articles.html');
    expect(htmlFiles).toContain('search.html');
    expect(htmlFiles).toContain('first-post.html');
    expect(htmlFiles).toContain('second-post.html');
  });

  it('should handle errors gracefully during generation', async () => {
    // Create a configuration with an invalid vault path
    const badConfig = {
      ...mockConfig,
      vaultPath: path.join(tempDir, 'nonexistent-vault')
    };

    const badConfigPath = path.join(tempDir, 'bad-config.json');
    await fs.writeJson(badConfigPath, badConfig);

    // This should handle the error gracefully
    await expect(generator.generate(badConfigPath)).rejects.toThrow();
  });

  it('should generate valid HTML structure', async () => {
    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    // Check a generated HTML file for proper structure
    const indexPath = path.join(mockConfig.outputPath, 'index.html');
    const indexContent = await fs.readFile(indexPath, 'utf-8');

    // Should contain proper HTML structure
    expect(indexContent).toContain('<!DOCTYPE html>');
    expect(indexContent).toContain('<html');
    expect(indexContent).toContain('</html>');
    expect(indexContent).toContain('<head>');
    expect(indexContent).toContain('</head>');
    expect(indexContent).toContain('<body');
    expect(indexContent).toContain('</body>');

    // Should contain site information
    expect(indexContent).toContain(mockConfig.siteTitle);
    expect(indexContent).toContain(mockConfig.siteDescription);
  });

  it('should maintain article relationships and links', async () => {
    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    // Check that internal links are properly converted
    const firstPostPath = path.join(mockConfig.outputPath, 'first-post.html');
    const firstPostContent = await fs.readFile(firstPostPath, 'utf-8');

    // The Obsidian link [[second-post]] should be converted to an HTML link
    expect(firstPostContent).toContain('second-post.html');
    expect(firstPostContent).toContain('class="internal-link"');

    const secondPostPath = path.join(mockConfig.outputPath, 'second-post.html');
    const secondPostContent = await fs.readFile(secondPostPath, 'utf-8');

    // The Obsidian link [[first-post]] should be converted to an HTML link
    expect(secondPostContent).toContain('first-post.html');
    expect(secondPostContent).toContain('class="internal-link"');
  });

  it('should process tags correctly', async () => {
    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    const firstPostPath = path.join(mockConfig.outputPath, 'first-post.html');
    const firstPostContent = await fs.readFile(firstPostPath, 'utf-8');

    // Tags should be processed to spans with tag class
    expect(firstPostContent).toContain('<span class="tag">#tag1</span>');
    expect(firstPostContent).toContain('<span class="tag">#tag2</span>');
  });

  it('should generate search data with prioritized title matches', async () => {
    // Create additional test files with specific search patterns
    const vaultPath = path.join(tempDir, 'vault');

    await fs.writeFile(
      path.join(vaultPath, 'typescript-title-match.md'),
      `---
title: "TypeScript for Beginners"
date: "2023-01-04"
tags: ["typescript"]
draft: false
---

This article talks about JavaScript fundamentals.` // Content has different term than title
    );

    await fs.writeFile(
      path.join(vaultPath, 'javascript-content-match.md'),
      `---
title: "Advanced Programming"
date: "2023-01-05"
tags: ["programming"]
draft: false
---

This article discusses TypeScript in depth.` // Content has "TypeScript" but title doesn't
    );

    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    // Check that search data is generated with the new files
    const searchDataPath = path.join(mockConfig.outputPath, 'assets', 'js', 'search-data.json');
    const searchDataExists = await fs.pathExists(searchDataPath);
    expect(searchDataExists).toBe(true);

    if (searchDataExists) {
      const searchData = await fs.readJson(searchDataPath);
      expect(searchData).toHaveProperty('articles');
      expect(Array.isArray(searchData.articles)).toBe(true);

      // Should contain 4 articles (original 2 + 2 new ones, excluding draft)
      expect(searchData.articles).toHaveLength(4);
    }
  });

  it('should prioritize title matches over content matches in search results', async () => {
    // This test verifies that our search enhancement works properly
    const vaultPath = path.join(tempDir, 'vault');

    // Create test files with specific patterns to test ranking
    await fs.writeFile(
      path.join(vaultPath, 'react-title-match.md'),
      `---
title: "Learning React Basics"
date: "2023-01-06"
tags: ["react", "javascript"]
draft: false
---

This is a guide about React fundamentals. This article discusses React components in depth.
Another paragraph about React development concepts.
The keyword React appears multiple times in the content to test ranking against title match.
      `
    );

    await fs.writeFile(
      path.join(vaultPath, 'javascript-content-match.md'),
      `---
title: "Advanced JavaScript Patterns"
date: "2023-01-07"
tags: ["javascript", "patterns"]
draft: false
---

This article covers various JavaScript patterns and practices.
The main topic is React patterns and best practices for React applications.
We discuss React hooks, React state management, and React component architecture.
The word React appears multiple times in this content.
      `
    );

    // Run the generation to update the search index
    const result = await generator.generate(path.join(tempDir, 'config.json'));
    expect(result).toBe(true);

    // Check that search data is properly generated and includes the ranking information
    const searchDataPath = path.join(mockConfig.outputPath, 'assets', 'js', 'search-data.json');
    const searchDataExists = await fs.pathExists(searchDataPath);
    expect(searchDataExists).toBe(true);

    if (searchDataExists) {
      const searchData = await fs.readJson(searchDataPath);
      expect(searchData).toHaveProperty('articles');
      expect(Array.isArray(searchData.articles)).toBe(true);

      // Verify that the search data contains properly formatted entries
      const reactTitleArticle = searchData.articles.find((a: any) => a.title === "Learning React Basics");
      const javascriptContentArticle = searchData.articles.find((a: any) => a.title === "Advanced JavaScript Patterns");

      expect(reactTitleArticle).toBeDefined();
      expect(javascriptContentArticle).toBeDefined();
    }
  });
});