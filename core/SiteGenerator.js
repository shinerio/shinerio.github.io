"use strict";
/**
 * 网站生成器
 * Site Generator for creating HTML pages and static assets
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiteGenerator = void 0;
const types_1 = require("../types");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const marked_1 = require("marked");
// 配置marked选项
marked_1.marked.setOptions({
    gfm: true,
    breaks: true
});
class SiteGenerator {
    constructor() {
        this.templateCache = new Map();
    }
    /**
     * 生成网站
     * Generate complete website
     */
    async generateSite(options) {
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
            await this.generateSearchPage(options, outputPath);
            // 生成 TODO 页面（如果启用）
            if (options.config.todo?.enabled) {
                await this.generateTodoPage(options, outputPath);
            }
            // 复制静态资源
            await this.copyStaticAssets(outputPath);
            // 生成CNAME文件（如果配置了自定义域名）
            await this.generateCnameFile(options.config, outputPath);
        }
        catch (error) {
            throw new types_1.GenerationError(`网站生成失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * 生成首页
     * Generate home page
     */
    async generateHomePage(articles, options, outputPath) {
        const recentArticles = articles
            .filter(article => !article.isDraft)
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5);
        const layoutTemplate = await this.loadTemplate('layout.html');
        const author = options.config.author || options.config.siteTitle;
        const content = `
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
          <span>文章: ${articles.filter(a => !a.isDraft).length}</span>
          <span class="stats-dot">·</span>
          <span>更新: ${this.formatDate(new Date())}</span>
        </div>

        <div class="sidebar-widget">
          <h3>标签</h3>
          <div class="tag-cloud">
            ${this.getPopularTags(articles).slice(0, 15).map(tag => `<a href="articles.html?tag=${encodeURIComponent(tag.name)}" class="tag">#${tag.name} (${tag.count})</a>`).join('')}
          </div>
        </div>
      </aside>

      <div class="home-layout">
        <main class="home-main">
          <section class="hero">
            <h1 class="hero-title">${options.config.siteTitle}</h1>
            <p class="hero-subtitle">${options.config.siteDescription}</p>
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
    async generateArticleList(articles, options, outputPath) {
        const publishedArticles = articles
            .filter(article => !article.isDraft)
            .sort((a, b) => b.date.getTime() - a.date.getTime());
        const layoutTemplate = await this.loadTemplate('layout.html');
        // Serialize article data for client-side filtering
        const articleData = publishedArticles.map(article => ({
            id: article.id,
            title: article.title,
            date: article.date.toISOString(),
            tags: article.tags,
            readingTime: article.readingTime,
            slug: article.slug,
            description: article.description
        }));
        const content = `
      <div class="articles-filters">
        <div class="filter-group">
          <label for="sort-select">排序方式:</label>
          <select id="sort-select" class="filter-select">
            <option value="date-desc">最新发布</option>
            <option value="date-asc">最早发布</option>
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
            ${this.getPopularTags(articles).map(tag => `<option value="${tag.name}">#${tag.name} (${tag.count})</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="article-list">
        ${publishedArticles.map(article => this.renderArticleListItem(article)).join('')}
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
        <script src="assets/js/articles-filters.js"></script>
      `
        });
        await fs.writeFile(path.join(outputPath, 'articles.html'), html);
    }
    /**
     * 生成搜索页面
     * Generate search page
     */
    async generateSearchPage(options, outputPath) {
        const layoutTemplate = await this.loadTemplate('layout.html');
        const searchTemplate = await this.loadTemplate('search.html');
        const content = this.renderTemplate(searchTemplate, {});
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
    async generateArticlePages(articles, options, outputPath) {
        const layoutTemplate = await this.loadTemplate('layout.html');
        const articleTemplate = await this.loadTemplate('article.html');
        for (const article of articles) {
            if (!article.isDraft) {
                // 处理文章内容中的Obsidian链接
                const processedContent = this.processObsidianLinks(article.htmlContent, articles);
                const content = this.renderTemplate(articleTemplate, {
                    title: article.title,
                    content: processedContent,
                    date: this.formatDate(article.date),
                    dateISO: article.date.toISOString(),
                    readingTime: article.readingTime,
                    wordCount: article.wordCount,
                    tags: article.tags,
                    tableOfContents: this.generateTableOfContents(article.htmlContent),
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
<meta property="article:author" content="${options.config.author || options.config.siteTitle}">`
                });
                await fs.writeFile(path.join(outputPath, `${article.slug}.html`), html);
            }
        }
    }
    /**
     * 生成 TODO 页面
     * Generate TODO Kanban board page
     */
    async generateTodoPage(options, outputPath) {
        const layoutTemplate = await this.loadTemplate('layout.html');
        const todoTemplate = await this.loadTemplate('todo.html');
        const todoConfig = options.config.todo;
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
    extractGithubUsername(githubUrl) {
        const match = githubUrl.match(/github\.com\/([^/]+)/);
        return match ? match[1] : '';
    }
    /**
     * 复制静态资源
     * Copy static assets
     */
    async copyStaticAssets(outputPath) {
        const templatesPath = path.join(process.cwd(), 'templates');
        const assetsSourcePath = path.join(templatesPath, 'assets');
        const assetsDestPath = path.join(outputPath, 'assets');
        // 确保目标目录存在
        await fs.ensureDir(assetsDestPath);
        // 复制CSS和JS文件
        if (await fs.pathExists(assetsSourcePath)) {
            await fs.copy(assetsSourcePath, assetsDestPath);
        }
        else {
            // 如果模板资源不存在，创建基本目录结构
            await fs.ensureDir(path.join(assetsDestPath, 'css'));
            await fs.ensureDir(path.join(assetsDestPath, 'js'));
        }
    }
    /**
     * 转换为完整的文章数据结构
     * Convert parsed articles to full article data structure
     */
    convertToArticles(parsedArticles) {
        return parsedArticles.map(parsed => ({
            id: this.generateId(parsed.filePath),
            title: parsed.metadata.title,
            slug: parsed.metadata.slug || this.createSlug(parsed.metadata.title),
            date: parsed.metadata.date,
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
    async loadTemplate(templateName) {
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName);
        }
        const templatePath = path.join(process.cwd(), 'templates', templateName);
        if (await fs.pathExists(templatePath)) {
            const template = await fs.readFile(templatePath, 'utf-8');
            this.templateCache.set(templateName, template);
            return template;
        }
        throw new types_1.GenerationError(`模板文件不存在: ${templatePath}`);
    }
    /**
     * 渲染模板
     * Render template with data
     */
    renderTemplate(template, data) {
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
                    }
                    else {
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
     * 转换Markdown为HTML
     * Convert markdown to HTML
     */
    convertMarkdownToHtml(markdown) {
        return (0, marked_1.marked)(markdown);
    }
    /**
     * 处理Obsidian内部链接
     * Process Obsidian internal links
     */
    processObsidianLinks(htmlContent, articles) {
        // 处理 [[文章标题]] 格式的内部链接
        return htmlContent.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
            // 查找匹配的文章
            const targetArticle = articles.find(article => article.title === linkText ||
                article.slug === this.createSlug(linkText) ||
                article.id === linkText);
            if (targetArticle) {
                return `<a href="${targetArticle.slug}.html" class="internal-link">${linkText}</a>`;
            }
            else {
                // 如果找不到对应文章，保持原样但添加样式
                return `<span class="broken-link">${linkText}</span>`;
            }
        });
    }
    /**
     * 生成目录
     * Generate table of contents
     */
    generateTableOfContents(htmlContent) {
        const headings = htmlContent.match(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/g);
        if (!headings)
            return '';
        const tocItems = headings.map(heading => {
            const level = parseInt(heading.match(/<h([1-6])/)?.[1] || '1');
            const text = heading.replace(/<[^>]*>/g, '');
            const id = this.createSlug(text);
            return { level, text, id };
        });
        let toc = '<ul class="toc-list">';
        for (const item of tocItems) {
            toc += `<li class="toc-level-${item.level}">
        <a href="#${item.id}" class="toc-link">${item.text}</a>
      </li>`;
        }
        toc += '</ul>';
        return toc;
    }
    /**
     * 获取相关文章
     * Get related articles based on tags
     */
    getRelatedArticles(currentArticle, allArticles) {
        const otherArticles = allArticles.filter(article => article.id !== currentArticle.id && !article.isDraft);
        // 基于标签相似度排序
        const scored = otherArticles.map(article => {
            const commonTags = article.tags.filter(tag => currentArticle.tags.includes(tag)).length;
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
    getPopularTags(articles) {
        const tagCounts = new Map();
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
    renderArticleCard(article) {
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
    renderArticleListItem(article) {
        return `
    <div class="article-item">
        <h3><a href="${article.slug}.html">${article.title}</a></h3>
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
    generateId(filePath) {
        return path.basename(filePath, path.extname(filePath));
    }
    /**
     * 创建URL友好的slug
     * Create URL-friendly slug
     */
    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    /**
     * 从内容中提取描述
     * Extract description from content
     */
    extractDescription(content, maxLength = 150) {
        const plainText = content
            .replace(/```[\s\S]*?```/g, '')
            .replace(/`[^`]+`/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
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
    formatDate(date) {
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
    generateCommentsScript(config, articleTitle) {
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
     * 生成CNAME文件
     * Generate CNAME file for custom domain
     */
    async generateCnameFile(config, outputPath) {
        if (config.customDomain && config.customDomain.trim()) {
            const cnamePath = path.join(outputPath, 'CNAME');
            await fs.writeFile(cnamePath, config.customDomain.trim());
        }
    }
}
exports.SiteGenerator = SiteGenerator;
//# sourceMappingURL=SiteGenerator.js.map