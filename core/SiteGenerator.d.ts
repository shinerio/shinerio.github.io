/**
 * 网站生成器
 * Site Generator for creating HTML pages and static assets
 */
import { GenerationOptions, Article, BlogConfig } from '../types';
export declare class SiteGenerator {
    private templateCache;
    /**
     * 生成网站
     * Generate complete website
     */
    generateSite(options: GenerationOptions): Promise<void>;
    /**
     * 渲染侧边栏
     * Render sidebar HTML
     */
    private renderSidebar;
    /**
     * 生成首页
     * Generate home page
     */
    generateHomePage(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void>;
    /**
     * 生成文章列表页
     * Generate article list page
     */
    generateArticleList(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void>;
    /**
     * 生成搜索页面
     * Generate search page
     */
    generateSearchPage(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void>;
    generateArticlePages(articles: Article[], options: GenerationOptions, outputPath: string): Promise<void>;
    /**
     * 生成 TODO 页面
     * Generate TODO Kanban board page
     */
    generateTodoPage(options: GenerationOptions, outputPath: string): Promise<void>;
    /**
     * 从 GitHub URL 中提取用户名
     * Extract GitHub username from GitHub profile URL
     */
    private extractGithubUsername;
    /**
     * 复制静态资源
     * Copy static assets
     */
    copyStaticAssets(outputPath: string): Promise<void>;
    /**
     * 复制 Markdown 源文件
     * Copy markdown source files to output directory
     */
    private copyMarkdownFiles;
    /**
     * 转换为完整的文章数据结构
     * Convert parsed articles to full article data structure
     */
    private convertToArticles;
    /**
     * 加载模板文件
     * Load template file
     */
    private loadTemplate;
    /**
     * 渲染模板
     * Render template with data
     */
    private renderTemplate;
    /**
     * 转换Markdown为HTML
     * Convert markdown to HTML
     */
    private convertMarkdownToHtml;
    /**
     * 处理Obsidian内部链接
     * Process Obsidian internal links
     */
    private processObsidianLinks;
    /**
     * 生成目录
     * Generate table of contents
     */
    private generateTableOfContents;
    /**
     * 获取相关文章
     * Get related articles based on tags
     */
    private getRelatedArticles;
    /**
     * 获取热门标签
     * Get popular tags
     */
    private getPopularTags;
    /**
     * 渲染文章卡片
     * Render article card for home page
     */
    private renderArticleCard;
    /**
     * 渲染文章列表项
     * Render article list item
     */
    private renderArticleListItem;
    /**
     * 生成文章ID
     * Generate article ID
     */
    private generateId;
    /**
     * 创建URL友好的slug
     * Create URL-friendly slug
     */
    private createSlug;
    /**
     * 从内容中提取描述
     * Extract description from content
     */
    private extractDescription;
    /**
     * 格式化日期
     * Format date for display
     */
    private formatDate;
    /**
     * 生成评论脚本
     * Generate Utterances comments script tag
     */
    private generateCommentsScript;
    /**
     * 生成划词评论相关的 head 内容
     * Generate text selection comment head content
     */
    private generateTextSelectionCommentHead;
    /**
     * 生成CNAME文件
     * Generate CNAME file for custom domain
     */
    generateCnameFile(config: BlogConfig, outputPath: string): Promise<void>;
}
//# sourceMappingURL=SiteGenerator.d.ts.map