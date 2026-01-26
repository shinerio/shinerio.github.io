/**
 * 文件扫描器
 * File Scanner for discovering markdown files in Obsidian vault
 */

import { ScanResult, ScanError, FileStats, FileError } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class FileScanner {
  private static readonly MARKDOWN_EXTENSIONS = ['.md', '.markdown'];

  /**
   * 扫描vault目录
   * Scan vault directory for markdown files
   */
  async scanVault(vaultPath: string): Promise<ScanResult> {
    const result: ScanResult = {
      files: [],
      errors: [],
      totalSize: 0
    };

    try {
      if (!await fs.pathExists(vaultPath)) {
        throw new FileError(`Vault路径不存在: ${vaultPath}`, vaultPath);
      }

      const stats = await fs.stat(vaultPath);
      if (!stats.isDirectory()) {
        throw new FileError(`Vault路径不是目录: ${vaultPath}`, vaultPath);
      }

      await this.scanDirectory(vaultPath, result);
    } catch (error) {
      if (error instanceof FileError) {
        result.errors.push({
          filePath: vaultPath,
          error: error.message,
          type: 'not_found'
        });
      } else {
        result.errors.push({
          filePath: vaultPath,
          error: error instanceof Error ? error.message : String(error),
          type: 'other'
        });
      }
    }

    return result;
  }

  /**
   * 递归扫描目录
   * Recursively scan directory
   */
  private async scanDirectory(dirPath: string, result: ScanResult): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        try {
          if (entry.isDirectory()) {
            // 跳过隐藏目录和特殊目录
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await this.scanDirectory(fullPath, result);
            }
          } else if (entry.isFile() && this.isMarkdownFile(fullPath)) {
            const stats = await this.getFileStats(fullPath);
            result.files.push(fullPath);
            result.totalSize += stats.size;
          }
        } catch (error) {
          result.errors.push({
            filePath: fullPath,
            error: error instanceof Error ? error.message : String(error),
            type: this.getErrorType(error)
          });
        }
      }
    } catch (error) {
      result.errors.push({
        filePath: dirPath,
        error: error instanceof Error ? error.message : String(error),
        type: this.getErrorType(error)
      });
    }
  }

  /**
   * 检查是否为markdown文件
   * Check if file is a markdown file
   */
  isMarkdownFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return FileScanner.MARKDOWN_EXTENSIONS.includes(ext);
  }

  /**
   * 获取文件统计信息
   * Get file statistics
   */
  async getFileStats(filePath: string): Promise<FileStats> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      throw new FileError(`无法获取文件统计信息: ${error instanceof Error ? error.message : String(error)}`, filePath);
    }
  }

  /**
   * 确定错误类型
   * Determine error type
   */
  private getErrorType(error: unknown): ScanError['type'] {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('permission') || message.includes('access')) {
        return 'permission';
      }
      if (message.includes('not found') || message.includes('enoent')) {
        return 'not_found';
      }
    }
    return 'other';
  }
}