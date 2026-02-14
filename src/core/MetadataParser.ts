/**
 * 元数据解析器
 * Metadata Parser for extracting frontmatter and processing markdown content
 */

import { ArticleMetadata, ParsedArticle, ParseError } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';

export class MetadataParser {
  private gitRootCache: string | null | undefined = undefined; // undefined = 未初始化, null = 不是 git 仓库, string = git 根目录
  private gitDateCache: Map<string, Date> = new Map(); // 批量缓存所有文件的 git 第一次 commit 时间

  /**
   * 批量构建所有文件的 Git 日期缓存（性能优化）
   * Build git date cache for all files in batch (performance optimization)
   */
  async buildGitDateCache(filePaths: string[]): Promise<void> {
    if (filePaths.length === 0) {
      return;
    }

    try {
      // 获取 git 根目录
      const gitRoot = this.getGitRoot(filePaths[0]);
      if (!gitRoot) {
        return; // 不是 git 仓库，跳过
      }

      // 将所有文件路径转为相对路径
      const relativePaths = filePaths.map(filePath =>
        path.relative(gitRoot, path.resolve(filePath))
      );

      // 批量执行 git log 获取所有文件的第一次 commit 时间
      // 使用 --name-only 和 --diff-filter=A 找出每个文件的第一次添加时间
      const command = `git log --all --name-only --diff-filter=A --format=%aI`;

      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: gitRoot,
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 10000 // 10秒超时（批量查询需要更长时间）
      }).trim();

      if (!output) {
        return;
      }

