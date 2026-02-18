/**
 * Obsidian博客生成器主入口
 * Main entry point for Obsidian Blog Generator
 */

// 导出核心类型
export * from './types';

// 导出核心组件
export { ConfigManager } from './core/ConfigManager';
export { FileScanner } from './core/FileScanner';
export { MetadataParser } from './core/MetadataParser';
export { SiteGenerator } from './core/SiteGenerator';
export { SearchEngine } from './core/SearchEngine';  // Keep for backward compatibility
export { SearchCoordinator } from './core/SearchCoordinator';  // New export
export { GracefulErrorHandler } from './core/ErrorHandler';

// 导入核心组件用于内部使用
import { ConfigManager } from './core/ConfigManager';
import { FileScanner } from './core/FileScanner';
import { MetadataParser } from './core/MetadataParser';
import { SiteGenerator } from './core/SiteGenerator';
import { SearchCoordinator } from './core/SearchCoordinator';  // Changed import
import { GracefulErrorHandler } from './core/ErrorHandler';
import { ConfigError, GenerationError, FileError, ParseError, ProgressReport, BreakpointState, ScanResult } from './types';

// 导入系统模块
import * as path from 'path';

// 主要功能类
export class ObsidianBlogGenerator {
  private configManager: ConfigManager;
  private fileScanner: FileScanner;
  private metadataParser: MetadataParser;
  private siteGenerator: SiteGenerator;
  private searchEngine: SearchCoordinator;  // Changed type
  private errorHandler: GracefulErrorHandler;

  constructor() {
    this.configManager = new ConfigManager();
    this.fileScanner = new FileScanner();
    this.metadataParser = new MetadataParser();
    this.siteGenerator = new SiteGenerator();
    this.searchEngine = new SearchCoordinator();  // Changed instantiation
    this.errorHandler = new GracefulErrorHandler(); // No temp dir override in production
  }

