/**
 * 网站生成器
 * Site Generator for creating HTML pages and static assets
 */

import { GenerationOptions, Article, ParsedArticle, GenerationError, BlogConfig } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import { marked } from 'marked';

// 配置marked选项
marked.setOptions({
  gfm: true,
  breaks: true
});

// 自定义marked扩展：LaTeX数学公式支持
// Custom marked extensions for LaTeX math support
marked.use({
  extensions: [
    {
      name: 'blockMath',
      level: 'block',
      start(src: string) { return src.indexOf('$$'); },
      tokenizer(src: string) {
        const match = src.match(/^\$\$([\s\S]+?)\$\$/);
        if (match) {
          return { type: 'blockMath', raw: match[0], math: match[1] };
        }
        return undefined;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer(token: any) {
        const escaped = (token.math as string)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<div class="math-display">${escaped}</div>\n`;
      }
    },
    {
      name: 'inlineMath',
      level: 'inline',
      start(src: string) {
        const idx = src.indexOf('$');
        return idx === -1 ? -1 : idx;
      },
      tokenizer(src: string) {
        const match = src.match(/^\$([^$\n]+?)\$/);
        if (match) {
          return { type: 'inlineMath', raw: match[0], math: match[1] };
        }
        return undefined;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      renderer(token: any) {
        const escaped = (token.math as string)
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<span class="math-inline">${escaped}</span>`;
      }
    }
  ]
});

// 自定义marked渲染器：Mermaid图表支持
// Override code renderer to render mermaid blocks as <pre class="mermaid">
const renderer = new marked.Renderer();
const originalCodeRenderer = renderer.code.bind(renderer);
renderer.code = function(code: string, infostring: string | undefined, escaped: boolean) {
  if (infostring === 'mermaid') {
    return `<pre class="mermaid">${code}</pre>\n`;
  }
  return originalCodeRenderer(code, infostring, escaped);
};
marked.use({ renderer });

export class SiteGenerator {
  private templateCache: Map<string, string> = new Map();
  
  /**
   * 生成网站
   * Generate complete website
   */
  async generateSite(options: GenerationOptions): Promise<void> {
    try {
      // 确保输出目录存在
      let outputPath = options.outputPath;

      // 如果启用了备份模式，则将内容输出到备份子目录
      if (options.config.backupMode && options.config.backupPath) {
        outputPath = path.join(options.outputPath, options.config.backupPath);
      }

      await fs.ensureDir(outputPath);

      // 转换文章数据
      const articles = this.convertToArticles(options.articles);

      // 生成各种页面
      await this.generateHomePage(articles, options, outputPath);
      await this.generateArticleList(articles, options, outputPath);
      await this.generateArticlePages(articles, options, outputPath);
      await this.generateSearchPage(articles, options, outputPath);

      // 生成 TODO 页面（如果启用）
      if (options.config.todo?.enabled) {
        await this.generateTodoPage(options, outputPath);
      }

      // 复制静态资源
      await this.copyStaticAssets(outputPath);

      // 复制 Markdown 源文件
      await this.copyMarkdownFiles(articles, options, outputPath);

      // 生成CNAME文件（如果配置了自定义域名）
      await this.generateCnameFile(options.config, outputPath);

    } catch (error) {
      throw new GenerationError(
        `网站生成失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 渲染侧边栏
   * Render sidebar HTML
   */
  private renderSidebar(articles: Article[], options: GenerationOptions): string {
    const author = options.config.author || options.config.siteTitle;

    return `
      <aside class="sidebar">
        <div class="sidebar-profile">
          <img src="./assets/images/avatar.png" alt="avatar" class="sidebar-avatar">
          <h3 class="sidebar-author">${author}</h3>
          <p class="sidebar-slogan">${options.config.siteDescription}</p>
          ${options.config.githubUrl ? `
            <div class="sidebar-github-actions">
              <a href="${options.config.githubUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-github" aria-label="GitHub">
                <svg viewBox="0 0 16 16" width="22" height="22" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
              </a>
              <a href="${options.config.githubUrl}" target="_blank" rel="noopener noreferrer" class="sidebar-follow-btn" aria-label="Follow on GitHub">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM8 6.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Zm-1.5 4a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.5-.5Zm.5 2.5a.5.5 0 0 0 0 1h8a.5.5 0 0 0 0-1H4Z"/></svg>
                Follow
              </a>
            </div>
          ` : ''}
        </div>

        <div class="sidebar-stats">
          <div class="stat-item">文章: ${articles.filter(a => !a.isDraft).length}</div>
          <div class="stat-item">更新: ${this.formatDate(new Date())}</div>
        </div>

        <div class="sidebar-widget">
          <h3>标签</h3>
          <div class="tag-cloud">
            ${this.getPopularTags(articles).slice(0, 15).map(tag =>
              `<a href="articles.html?tag=${encodeURIComponent(tag.name)}" class="tag">#${tag.name} (${tag.count})</a>`
            ).join('')}
          </div>
        </div>
      </aside>
    `;
  }

  /**
   * 生成首页
   * Generate home page
   */
  async generateHomePage(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void> {
    const recentArticles = articles
      .filter(article => !article.isDraft)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    const layoutTemplate = await this.loadTemplate('layout.html');

    const sidebar = this.renderSidebar(articles, options);

    const content = `
      ${sidebar}

      <div class="home-layout">
        <main class="home-main">
          <section class="hero">
            <div class="meteor-shower" aria-hidden="true">
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
              <span class="meteor"></span>
            </div>
            <h1>${options.config.siteTitle}</h1>
            <p class="hero-description">${options.config.siteDescription}</p>
          </section>

          <section class="recent-articles">
            <div class="section-header">
              <h2 class="section-title">最新文章</h2>
              <a href="articles.html" class="section-link">查看全部 →</a>
            </div>
            <div class="article-grid">
              ${recentArticles.map(article => this.renderArticleCard(article)).join('')}
            </div>
          </section>
        </main>
      </div>
    `;

    const html = this.renderTemplate(layoutTemplate, {
      title: '首页',
      siteTitle: options.config.siteTitle,
      siteDescription: options.config.siteDescription,
      description: options.config.siteDescription,
      bodyClass: 'home-page',
      homeActive: 'active',
      articlesActive: '',
      searchActive: '',
      todoActive: '',
      currentYear: new Date().getFullYear(),
      author: options.config.author || options.config.siteTitle,
      content,
      additionalHead: ''
    });

    await fs.writeFile(path.join(outputPath, 'index.html'), html);
  }

  /**
   * 生成文章列表页
   * Generate article list page
   */
  async generateArticleList(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void> {
    const publishedArticles = articles
      .filter(article => !article.isDraft)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const layoutTemplate = await this.loadTemplate('layout.html');

    // Serialize article data for client-side filtering
    const articleData = publishedArticles.map(article => ({
      id: article.id,
      title: article.title,
      date: article.date.toISOString(),
      modifiedDate: article.modifiedDate.toISOString(),
      tags: article.tags,
      readingTime: article.readingTime,
      slug: article.slug,
      description: article.description,
      relativePath: path.relative(options.config.vaultPath, article.filePath).replace(/\\/g, '/')
    }));

    const sidebar = this.renderSidebar(articles, options);

    const content = `
      ${sidebar}

      <div class="page-layout">
        <main class="page-content">
          <div class="articles-filters">
            <div class="filter-group">
              <label for="sort-select">排序方式:</label>
              <select id="sort-select" class="filter-select">
                <option value="date-desc">最新发布</option>
                <option value="date-asc">最早发布</option>
                <option value="modified-desc">最近修改</option>
                <option value="title-asc">标题 A-Z</option>
                <option value="title-desc">标题 Z-A</option>
                <option value="readtime-asc">阅读时间 (短至长)</option>
                <option value="readtime-desc">阅读时间 (长至短)</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="tag-filter">标签筛选:</label>
              <select id="tag-filter" class="filter-select">
                <option value="">所有标签</option>
                ${this.getPopularTags(articles).map(tag =>
                  `<option value="${tag.name}">#${tag.name} (${tag.count})</option>`
                ).join('')}
              </select>
            </div>
            <div class="view-toggle">
              <button class="view-toggle-btn active" data-view="list" title="列表视图">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button class="view-toggle-btn" data-view="folder" title="文件夹视图">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          </div>

          <div class="article-list" data-per-page="${options.config.postsPerPage}">
            ${publishedArticles.map(article => this.renderArticleListItem(article)).join('')}
          </div>

          <div class="folder-tree-container" style="display: none;"></div>
        </main>
      </div>
    `;

    const html = this.renderTemplate(layoutTemplate, {
      title: '文章列表',
      siteTitle: options.config.siteTitle,
      siteDescription: options.config.siteDescription,
      description: '所有文章列表',
      bodyClass: 'articles-page',
      homeActive: '',
      articlesActive: 'active',
      searchActive: '',
      todoActive: '',
      currentYear: new Date().getFullYear(),
      author: options.config.author || options.config.siteTitle,
      content,
      additionalHead: `
        <script type="application/json" id="article-data" style="display:none">
          ${JSON.stringify(articleData)}
        </script>
        <script src="assets/js/articles-folder-view.js"></script>
        <script src="assets/js/articles-filters.js"></script>
      `
    });

    await fs.writeFile(path.join(outputPath, 'articles.html'), html);
  }

  /**
   * 生成搜索页面
   * Generate search page
   */
  async generateSearchPage(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void> {
    const layoutTemplate = await this.loadTemplate('layout.html');
    const searchTemplate = await this.loadTemplate('search.html');

    const searchContent = this.renderTemplate(searchTemplate, {});

    const sidebar = this.renderSidebar(articles, options);

    const content = `
      ${sidebar}

      <div class="page-layout">
        <main class="page-content">
          ${searchContent}
        </main>
      </div>
    `;

    const html = this.renderTemplate(layoutTemplate, {
      title: '搜索',
      siteTitle: options.config.siteTitle,
      siteDescription: options.config.siteDescription,
      description: '搜索文章',
      bodyClass: 'search-page',
      homeActive: '',
      articlesActive: '',
      searchActive: 'active',
      todoActive: '',
      currentYear: new Date().getFullYear(),
      author: options.config.author || options.config.siteTitle,
      content,
      additionalHead: ''
    });

    await fs.writeFile(path.join(outputPath, 'search.html'), html);
  }
  async generateArticlePages(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void> {
    const layoutTemplate = await this.loadTemplate('layout.html');
    const articleTemplate = await this.loadTemplate('article.html');

    for (const article of articles) {
      if (!article.isDraft) {
        // 处理文章内容中的Obsidian链接
        const processedContent = this.processObsidianLinks(article.htmlContent, articles);
        const articleWithToc = this.buildArticleContentWithToc(processedContent);

        const content = this.renderTemplate(articleTemplate, {
          title: article.title,
          content: articleWithToc.content,
          date: this.formatDate(article.date),
          dateISO: article.date.toISOString(),
          readingTime: article.readingTime,
          wordCount: article.wordCount,
          tags: article.tags,
          markdownUrl: `assets/markdown/${article.slug}.md`,
          markdownFilename: `${article.title}.md`,
          tableOfContents: articleWithToc.tableOfContents,
          relatedArticles: this.getRelatedArticles(article, articles).slice(0, 3),
          commentsEnabled: options.config.comments?.enabled || false,
          commentsScript: this.generateCommentsScript(options.config, article.title)
        });

        const html = this.renderTemplate(layoutTemplate, {
          title: article.title,
          siteTitle: options.config.siteTitle,
          siteDescription: options.config.siteDescription,
          description: article.description,
          bodyClass: 'article-page',
          homeActive: '',
          articlesActive: '',
          searchActive: '',
          todoActive: '',
          currentYear: new Date().getFullYear(),
          author: options.config.author || options.config.siteTitle,
          content,
          additionalHead: `<meta property="og:title" content="${article.title}">
<meta property="og:description" content="${article.description}">
<meta property="og:type" content="article">
<meta property="article:published_time" content="${article.date.toISOString()}">
<meta property="article:author" content="${options.config.author || options.config.siteTitle}">
<link rel="stylesheet" id="hljs-light" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<link rel="stylesheet" id="hljs-dark" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css" disabled>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" defer></script>
<script src="assets/js/code-enhance.js" defer></script>
<script src="assets/js/image-enhance.js" defer></script>
<script src="assets/js/article-toc.js" defer></script>
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
mermaid.initialize({ startOnLoad: true, theme: isDark ? 'dark' : 'default' });
</script>
<script defer>
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.math-display').forEach(function(el) {
    try { katex.render(el.textContent, el, { displayMode: true, throwOnError: false }); } catch(e) {}
  });
  document.querySelectorAll('.math-inline').forEach(function(el) {
    try { katex.render(el.textContent, el, { displayMode: false, throwOnError: false }); } catch(e) {}
  });
});
</script>${this.generateTextSelectionCommentHead(options.config, article.slug)}`
        });

        await fs.writeFile(path.join(outputPath, `${article.slug}.html`), html);
      }
    }
  }

  /**
   * 生成 TODO 页面
   * Generate TODO Kanban board page
   */
  async generateTodoPage(options: GenerationOptions, outputPath: string): Promise<void> {
    const layoutTemplate = await this.loadTemplate('layout.html');
    const todoTemplate = await this.loadTemplate('todo.html');

    const todoConfig = options.config.todo!;
    const githubUsername = options.config.githubUrl ? this.extractGithubUsername(options.config.githubUrl) : '';

    const content = this.renderTemplate(todoTemplate, {
      githubUsername,
      projectNumber: todoConfig.projectNumber,
      todoRepo: todoConfig.repo || 'TODO',
      oauthClientId: todoConfig.oauthClientId || '',
      oauthProxyUrl: todoConfig.oauthProxyUrl || ''
    });

    const html = this.renderTemplate(layoutTemplate, {
      title: 'TODO',
      siteTitle: options.config.siteTitle,
      siteDescription: options.config.siteDescription,
      description: 'TODO Kanban Board',
      bodyClass: 'todo-page',
      homeActive: '',
      articlesActive: '',
      searchActive: '',
      todoActive: 'active',
      currentYear: new Date().getFullYear(),
      author: options.config.author || options.config.siteTitle,
      content,
      additionalHead: '<script src="assets/js/todo.js" defer></script>'
    });

    await fs.writeFile(path.join(outputPath, 'todo.html'), html);
  }

  /**
   * 从 GitHub URL 中提取用户名
   * Extract GitHub username from GitHub profile URL
   */
  private extractGithubUsername(githubUrl: string): string {
    const match = githubUrl.match(/github\.com\/([^/]+)/);
    return match ? match[1] : '';
  }

  /**
   * 复制静态资源
   * Copy static assets
   */
  async copyStaticAssets(outputPath: string): Promise<void> {
    const templatesPath = path.join(process.cwd(), 'templates');
    const assetsSourcePath = path.join(templatesPath, 'assets');
    const assetsDestPath = path.join(outputPath, 'assets');

    // 确保目标目录存在
    await fs.ensureDir(assetsDestPath);

    // 复制CSS和JS文件
    if (await fs.pathExists(assetsSourcePath)) {
      await fs.copy(assetsSourcePath, assetsDestPath);
    } else {
      // 如果模板资源不存在，创建基本目录结构
      await fs.ensureDir(path.join(assetsDestPath, 'css'));
      await fs.ensureDir(path.join(assetsDestPath, 'js'));
    }
  }

  /**
   * 复制 Markdown 源文件
   * Copy markdown source files to output directory
   */
  private async copyMarkdownFiles(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void> {
    const markdownDestPath = path.join(outputPath, 'assets', 'markdown');
    await fs.ensureDir(markdownDestPath);

    for (const article of articles) {
      if (!article.isDraft) {
        try {
          // 使用 slug 作为文件名以确保 URL 安全
          const destFilename = `${article.slug}.md`;
          const destPath = path.join(markdownDestPath, destFilename);

          // 如果 markdown 文件存在则复制
          if (await fs.pathExists(article.filePath)) {
            await fs.copy(article.filePath, destPath);
          } else {
            console.warn(`Markdown file not found for article "${article.title}": ${article.filePath}`);
          }
        } catch (error) {
          console.warn(`Failed to copy markdown for "${article.title}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
  }

  /**
   * 转换为完整的文章数据结构
   * Convert parsed articles to full article data structure
   */
  private convertToArticles(parsedArticles: ParsedArticle[]): Article[] {
    return parsedArticles.map(parsed => ({
      id: this.generateId(parsed.filePath),
      title: parsed.metadata.title,
      slug: parsed.metadata.slug || this.createSlug(parsed.metadata.title),
      date: parsed.metadata.date,
      modifiedDate: parsed.metadata.modifiedDate,
      tags: parsed.metadata.tags,
      description: parsed.metadata.description || this.extractDescription(parsed.content),
      content: parsed.content,
      htmlContent: this.convertMarkdownToHtml(parsed.content),
      wordCount: parsed.wordCount,
      readingTime: Math.ceil(parsed.wordCount / 200), // 假设每分钟200字
      filePath: parsed.filePath,
      isDraft: parsed.metadata.draft || false
    }));
  }

  /**
   * 加载模板文件
   * Load template file
   */
  private async loadTemplate(templateName: string): Promise<string> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }
    
    const templatePath = path.join(process.cwd(), 'templates', templateName);
    
    if (await fs.pathExists(templatePath)) {
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templateName, template);
      return template;
    }
    
    throw new GenerationError(`模板文件不存在: ${templatePath}`);
  }

  /**
   * 渲染模板
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let result = template;

    // 处理循环语句 {{#each array}}...{{/each}} (需要在普通变量替换之前处理嵌套内容)
    result = result.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
      const array = data[arrayName];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemHtml = itemTemplate;
          if (typeof item === 'object') {
            for (const [key, value] of Object.entries(item)) {
              const regex = new RegExp(`{{${key}}}`, 'g');
              itemHtml = itemHtml.replace(regex, String(value || ''));
            }
          } else {
            itemHtml = itemHtml.replace(/{{this}}/g, String(item));
          }
          return itemHtml;
        }).join('');
      }
      return '';
    });

    // 处理条件语句 {{#if condition}}...{{/if}} (同样在普通变量替换之前处理)
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    });

    // 简单的模板替换 (处理最终值，应在复杂结构之后)
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }

    // 处理三重括号 {{{content}}} 用于输出未转义内容 (必须在普通变量替换之前处理)
    result = result.replace(/\{\{\{(\w+)\}\}\}/g, (match, key) => {
      if (data.hasOwnProperty(key)) {
        return String(data[key]);
      }
      // 如果键不存在，不替换而是保持原样，让后续处理处理
      return match;
    });

    // 处理双大括号 {{content}} 用于转义输出 (必须在普通变量替换之前处理)
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (data.hasOwnProperty(key)) {
        // 对内容进行HTML转义以防止XSS
        const value = String(data[key] || '');
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      }
      return match; // 如果键不存在，保持原始标记不变
    });

    // 最后处理简单变量替换 {{key}} (针对对象的属性)
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value || ''));
    }

    // 清理未处理的模板标记，但要小心不要移除过多内容
    result = result.replace(/\{\{[^{}]*\}\}/g, '');

    // 修剪结果
    result = result.trim();

    return result;
  }

  /**
   * Callout type aliases mapping to canonical types
   */
  private static readonly CALLOUT_ALIASES: Record<string, string> = {
    summary: 'abstract', tldr: 'abstract',
    hint: 'tip', important: 'tip',
    check: 'success', done: 'success',
    help: 'question', faq: 'question',
    caution: 'warning', attention: 'warning',
    fail: 'failure', missing: 'failure',
    error: 'danger',
    cite: 'quote'
  };

  /**
   * Default title and inline SVG icon for each callout type
   */
  private static readonly CALLOUT_DEFAULTS: Record<string, { title: string; icon: string }> = {
    note: {
      title: 'Note',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="2" x2="22" y2="6"/><path d="M7.5 20.5 19 9l-4-4L3.5 16.5 2 22z"/></svg>'
    },
    abstract: {
      title: 'Abstract',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>'
    },
    info: {
      title: 'Info',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    },
    todo: {
      title: 'Todo',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
    },
    tip: {
      title: 'Tip',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>'
    },
    success: {
      title: 'Success',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    },
    question: {
      title: 'Question',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    },
    warning: {
      title: 'Warning',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    },
    failure: {
      title: 'Failure',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    },
    danger: {
      title: 'Danger',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
    },
    bug: {
      title: 'Bug',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 10h2"/><path d="M3 10h2"/><path d="M19 14h2"/><path d="M3 14h2"/><path d="M5 6l2 2"/><path d="M17 6l2-2"/><path d="M5 18l2-2"/><path d="M17 18l2 2"/></svg>'
    },
    example: {
      title: 'Example',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
    },
    quote: {
      title: 'Quote',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>'
    }
  };

  /**
   * 转换Markdown为HTML
   * Convert markdown to HTML
   */
  private convertMarkdownToHtml(markdown: string): string {
    const html = marked(markdown);
    return this.processCallouts(html);
  }

  /**
   * 处理 Obsidian Callout 语法
   * Post-process HTML to transform blockquote callouts into styled div elements.
   * Loops to handle nested callouts (innermost first).
   */
  processCallouts(html: string): string {
    // Pattern matches <blockquote> containing a first <p> that starts with [!type]
    const calloutRegex = /<blockquote>\s*<p>\[!(\w+)\]([-+])?\s*(.*?)<\/p>([\s\S]*?)<\/blockquote>/g;

    let result = html;
    let prevResult = '';

    // Loop to handle nested callouts - process innermost first
    while (result !== prevResult) {
      prevResult = result;
      result = result.replace(calloutRegex, (_match, rawType: string, fold: string | undefined, titleText: string, body: string) => {
        return this.buildCalloutHtml(rawType, fold, titleText, body);
      });
    }

    return result;
  }

  /**
   * 构建 Callout HTML
   * Build the callout HTML div structure
   */
  private buildCalloutHtml(rawType: string, fold: string | undefined, customTitle: string, body: string): string {
    const lowerType = rawType.toLowerCase();
    const canonicalType = SiteGenerator.CALLOUT_ALIASES[lowerType] || lowerType;
    const defaults = SiteGenerator.CALLOUT_DEFAULTS[canonicalType] || SiteGenerator.CALLOUT_DEFAULTS['note'];
    const icon = defaults.icon;

    // Handle <br> in the title text: text before first <br> is title, rest is body content
    // marked renders `> [!type]\n> body` as `<p>[!type]<br>body</p>`
    let title: string;
    let inlineBody = '';
    const brMatch = customTitle.match(/^(.*?)<br\s*\/?>([\s\S]*)$/i);
    if (brMatch) {
      title = brMatch[1].trim() || defaults.title;
      inlineBody = brMatch[2].trim();
    } else {
      title = customTitle.trim() || defaults.title;
    }

    // Combine inline body (from <br> split) with any additional body paragraphs
    const bodyParts: string[] = [];
    if (inlineBody) bodyParts.push(`<p>${inlineBody}</p>`);
    if (body.trim()) bodyParts.push(body.trim());
    const fullBody = bodyParts.join('\n');

    const titleHtml = `<span class="callout-icon">${icon}</span><span class="callout-title-text">${title}</span>`;
    const contentHtml = fullBody ? `<div class="callout-content">${fullBody}</div>` : '';

    if (fold === '+' || fold === '-') {
      const openAttr = fold === '+' ? ' open' : '';
      return `<div class="callout callout-${canonicalType}" data-callout="${canonicalType}">` +
        `<details${openAttr}>` +
        `<summary class="callout-title">${titleHtml}</summary>` +
        contentHtml +
        `</details>` +
        `</div>`;
    }

    return `<div class="callout callout-${canonicalType}" data-callout="${canonicalType}">` +
      `<div class="callout-title">${titleHtml}</div>` +
      contentHtml +
      `</div>`;
  }

  /**
   * 处理Obsidian内部链接
   * Process Obsidian internal links
   */
  private processObsidianLinks(htmlContent: string, articles: Article[]): string {
    // 处理 [[文章标题]] 格式的内部链接
    return htmlContent.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      // 查找匹配的文章
      const targetArticle = articles.find(article => 
        article.title === linkText || 
        article.slug === this.createSlug(linkText) ||
        article.id === linkText
      );
      
      if (targetArticle) {
        return `<a href="${targetArticle.slug}.html" class="internal-link">${linkText}</a>`;
      } else {
        // 如果找不到对应文章，保持原样但添加样式
        return `<span class="broken-link">${linkText}</span>`;
      }
    });
  }

  /**
   * 生成目录
   * Generate table of contents
   */
  private buildArticleContentWithToc(htmlContent: string): { content: string; tableOfContents: string } {
    const tocItems: Array<{ level: number; text: string; id: string }> = [];
    const usedIds = new Map<string, number>();
    let fallbackIndex = 0;

    const content = htmlContent.replace(
      /<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi,
      (match, levelStr, attrs, innerHtml) => {
        const level = parseInt(levelStr, 10);
        const text = innerHtml.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const baseId = this.createSlug(text) || `section-${++fallbackIndex}`;
        const id = this.ensureUniqueId(baseId, usedIds);
        const safeText = text || `Section ${fallbackIndex}`;
        const attrsWithoutId = attrs.replace(/\sid=(["']).*?\1/i, '');

        tocItems.push({ level, text: safeText, id });
        return `<h${level}${attrsWithoutId} id="${id}">${innerHtml}</h${level}>`;
      }
    );

    if (tocItems.length === 0) {
      return { content, tableOfContents: '' };
    }

    const tableOfContents = `<ul class="toc-list">${tocItems
      .map(item => `<li class="toc-level-${item.level}"><a href="#${item.id}" class="toc-link">${this.escapeHtml(item.text)}</a></li>`)
      .join('')}</ul>`;

    return { content, tableOfContents };
  }

  private ensureUniqueId(baseId: string, usedIds: Map<string, number>): string {
    const count = usedIds.get(baseId) || 0;
    usedIds.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * 获取相关文章
   * Get related articles based on tags
   */
  private getRelatedArticles(currentArticle: Article, allArticles: Article[]): Article[] {
    const otherArticles = allArticles.filter(article => 
      article.id !== currentArticle.id && !article.isDraft
    );
    
    // 基于标签相似度排序
    const scored = otherArticles.map(article => {
      const commonTags = article.tags.filter(tag => 
        currentArticle.tags.includes(tag)
      ).length;
      return { article, score: commonTags };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.article);
  }

  /**
   * 获取热门标签
   * Get popular tags
   */
  private getPopularTags(articles: Article[]): Array<{name: string, count: number}> {
    const tagCounts = new Map<string, number>();
    
    articles
      .filter(article => !article.isDraft)
      .forEach(article => {
        article.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
    
    return Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 渲染文章卡片
   * Render article card for home page
   */
  private renderArticleCard(article: Article): string {
    return `
    <div class="article-card">
        <h3><a href="${article.slug}.html">${article.title}</a></h3>
        <p class="article-excerpt">${article.description}</p>
        <div class="article-meta">
            <time datetime="${article.date.toISOString()}">${this.formatDate(article.date)}</time>
            <span class="reading-time">${article.readingTime} 分钟</span>
        </div>
    </div>`;
  }

  /**
   * 渲染文章列表项
   * Render article list item
   */
  private renderArticleListItem(article: Article): string {
    return `
    <div class="article-item">
        <h3>
            <a href="${article.slug}.html">${article.title}</a>
            <a href="assets/markdown/${article.slug}.md"
               download="${article.title}.md"
               class="markdown-export-btn"
               title="下载 Markdown 源文件"
               aria-label="导出 Markdown"
               onclick="event.stopPropagation()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </a>
        </h3>
        <p class="article-excerpt">${article.description}</p>
        <div class="article-meta">
            <time datetime="${article.date.toISOString()}">${this.formatDate(article.date)}</time>
            <span class="reading-time">${article.readingTime} 分钟阅读</span>
            ${article.tags.length > 0 ? `<div class="tags">${article.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div>` : ''}
        </div>
    </div>`;
  }

  /**
   * 生成文章ID
   * Generate article ID
   */
  private generateId(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 创建URL友好的slug
   * Create URL-friendly slug
   */
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 移除特殊字符，保留中文字符
      .replace(/[\s_-]+/g, '-') // 空格和下划线转为连字符
      .replace(/^-+|-+$/g, ''); // 移除首尾连字符
  }

  /**
   * 从内容中提取描述
   * Extract description from content
   */
  private extractDescription(content: string, maxLength: number = 150): string {
    const plainText = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
      .replace(/<[^>]*>/g, '')
      .replace(/[#*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  /**
   * 格式化日期
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * 生成评论脚本
   * Generate Utterances comments script tag
   */
  private generateCommentsScript(config: BlogConfig, articleTitle?: string): string {
    if (!config.comments?.enabled || !config.comments?.repo) {
      return '';
    }

    const repo = config.comments.repo;
    const issueTerm = config.comments.issueTerm || 'pathname';
    const label = config.comments.label ? `\n        label="${config.comments.label}"` : '';

    // 当 issueTerm 为 pathname 或 url 时，使用文章标题作为 issue-term 的具体值，
    // 避免中文路径被浏览器 URL 编码后导致 GitHub Issue 标题显示为编码字符串
    const useSpecificTerm = (issueTerm === 'pathname' || issueTerm === 'url') && articleTitle;
    const issueTermAttr = useSpecificTerm
      ? `issue-term="${articleTitle.replace(/"/g, '&quot;')}"`
      : `issue-term="${issueTerm}"`;

    return `<script src="https://utteranc.es/client.js"
        repo="${repo}"
        ${issueTermAttr}${label}
        theme="preferred-color-scheme"
        crossorigin="anonymous"
        async>
</script>`;
  }

  /**
   * 生成划词评论相关的 head 内容
   * Generate text selection comment head content
   */
  private generateTextSelectionCommentHead(config: BlogConfig, articleSlug: string): string {
    // 检查是否启用了划词评论
    if (!config.comments?.annotation?.enabled) {
      return '';
    }

    const repo = config.comments.repo;
    const annotationLabel = config.comments.annotation.label || 'text-annotation';
    const oauthClientId = config.comments.annotation.oauthClientId || '';
    const oauthProxyUrl = config.comments.annotation.oauthProxyUrl || '';

    return `
<!-- Text Selection Comment (划词评论) -->
<link rel="stylesheet" href="assets/css/text-selection-comment.css">
<script>
  window.textSelectionCommentConfig = {
    repo: '${repo}',
    label: '${annotationLabel}',
    articleSlug: '${articleSlug}',
    clientId: '${oauthClientId}',
    oauthProxyUrl: '${oauthProxyUrl}'
  };
</script>
<script src="assets/js/text-selection-comment.js" defer></script>`;
  }

  /**
   * 生成CNAME文件
   * Generate CNAME file for custom domain
   */
  async generateCnameFile(config: BlogConfig, outputPath: string): Promise<void> {
    if (config.customDomain && config.customDomain.trim()) {
      const cnamePath = path.join(outputPath, 'CNAME');
      await fs.writeFile(cnamePath, config.customDomain.trim());
    }
  }
}