      // 解析输出：格式为 "日期\n文件名\n文件名\n...\n日期\n文件名\n..."
      const lines = output.split('\n');
      let currentDate: string | null = null;

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          continue;
        }

        // 检查是否是日期行（ISO 8601 格式）
        if (/^\d{4}-\d{2}-\d{2}T/.test(trimmedLine)) {
          currentDate = trimmedLine;
        } else if (currentDate) {
          // 这是一个文件路径
          const normalizedPath = trimmedLine.replace(/\\/g, '/');

          // 检查这个文件是否在我们要处理的文件列表中
          const matchedIndex = relativePaths.findIndex(relPath =>
            relPath.replace(/\\/g, '/') === normalizedPath
          );

          if (matchedIndex !== -1) {
            const absolutePath = path.resolve(filePaths[matchedIndex]);

            // 只缓存第一次出现的日期（最早的添加时间）
            if (!this.gitDateCache.has(absolutePath)) {
              const date = new Date(currentDate);
              if (!isNaN(date.getTime())) {
                this.gitDateCache.set(absolutePath, date);
              }
            }
          }
        }
      }

      console.log(`   Git 日期缓存: ${this.gitDateCache.size}/${filePaths.length} 个文件`);
    } catch (error) {
      // 批量查询失败，回退到单文件查询模式（保持兼容性）
      console.warn('   Git 批量查询失败，将使用单文件查询模式');
    }
  }

  /**
   * 解析文件
   * Parse markdown file
   */
  async parseFile(filePath: string): Promise<ParsedArticle> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = matter(content);
      
      const metadata = this.extractFrontmatter(parsed.data, filePath);
      const processedContent = this.processMarkdown(parsed.content);
      const wordCount = this.calculateWordCount(processedContent);

      return {
        metadata,
        content: processedContent,
        filePath,
        wordCount
      };
    } catch (error) {
      throw new ParseError(
        `解析文件失败: ${error instanceof Error ? error.message : String(error)}`,
        filePath
      );
    }
  }

  /**
   * 提取frontmatter元数据
   * Extract frontmatter metadata
   */
  extractFrontmatter(data: any, filePath: string): ArticleMetadata {
    const fileName = path.basename(filePath, path.extname(filePath));

    // 获取默认日期：优先使用 git 第一次 commit 时间，其次使用文件系统时间
    const defaultDate = this.getFileDate(filePath);

    return {
      title: this.extractTitle(data, fileName),
      date: this.extractDate(data, defaultDate),
      tags: this.extractTags(data),
      description: this.extractDescription(data),
      draft: this.extractDraft(data),
      slug: this.extractSlug(data, fileName)
    };
  }

  /**
   * 获取文件日期：优先 git 第一次 commit 时间，其次文件系统时间
   * Get file date: prefer git first commit time, fallback to file system time
   */
  private getFileDate(filePath: string): Date {
    // 1. 尝试从 git 获取第一次 commit 时间
    const gitDate = this.getGitFirstCommitDate(filePath);
    if (gitDate) {
      return gitDate;
    }

    // 2. 回退到文件系统时间
    try {
      const stats = fs.statSync(filePath);
      // 使用文件创建时间，如果创建时间不可用则使用修改时间
      return stats.birthtime && stats.birthtime.getTime() > 0 ? stats.birthtime : stats.mtime;
    } catch {
      return new Date();
    }
  }

  /**
   * 获取 git 仓库根目录（带缓存）
   * Get git repository root directory (with cache)
   */
  private getGitRoot(filePath: string): string | null {
    // 如果已经缓存过，直接返回
    if (this.gitRootCache !== undefined) {
      return this.gitRootCache;
    }

    try {
      const absolutePath = path.resolve(filePath);
      const fileDir = path.dirname(absolutePath);

      const gitRoot = execSync('git rev-parse --show-toplevel', {
        encoding: 'utf-8',
        cwd: fileDir,
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 2000
      }).trim();

      // 缓存结果（成功或失败都缓存，避免重复查询）
      this.gitRootCache = gitRoot || null;
      return this.gitRootCache;
    } catch {
      // 不是 git 仓库，缓存 null
      this.gitRootCache = null;
      return null;
    }
  }

  /**
   * 获取文件的 git 第一次 commit 时间（优化版：优先从缓存读取）
   * Get git first commit date for the file (optimized: prefer cache)
   */
  private getGitFirstCommitDate(filePath: string): Date | null {
    const absolutePath = path.resolve(filePath);

    // 优先从缓存中读取（批量查询的结果）
    if (this.gitDateCache.has(absolutePath)) {
      return this.gitDateCache.get(absolutePath) || null;
    }

    // 缓存中没有，执行单文件查询（兼容性回退）
    try {
      // 获取 git 根目录（带缓存）
      const gitRoot = this.getGitRoot(filePath);
      if (!gitRoot) {
        return null;
      }

      // 计算文件相对于仓库根目录的相对路径
      const relativePath = path.relative(gitRoot, absolutePath);

      // 优化后的 git log 命令：
      // --diff-filter=A: 只查找文件添加（Add）记录，通常只有一条，比 --reverse 快得多
      // --follow: 跟踪文件重命名
      // --format=%aI: 输出 ISO 8601 格式的作者时间
      // -- <file>: 指定文件路径
      const command = `git log --diff-filter=A --follow --format=%aI -- "${relativePath}"`;
      const output = execSync(command, {
        encoding: 'utf-8',
        cwd: gitRoot,
        stdio: ['pipe', 'pipe', 'ignore'],
        timeout: 3000 // 降低超时时间（优化后的命令更快）
      }).trim();

      if (output) {
        // --diff-filter=A 通常只返回一条记录（文件被添加的那次 commit）
        // 如果有多条（罕见），取第一条
        const firstCommitDate = output.split('\n')[0];
        const date = new Date(firstCommitDate);

        if (!isNaN(date.getTime())) {
          // 缓存结果
          this.gitDateCache.set(absolutePath, date);
          return date;
        }
      }
    } catch (error) {
      // 如果不是 git 仓库或其他错误，静默失败，返回 null
      // 这样会回退到文件系统时间
    }

    return null;
  }

  /**
   * 处理markdown内容
   * Process markdown content
   */
  processMarkdown(content: string): string {
    // 移除多余的空行
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // 处理Obsidian内部链接 [[link]] -> <a href="link.html" class="internal-link">link</a>
    content = content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
      const slug = this.createSlug(linkText);
      return `<a href="${slug}.html" class="internal-link">${linkText}</a>`;
    });

    // 处理Obsidian标签 #tag
    content = content.replace(/#([a-zA-Z0-9\u4e00-\u9fa5_-]+)/g, '<span class="tag">#$1</span>');

    return content.trim();
  }

  /**
   * 计算字数
   * Calculate word count
   */
  private calculateWordCount(content: string): number {
    // 移除markdown语法和HTML标签
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // 代码块
      .replace(/`[^`]+`/g, '') // 行内代码
      .replace(/!\[.*?\]\(.*?\)/g, '') // 图片
      .replace(/\[.*?\]\(.*?\)/g, '') // 链接
      .replace(/<[^>]*>/g, '') // HTML标签
      .replace(/[#*_~`]/g, '') // markdown符号
      .replace(/\s+/g, ' ') // 多个空格合并
      .trim();

    // 中英文混合字数统计
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = plainText.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(word => word.length > 0).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 提取标题
   * Extract title from frontmatter or filename
   */
  private extractTitle(data: any, fileName: string): string {
    if (data.title && typeof data.title === 'string') {
      return data.title.trim();
    }
    
    // 从文件名生成标题
    return fileName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * 提取日期
   * Extract date from frontmatter, with fallback to defaultDate
   * Priority: frontmatter.date > frontmatter.created > defaultDate (git commit time or file system time)
   */
  private extractDate(data: any, defaultDate: Date): Date {
    // 优先级1: frontmatter 中的 date 字段
    if (data.date) {
      const date = new Date(data.date);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // 优先级2: frontmatter 中的 created 字段（兼容性）
    if (data.created) {
      const date = new Date(data.created);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // 优先级3: defaultDate（已包含 git commit 时间 > 文件系统时间的逻辑）
    return defaultDate;
  }

  /**
   * 提取标签
   * Extract tags from frontmatter
   */
  private extractTags(data: any): string[] {
    if (Array.isArray(data.tags)) {
      return data.tags.filter((tag: any) => typeof tag === 'string').map((tag: string) => tag.trim());
    }
    
    if (typeof data.tags === 'string') {
      return data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
    }

    if (Array.isArray(data.tag)) {
      return data.tag.filter((tag: any) => typeof tag === 'string').map((tag: string) => tag.trim());
    }

    return [];
  }

  /**
   * 提取描述
   * Extract description from frontmatter
   */
  private extractDescription(data: any): string | undefined {
    if (data.description && typeof data.description === 'string') {
      return data.description.trim();
    }
    
    if (data.summary && typeof data.summary === 'string') {
      return data.summary.trim();
    }

    return undefined;
  }

  /**
   * 提取草稿状态
   * Extract draft status from frontmatter
   */
  private extractDraft(data: any): boolean {
    if (typeof data.draft === 'boolean') {
      return data.draft;
    }
    
    if (typeof data.draft === 'string') {
      return data.draft.toLowerCase() === 'true';
    }

    return false;
  }

  /**
   * 提取或生成slug
   * Extract or generate slug from frontmatter or filename
   */
  private extractSlug(data: any, fileName: string): string {
    if (data.slug && typeof data.slug === 'string') {
      return this.createSlug(data.slug);
    }

    return this.createSlug(fileName);
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
}