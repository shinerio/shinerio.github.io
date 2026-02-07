/**
 * 错误处理器
 * Error Handler for graceful error handling and recovery
 */

import { ErrorHandler, ConfigError, FileError, ParseError, GenerationError, ProgressReport, BreakpointState, ProgressCallback } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export class GracefulErrorHandler implements ErrorHandler {
  private errors: Array<{ type: string; error: Error; timestamp: Date }> = [];
  private progressCallbacks: ProgressCallback[] = [];
  private breakpointFilePath: string;

  constructor(tempDirOverride?: string) {
    // Use override directory if provided (for tests), otherwise use system temp
    const tempDir = tempDirOverride || path.join(os.tmpdir(), `obsidian-blog-generator-${Date.now()}-${Math.random()}`);
    fs.ensureDirSync(tempDir);
    this.breakpointFilePath = path.join(tempDir, '.blog_generator_breakpoint.json');
  }

  /**
   * 处理配置错误
   * Handle configuration errors
   */
  handleConfigError(error: ConfigError): void {
    this.logError('CONFIG', error);
    console.error(`❌ 配置错误: ${error.message}`);
    if (error.field) {
      console.error(`   字段: ${error.field}`);
    }
    console.error('   请检查配置文件并修正错误后重试。');
  }

  /**
   * 处理文件错误
   * Handle file system errors
   */
  handleFileError(error: FileError): void {
    this.logError('FILE', error);
    console.warn(`⚠️  文件错误: ${error.message}`);
    console.warn(`   文件路径: ${error.filePath}`);
    console.warn('   跳过此文件，继续处理其他文件...');
  }

  /**
   * 处理解析错误
   * Handle parsing errors
   */
  handleParseError(error: ParseError): void {
    this.logError('PARSE', error);
    console.warn(`⚠️  解析错误: ${error.message}`);
    console.warn(`   文件路径: ${error.filePath}`);
    console.warn('   跳过此文件，继续处理其他文件...');
  }

  /**
   * 处理生成错误
   * Handle generation errors
   */
  handleGenerationError(error: GenerationError): void {
    this.logError('GENERATION', error);
    console.error(`❌ 生成错误: ${error.message}`);
    if (error.context) {
      console.error(`   上下文: ${error.context}`);
    }
    console.error('   生成过程已中断。');
  }

  /**
   * 报告进度
   * Report progress to subscribers
   */
  reportProgress(report: ProgressReport): void {
    console.log(`📊 [${report.stage}] ${report.current}/${report.total} - ${report.message}`);

    // 调用所有进度回调函数
    this.progressCallbacks.forEach(callback => {
      try {
        callback(report);
      } catch (err) {
        console.error('❌ 进度回调函数执行错误:', err);
      }
    });
  }

  /**
   * 订阅进度更新
   * Subscribe to progress updates
   * @returns unsubscribe function
   */
  subscribeProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.push(callback);

    // 返回取消订阅函数
    return () => {
      const index = this.progressCallbacks.indexOf(callback);
      if (index !== -1) {
        this.progressCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 保存断点状态
   * Save checkpoint state to file
   */
  async saveBreakpoint(state: BreakpointState): Promise<void> {
    try {
      const stateToSave = {
        ...state,
        timestamp: state.timestamp.toISOString() // 将日期序列化为字符串
      };

      // Ensure the directory exists before writing the file
      const tempDir = path.dirname(this.breakpointFilePath);
      await fs.ensureDir(tempDir);

      await fs.writeJson(this.breakpointFilePath, stateToSave, { encoding: 'utf-8' });
      console.log(`💾 断点状态已保存: ${state.stage} (${state.progress}%)`);
    } catch (error) {
      console.error('❌ 保存断点状态失败:', error);
      this.logError('BREAKPOINT_SAVE_ERROR', error as Error);
    }
  }

  /**
   * 加载断点状态
   * Load checkpoint state from file
   */
  async loadBreakpoint(): Promise<BreakpointState | null> {
    try {
      if (await fs.pathExists(this.breakpointFilePath)) {
        const stateData = await fs.readJson(this.breakpointFilePath);

        return {
          ...stateData,
          timestamp: new Date(stateData.timestamp) // 将字符串反序列化为日期对象
        };
      }

      return null;
    } catch (error) {
      console.error('❌ 加载断点状态失败:', error);
      this.logError('BREAKPOINT_LOAD_ERROR', error as Error);
      return null;
    }
  }

  /**
   * 清除断点状态
   * Clear checkpoint state from file
   */
  async clearBreakpoint(): Promise<void> {
    try {
      if (await fs.pathExists(this.breakpointFilePath)) {
        await fs.remove(this.breakpointFilePath);
        console.log('🗑️  断点状态已清除');
      }

      // Also clean up the temp directory if it's empty
      const tempDir = path.dirname(this.breakpointFilePath);
      try {
        if (await fs.pathExists(tempDir)) { // Check if directory still exists
          const dirContents = await fs.readdir(tempDir);
          if (dirContents.length === 0) {
            await fs.remove(tempDir);
          }
        }
      } catch (cleanupError: unknown) {
        // If directory isn't empty or other issues, just continue
        console.debug('临时目录清理时遇到问题（通常这没关系）:', (cleanupError as Error).message);
      }
    } catch (error) {
      console.error('❌ 清除断点状态失败:', error);
      this.logError('BREAKPOINT_CLEAR_ERROR', error as Error);
    }
  }

  /**
   * 获取错误统计
   * Get error statistics
   */
  getErrorStats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};

    this.errors.forEach(({ type }) => {
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      total: this.errors.length,
      byType
    };
  }

  /**
   * 清除错误记录
   * Clear error records
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * 获取所有错误
   * Get all errors
   */
  getAllErrors(): Array<{ type: string; error: Error; timestamp: Date }> {
    return [...this.errors];
  }

  /**
   * 记录错误
   * Log error internally
   */
  private logError(type: string, error: Error): void {
    this.errors.push({
      type,
      error,
      timestamp: new Date()
    });
  }

  /**
   * 生成错误报告
   * Generate error report
   */
  generateErrorReport(): string {
    if (this.errors.length === 0) {
      return '✅ 没有错误记录';
    }

    const stats = this.getErrorStats();
    let report = `\n📊 错误统计:\n`;
    report += `   总计: ${stats.total} 个错误\n`;

    Object.entries(stats.byType).forEach(([type, count]) => {
      report += `   ${type}: ${count} 个\n`;
    });

    report += '\n📝 详细错误:\n';
    this.errors.forEach(({ type, error, timestamp }, index) => {
      report += `   ${index + 1}. [${type}] ${timestamp.toLocaleString()}\n`;
      report += `      ${error.message}\n`;
    });

    return report;
  }
}