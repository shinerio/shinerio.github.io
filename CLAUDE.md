# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在此代码仓库中工作时提供指导。

## 项目概述

Obsidian 博客生成器是一个基于 TypeScript 的工具，可将 Obsidian 笔记库转换为优雅的静态个人博客。该项目提供了命令行界面，可以从带有 YAML frontmatter 元数据的 Markdown 文件生成静态网站。

## 架构

项目采用模块化架构，包含不同的核心组件：

- `ObsidianBlogGenerator`：位于 `src/index.ts` 中的主要编排类，管理生成管道
- `ConfigManager`：处理配置的加载、验证和保存
- `FileScanner`：在 vault 目录中发现 Markdown 文件
- `MetadataParser`：解析 YAML frontmatter 并将 Markdown 转换为 HTML
- `SiteGenerator`：使用 Handlebars 模板生成静态 HTML 页面
- `SearchEngine`：构建搜索索引并生成搜索数据
- `GracefulErrorHandler`：管理错误、进度报告和断点恢复

生成过程遵循以下阶段：配置加载 → 文件扫描 → 元数据解析 → 搜索索引构建 → 网站生成 → 搜索数据保存。

## 关键数据类型

在 `src/types/index.ts` 中定义的重要接口：
- `BlogConfig`：配置设置，包括 vault/输出路径、站点元数据
- `ParsedArticle`：带有元数据和内容的已处理文章
- `Article`：完全处理的文章，包含 HTML 内容、阅读时间等
- `ScanResult`：带错误处理的文件扫描结果
- `SearchIndex`：全文搜索的数据结构

## 开发命令

```bash
# 构建项目
npm run build

# 开发模式监听
npm run dev

# 运行测试
npm test

# 监听模式下运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 代码检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix

# 启动 CLI 工具
npm start
```

## CLI 使用

该工具提供三个主要命令：
- `obsidian-blog generate` (-c config, -v verbose, --resume): 从 vault 生成博客
- `obsidian-blog init` (-o output): 初始化配置文件
- `obsidian-blog validate` (-c config): 验证配置文件

配置选项包括 vault 路径、输出路径、站点标题/描述、作者、主题和每页文章数。

## 模板系统

模板存储在 `templates/` 目录中：
- `layout.html`：带页眉/页脚的基础 HTML 布局
- `index.html`：显示最近文章的主页
- `article.html`：单独的文章页面
- `articles.html`：文章列表页面
- `search.html`：搜索结果页面
- `components/`：可重用组件，如文章卡片
- `assets/`：静态资源 (CSS, JS)

## 错误处理与恢复

系统实现了强大的错误处理，包含进度报告和断点恢复功能。单个文件错误不会停止整个过程。错误会在生成过程结束时被聚合并报告。

## 测试

测试文件现在统一组织在 `test/` 目录中，按测试类型分类：
- `test/unit/` - 单元测试
- `test/integration/` - 集成测试
- `test/setup/` - 测试配置和设置文件

原始的测试相关文件已经迁移至新的目录结构中以保持更好的组织性。