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
export { SearchEngine } from './core/SearchEngine';
export { GracefulErrorHandler } from './core/ErrorHandler';

// 导入核心组件用于内部使用
import { ConfigManager } from './core/ConfigManager';
import { FileScanner } from './core/FileScanner';
import { MetadataParser } from './core/MetadataParser';
import { SiteGenerator } from './core/SiteGenerator';
import { SearchEngine } from './core/SearchEngine';
import { GracefulErrorHandler } from './core/ErrorHandler';
import { FileError } from './types';

// 主要功能类
export class ObsidianBlogGenerator {
  private configManager: ConfigManager;
  private fileScanner: FileScanner;
  private metadataParser: MetadataParser;
  private siteGenerator: SiteGenerator;
  private searchEngine: SearchEngine;
  private errorHandler: GracefulErrorHandler;

  constructor() {
    this.configManager = new ConfigManager();
    this.fileScanner = new FileScanner();
    this.metadataParser = new MetadataParser();
    this.siteGenerator = new SiteGenerator();
    this.searchEngine = new SearchEngine();
    this.errorHandler = new GracefulErrorHandler();
  }

  /**
   * 生成博客网站
   * Generate blog website
   */
  async generate(configPath?: string): Promise<void> {
    try {
      console.log('🚀 开始生成博客网站...');

      // 1. 加载配置
      console.log('📋 加载配置...');
      const config = await this.configManager.loadConfig(configPath);
      console.log(`   Vault路径: ${config.vaultPath}`);
      console.log(`   输出路径: ${config.outputPath}`);

      // 2. 扫描文件
      console.log('🔍 扫描Markdown文件...');
      const scanResult = await this.fileScanner.scanVault(config.vaultPath);
      console.log(`   找到 ${scanResult.files.length} 个文件`);
      
      if (scanResult.errors.length > 0) {
        console.warn(`   ${scanResult.errors.length} 个文件扫描错误`);
        scanResult.errors.forEach((error: any) => {
          this.errorHandler.handleFileError(new FileError(error.error, error.filePath));
        });
      }

      // 3. 解析文章
      console.log('📝 解析文章内容...');
      const articles = [];
      for (const filePath of scanResult.files) {
        try {
          const article = await this.metadataParser.parseFile(filePath);
          articles.push(article);
        } catch (error) {
          this.errorHandler.handleParseError(error as any);
        }
      }
      console.log(`   成功解析 ${articles.length} 篇文章`);

      // 4. 构建搜索索引
      console.log('🔎 构建搜索索引...');
      const searchIndex = this.searchEngine.buildIndex(articles);
      console.log(`   索引了 ${searchIndex.articles.length} 篇文章`);

      // 5. 生成网站
      console.log('🏗️  生成网站页面...');
      await this.siteGenerator.generateSite({
        config,
        articles,
        outputPath: config.outputPath
      });

      // 6. 生成搜索数据
      console.log('💾 生成搜索数据...');
      const searchData = this.searchEngine.generateSearchData(searchIndex);
      const fs = require('fs-extra');
      const path = require('path');
      await fs.writeFile(
        path.join(config.outputPath, 'assets', 'js', 'search-data.json'),
        searchData
      );

      console.log('✅ 博客网站生成完成!');
      console.log(`   输出目录: ${config.outputPath}`);
      
      // 显示错误统计
      const errorStats = this.errorHandler.getErrorStats();
      if (errorStats.total > 0) {
        console.log(this.errorHandler.generateErrorReport());
      }

    } catch (error) {
      const { ConfigError, GenerationError } = await import('./types');
      if (error instanceof ConfigError) {
        this.errorHandler.handleConfigError(error);
      } else if (error instanceof GenerationError) {
        this.errorHandler.handleGenerationError(error);
      } else {
        console.error('❌ 未知错误:', error);
      }
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