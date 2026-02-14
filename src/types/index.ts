/**
 * 核心数据接口和类型定义
 * Core data interfaces and type definitions for Obsidian Blog Generator
 */

// 评论配置接口
export interface CommentsConfig {
  enabled: boolean;
  repo: string;                // "owner/repo" 格式
  issueTerm?: 'pathname' | 'title' | 'og:title' | 'url';
  label?: string;              // Issues 标签，用于区分评论和普通 Issue
  // 划词评论配置
  annotation?: {
    enabled: boolean;          // 是否启用划词评论
    label?: string;            // 用于划词评论的 GitHub label，默认 'text-annotation'
    oauthClientId?: string;    // GitHub OAuth App Client ID
    oauthProxyUrl?: string;    // Cloudflare Worker URL for OAuth proxy
  };
}

// TODO 配置接口
export interface TodoConfig {
  enabled: boolean;
  projectNumber: number;       // GitHub Projects v2 project number
  repo?: string;               // Repo name (default: "TODO")
  oauthClientId?: string;      // GitHub OAuth App client ID
  oauthProxyUrl?: string;      // Cloudflare Worker URL for OAuth proxy
}

// 博客配置接口
export interface BlogConfig {
  vaultPath: string;
  outputPath: string;
  backupPath?: string;
  backupMode?: boolean;
  siteTitle: string;
  siteDescription: string;
  author: string;
  theme: 'light' | 'dark' | 'auto';
  postsPerPage: number;
  blacklist?: string[]; // Array of file/folder paths to exclude from processing
  customDomain?: string; // Custom domain for GitHub Pages deployment
  githubUrl?: string; // GitHub profile URL
  comments?: CommentsConfig; // 评论功能配置
  todo?: TodoConfig; // TODO 看板功能配置
}

// 配置验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 文件扫描结果
export interface ScanResult {
  files: string[];
  errors: ScanError[];
  totalSize: number;
}

// 扫描错误信息
export interface ScanError {
  filePath: string;
  error: string;
  type: 'permission' | 'not_found' | 'invalid_format' | 'other';
}

// 文件统计信息
export interface FileStats {
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
}

// 文章元数据
export interface ArticleMetadata {
  title: string;
  date: Date;
  tags: string[];
  description?: string;
  draft?: boolean;
  slug?: string;
}

// 解析后的文章
export interface ParsedArticle {
  metadata: ArticleMetadata;
  content: string;
  filePath: string;
  wordCount: number;
}

// 完整的文章数据结构
export interface Article {
  id: string;
  title: string;
  slug: string;
  date: Date;
  tags: string[];
  description: string;
  content: string;
  htmlContent: string;
  wordCount: number;
  readingTime: number;
  filePath: string;
  isDraft: boolean;
}

// 网站生成选项
export interface GenerationOptions {
  config: BlogConfig;
  articles: ParsedArticle[];
  outputPath: string;
}

// 网站数据结构
export interface SiteData {
  config: BlogConfig;
  articles: Article[];
  tags: TagInfo[];
  recentArticles: Article[];
  totalArticles: number;
  lastUpdated: Date;
}

// 标签信息
export interface TagInfo {
  name: string;
  count: number;
  articles: Article[];
}

// 搜索索引条目
export interface SearchIndexEntry {
  articleIndex: number;
  weight: number;
}

// 搜索索引
export interface SearchIndex {
  articles: SearchableArticle[];
  index: Map<string, SearchIndexEntry[]>;
}

// 可搜索的文章
export interface SearchableArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  slug: string;
}

// 搜索匹配位置信息
export interface SearchMatchLocation {
  inTitle: boolean;
  inContent: boolean;
  inTags: boolean;
}

// 搜索结果
export interface SearchResult {
  article: ParsedArticle;
  score: number;
  highlights: string[];
  matchLocations?: SearchMatchLocation; // Optional field indicating where matches occurred
}

// 错误类型定义
export class ConfigError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export class FileError extends Error {
  constructor(message: string, public filePath: string) {
    super(message);
    this.name = 'FileError';
  }
}

export class ParseError extends Error {
  constructor(message: string, public filePath: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class GenerationError extends Error {
  constructor(message: string, public context?: string) {
    super(message);
    this.name = 'GenerationError';
  }
}

// 进度报告接口
export interface ProgressReport {
  stage: string;
  current: number;
  total: number;
  message: string;
}

// 断点续传状态接口
export interface BreakpointState {
  stage: string;
  progress: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// 进度回调函数类型
export type ProgressCallback = (report: ProgressReport) => void;

// 错误处理器接口
export interface ErrorHandler {
  handleConfigError(error: ConfigError): void;
  handleFileError(error: FileError): void;
  handleParseError(error: ParseError): void;
  handleGenerationError(error: GenerationError): void;

  // 进度报告方法
  reportProgress(report: ProgressReport): void;
  subscribeProgress(callback: ProgressCallback): () => void; // 返回取消订阅函数

  // 断点续传方法
  saveBreakpoint(state: BreakpointState): Promise<void>;
  loadBreakpoint(): Promise<BreakpointState | null>;
  clearBreakpoint(): Promise<void>;
}