  /**
   * 生成博客网站
   * Generate blog website
   */
  async generate(configPath?: string, resumeFromBreakpoint: boolean = false): Promise<boolean> {
    try {
      // 检查是否需要从断点恢复
      if (resumeFromBreakpoint) {
        const breakpoint = await this.errorHandler.loadBreakpoint();
        if (breakpoint) {
          console.log(`🔄 尝试从断点恢复: ${breakpoint.stage} (${Math.round(breakpoint.progress)}%)`);
          // 简单实现：直接提示用户断点恢复逻辑
          console.log('💡 断点恢复功能待完善：当前仅支持从指定阶段开始重新运行整个流程');
        }
      }

      console.log('🚀 开始生成博客网站...');

      // 注册进度报告
      const unsubscribe = this.errorHandler.subscribeProgress((report: ProgressReport) => {
        // 在这里可以添加额外的进度处理逻辑
        // 比如更新UI、记录日志到文件等
      });

      // 1. 加载配置
      this.errorHandler.reportProgress({ stage: 'CONFIG', current: 1, total: 6, message: '加载配置...' });
      console.log('📋 加载配置...');
      const config = await this.configManager.loadConfig(configPath);
      console.log(`   Vault路径: ${config.vaultPath}`);
      console.log(`   输出路径: ${config.outputPath}`);

      // 保存配置阶段的断点
      await this.errorHandler.saveBreakpoint({
        stage: 'CONFIG_LOADED',
        progress: 15,
        timestamp: new Date(),
        metadata: { outputPath: config.outputPath, vaultPath: config.vaultPath }
      });

      // 2. 扫描文件
      this.errorHandler.reportProgress({ stage: 'SCANNING', current: 2, total: 6, message: '扫描Markdown文件...' });
      console.log('🔍 扫描Markdown文件...');
      const scanResult: ScanResult = await this.fileScanner.scanVault(config.vaultPath, config.blacklist || []);
      console.log(`   找到 ${scanResult.files.length} 个文件`);

      if (scanResult.errors.length > 0) {
        console.warn(`   ${scanResult.errors.length} 个文件扫描错误`);
        scanResult.errors.forEach((error: any) => {
          this.errorHandler.handleFileError(new FileError(error.error, error.filePath));
        });
      }

      // 保存扫描阶段的断点
      await this.errorHandler.saveBreakpoint({
        stage: 'FILES_SCANNED',
        progress: 30,
        timestamp: new Date(),
        metadata: { fileCount: scanResult.files.length }
      });

      // 2.5 批量构建 Git 日期缓存（性能优化）
      console.log('⚡ 批量构建 Git 日期缓存...');
      await this.metadataParser.buildGitDateCache(scanResult.files);

      // 3. 解析文章
      this.errorHandler.reportProgress({ stage: 'PARSING', current: 3, total: 6, message: '解析文章内容...' });
      console.log('📝 解析文章内容...');
      const articles = [];
      const totalFiles = scanResult.files.length;
      for (let i = 0; i < scanResult.files.length; i++) {
        const filePath = scanResult.files[i];
        try {
          const article = await this.metadataParser.parseFile(filePath);
          if (!article.content.trim()) {
            console.log(`   跳过空文件: ${path.basename(filePath)}`);
            continue;
          }
          articles.push(article);

          // 报告解析进度
          this.errorHandler.reportProgress({
            stage: 'PARSING',
            current: i + 1,
            total: totalFiles,
            message: `正在解析: ${path.basename(filePath)}`
          });
        } catch (error) {
          this.errorHandler.handleParseError(error as ParseError);
        }
      }
      console.log(`   成功解析 ${articles.length} 篇文章`);

      // 保存解析阶段的断点
      await this.errorHandler.saveBreakpoint({
        stage: 'ARTICLES_PARSED',
        progress: 50,
        timestamp: new Date(),
        metadata: { articleCount: articles.length }
      });

      // 4. 构建搜索索引
      this.errorHandler.reportProgress({ stage: 'INDEXING', current: 4, total: 6, message: '构建搜索索引...' });
      console.log('🔎 构建搜索索引...');
      const searchIndex = this.searchEngine.buildIndex(articles);
      console.log(`   索引了 ${searchIndex.articles.length} 篇文章`);

      // 保存索引阶段的断点
      await this.errorHandler.saveBreakpoint({
        stage: 'SEARCH_INDEXED',
        progress: 70,
        timestamp: new Date(),
        metadata: { indexedCount: searchIndex.articles.length }
      });

      // 5. 生成网站
      this.errorHandler.reportProgress({ stage: 'GENERATING', current: 5, total: 6, message: '生成网站页面...' });
      console.log('🏗️  生成网站页面...');
      await this.siteGenerator.generateSite({
        config,
        articles,
        outputPath: config.outputPath
      });

      // 6. 生成搜索数据
      this.errorHandler.reportProgress({ stage: 'SAVING_SEARCH_DATA', current: 6, total: 6, message: '生成搜索数据...' });
      console.log('💾 生成搜索数据...');
      const fs = require('fs-extra');
      const assetsPath = path.join(config.outputPath, 'assets', 'js');
      await fs.ensureDir(assetsPath); // 确保目录存在
      const searchData = this.searchEngine.generateSearchData(searchIndex);
      await fs.writeFile(
        path.join(config.outputPath, 'assets', 'js', 'search-data.json'),
        searchData
      );

      // 清除断点文件（生成完成）
      await this.errorHandler.clearBreakpoint();

      console.log('✅ 博客网站生成完成!');
      console.log(`   输出目录: ${config.outputPath}`);

      // 显示错误统计
      const errorStats = this.errorHandler.getErrorStats();
      if (errorStats.total > 0) {
        console.log(this.errorHandler.generateErrorReport());
      }

      // 取消订阅进度报告
      unsubscribe();

      return true;

    } catch (error) {
      const unsubscribe = this.errorHandler.subscribeProgress((report: ProgressReport) => {
        // 记录错误时的进度信息
        console.error(`❌ 错误发生在阶段: ${report.stage}, 进度: ${report.current}/${report.total}`);
      });

      if (error instanceof ConfigError) {
        this.errorHandler.handleConfigError(error);
      } else if (error instanceof GenerationError) {
        this.errorHandler.handleGenerationError(error);
      } else {
        console.error('❌ 未知错误:', error);
      }

      unsubscribe();
      throw error;
    }
  }

  /**
   * 获取错误处理器
   * Get error handler
   */
  getErrorHandler(): GracefulErrorHandler {
    return this.errorHandler;
  }
}