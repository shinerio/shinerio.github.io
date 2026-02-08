/**
 * 配置管理器
 * Configuration Manager for handling blog configuration
 */

import { BlogConfig, ValidationResult, ConfigError } from '../types';
import * as fs from 'fs-extra';
import * as path from 'path';

export class ConfigManager {
  private static readonly DEFAULT_CONFIG_NAME = 'blog.config.json';

  /**
   * 加载配置文件
   * Load configuration from file
   */
  async loadConfig(configPath?: string): Promise<BlogConfig> {
    const configFile = configPath || this.getDefaultConfigPath();
    
    try {
      if (await fs.pathExists(configFile)) {
        const configData = await fs.readJson(configFile);
        const config = { ...this.createDefaultConfig(), ...configData };
        const validation = this.validateConfig(config);
        
        if (!validation.isValid) {
          throw new ConfigError(`配置文件无效: ${validation.errors.join(', ')}`);
        }
        
        return config;
      } else {
        // 创建默认配置文件
        const defaultConfig = this.createDefaultConfig();
        await this.saveConfig(defaultConfig, configFile);
        return defaultConfig;
      }
    } catch (error) {
      if (error instanceof ConfigError) {
        throw error;
      }
      throw new ConfigError(`无法加载配置文件: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证配置
   * Validate configuration
   */
  validateConfig(config: BlogConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!config.vaultPath) {
      errors.push('vaultPath 是必需的');
    } else {
      const pathValidation = this.validatePath(config.vaultPath, 'read');
      if (!pathValidation.isValid) {
        errors.push(pathValidation.error!);
      }
    }

    if (!config.outputPath) {
      errors.push('outputPath 是必需的');
    } else {
      const pathValidation = this.validatePath(config.outputPath, 'write');
      if (!pathValidation.isValid) {
        errors.push(pathValidation.error!);
      }
    }

    if (!config.siteTitle) {
      errors.push('siteTitle 是必需的');
    }

    if (!config.author) {
      warnings.push('建议设置作者信息');
    }

    // 验证主题
    if (!['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('theme 必须是 light、dark 或 auto');
    }

    // 验证每页文章数
    if (config.postsPerPage <= 0) {
      errors.push('postsPerPage 必须大于 0');
    }

    // 验证备份路径（如果启用备份模式）
    if (config.backupMode && config.backupPath) {
      const pathValidation = this.validatePath(config.backupPath, 'write');
      if (!pathValidation.isValid) {
        errors.push(pathValidation.error!);
      }
    }

    // 验证黑名单配置
    if (config.blacklist !== undefined) {
      if (!Array.isArray(config.blacklist)) {
        errors.push('blacklist 必须是一个字符串数组');
      } else {
        for (let i = 0; i < config.blacklist.length; i++) {
          const item = config.blacklist[i];
          if (typeof item !== 'string') {
            errors.push(`blacklist[${i}] 必须是字符串`);
          } else if (item === '') {
            errors.push(`blacklist[${i}] 不能是空字符串`);
          } else if (item.includes('../')) {
            errors.push(`blacklist[${i}] 包含非法路径遍历模式 '../'`);
          }
        }
      }
    }

    // 验证自定义域名格式
    if (config.customDomain) {
      if (typeof config.customDomain !== 'string' || config.customDomain.trim() === '') {
        errors.push('customDomain 必须是非空字符串');
      } else {
        // 简单验证域名格式
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9])*$/;
        if (!domainRegex.test(config.customDomain)) {
          errors.push('customDomain 格式不正确');
        }
      }
    }

    // 验证评论配置
    if (config.comments !== undefined) {
      if (typeof config.comments !== 'object' || config.comments === null) {
        errors.push('comments 必须是一个对象');
      } else {
        if (typeof config.comments.enabled !== 'boolean') {
          errors.push('comments.enabled 必须是布尔值');
        }
        if (!config.comments.repo || typeof config.comments.repo !== 'string') {
          errors.push('comments.repo 是必需的字符串');
        } else {
          const repoRegex = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
          if (!repoRegex.test(config.comments.repo)) {
            errors.push('comments.repo 格式不正确，应为 "owner/repo"');
          }
        }
        if (config.comments.issueTerm !== undefined) {
          const validTerms = ['pathname', 'title', 'og:title', 'url'];
          if (!validTerms.includes(config.comments.issueTerm)) {
            errors.push('comments.issueTerm 必须是 pathname、title、og:title 或 url');
          }
        }
        if (config.comments.label !== undefined && typeof config.comments.label !== 'string') {
          errors.push('comments.label 必须是字符串');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 创建默认配置
   * Create default configuration
   */
  createDefaultConfig(): BlogConfig {
    return {
      vaultPath: './vault',
      outputPath: './dist',
      backupPath: 'backup',
      backupMode: false,
      siteTitle: 'My Obsidian Blog',
      siteDescription: 'A blog generated from Obsidian notes',
      author: '',
      theme: 'auto',
      postsPerPage: 10,
      customDomain: undefined
    };
  }

  /**
   * 验证路径是否有效
   * Validate if a path is valid and accessible
   */
  validatePath(pathToValidate: string, type: 'read' | 'write' = 'read'): { isValid: boolean; error?: string } {
    if (!pathToValidate || typeof pathToValidate !== 'string') {
      return { isValid: false, error: '路径不能为空' };
    }

    try {
      const resolvedPath = path.resolve(pathToValidate);
      
      if (type === 'read') {
        // 验证读取权限
        if (!fs.pathExistsSync(resolvedPath)) {
          return { isValid: false, error: `路径不存在: ${pathToValidate}` };
        }
        
        try {
          fs.accessSync(resolvedPath, fs.constants.R_OK);
          return { isValid: true };
        } catch {
          return { isValid: false, error: `路径不可读: ${pathToValidate}` };
        }
      } else {
        // 验证写入权限
        const parentDir = path.dirname(resolvedPath);
        
        if (!fs.pathExistsSync(parentDir)) {
          try {
            fs.ensureDirSync(parentDir);
            return { isValid: true };
          } catch {
            return { isValid: false, error: `父目录无法创建: ${parentDir}` };
          }
        } else {
          try {
            fs.accessSync(parentDir, fs.constants.W_OK);
            return { isValid: true };
          } catch {
            return { isValid: false, error: `父目录不可写: ${parentDir}` };
          }
        }
      }
    } catch (error) {
      return { isValid: false, error: `路径无效: ${pathToValidate}` };
    }
  }

  /**
   * 保存配置文件
   * Save configuration to file
   */
  async saveConfig(config: BlogConfig, configPath?: string): Promise<void> {
    const configFile = configPath || this.getDefaultConfigPath();
    
    try {
      await fs.ensureDir(path.dirname(configFile));
      await fs.writeJson(configFile, config, { spaces: 2 });
    } catch (error) {
      throw new ConfigError(`无法保存配置文件: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取默认配置文件路径
   * Get default configuration file path
   */
  private getDefaultConfigPath(): string {
    return path.join(process.cwd(), ConfigManager.DEFAULT_CONFIG_NAME);
  }
}