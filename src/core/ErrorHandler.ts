/**
 * 错误处理器
 * Error Handler for graceful error handling and recovery
 */

import { ErrorHandler, ConfigError, FileError, ParseError, GenerationError } from '../types';

export class GracefulErrorHandler implements ErrorHandler {
  private errors: Array<{ type: string; error: Error; timestamp: Date }> = [];

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