#!/usr/bin/env node

/**
 * 命令行接口
 * Command Line Interface for Obsidian Blog Generator
 */

import { Command } from 'commander';
import { ObsidianBlogGenerator } from './index';
import * as path from 'path';

const program = new Command();

program
  .name('obsidian-blog')
  .description('将Obsidian笔记库转换为简约大气个人博客网站')
  .version('1.0.0');

program
  .command('generate')
  .alias('gen')
  .description('生成博客网站')
  .option('-c, --config <path>', '配置文件路径')
  .option('-v, --verbose', '显示详细输出')
  .option('--resume', '从断点恢复生成过程')
  .action(async (options) => {
    try {
      const generator = new ObsidianBlogGenerator();
      const configPath = options.config ? path.resolve(options.config) : undefined;
      const resume = options.resume || false;

      if (options.verbose) {
        console.log('🔧 详细模式已启用');
        if (configPath) {
          console.log(`📋 使用配置文件: ${configPath}`);
        }
        if (resume) {
          console.log('🔄 启用断点恢复模式');
        }
      }

      const success = await generator.generate(configPath, resume);

      if (success) {
        console.log('🎉 博客生成任务已完成！');
      } else {
        console.log('⚠️  博客生成任务部分完成或遇到问题');
        process.exit(1);
      }

    } catch (error) {
      console.error('生成失败:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('初始化配置文件')
  .option('-o, --output <path>', '配置文件输出路径', './blog.config.json')
  .action(async (options) => {
    try {
      const { ConfigManager } = await import('./core/ConfigManager');
      const configManager = new ConfigManager();
      const defaultConfig = configManager.createDefaultConfig();

      await configManager.saveConfig(defaultConfig, options.output);
      console.log(`✅ 配置文件已创建: ${options.output}`);
      console.log('请编辑配置文件后运行 obsidian-blog generate');

    } catch (error) {
      console.error('初始化失败:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('验证配置文件')
  .option('-c, --config <path>', '配置文件路径')
  .action(async (options) => {
    try {
      const { ConfigManager } = await import('./core/ConfigManager');
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig(options.config);
      const validation = configManager.validateConfig(config);

      if (validation.isValid) {
        console.log('✅ 配置文件有效');
      } else {
        console.log('❌ 配置文件无效:');
        validation.errors.forEach(error => console.log(`   - ${error}`));
      }

      if (validation.warnings.length > 0) {
        console.log('⚠️  警告:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

    } catch (error) {
      console.error('验证失败:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// 如果没有提供命令，显示帮助
if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);