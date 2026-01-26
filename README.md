# Obsidian博客生成器

将Obsidian笔记库转换为简约大气个人博客网站的工具。

## 功能特性

- 🚀 **自动扫描**: 自动扫描Obsidian vault中的markdown文件
- 📝 **元数据解析**: 支持YAML frontmatter和自动元数据提取
- 🎨 **响应式设计**: 适配桌面、平板和移动设备
- 🔍 **搜索功能**: 内置全文搜索功能
- 🏗️ **静态生成**: 生成纯静态HTML网站
- ⚡ **快速部署**: 可部署到任何静态网站托管服务

## 安装

```bash
npm install -g obsidian-blog-generator
```

## 快速开始

1. 初始化配置文件：
```bash
obsidian-blog init
```

2. 编辑 `blog.config.json` 配置文件：
```json
{
  "vaultPath": "./my-obsidian-vault",
  "outputPath": "./blog-output",
  "siteTitle": "我的博客",
  "siteDescription": "基于Obsidian笔记的个人博客",
  "author": "你的名字",
  "theme": "auto",
  "postsPerPage": 10
}
```

3. 生成博客网站：
```bash
obsidian-blog generate
```

## 命令行接口

### 生成网站
```bash
obsidian-blog generate [options]
obsidian-blog gen [options]  # 简写

选项:
  -c, --config <path>  指定配置文件路径
  -v, --verbose        显示详细输出
```

### 初始化配置
```bash
obsidian-blog init [options]

选项:
  -o, --output <path>  配置文件输出路径 (默认: ./blog.config.json)
```

### 验证配置
```bash
obsidian-blog validate [options]

选项:
  -c, --config <path>  配置文件路径
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `vaultPath` | string | `"./vault"` | Obsidian vault路径 |
| `outputPath` | string | `"./dist"` | 生成网站的输出路径 |
| `siteTitle` | string | `"My Obsidian Blog"` | 网站标题 |
| `siteDescription` | string | `"A blog generated from Obsidian notes"` | 网站描述 |
| `author` | string | `""` | 作者名称 |
| `theme` | string | `"auto"` | 主题 (`light`/`dark`/`auto`) |
| `postsPerPage` | number | `10` | 每页显示的文章数量 |

## Frontmatter支持

支持以下YAML frontmatter字段：

```yaml
---
title: 文章标题
date: 2023-01-01
tags: [标签1, 标签2]
description: 文章描述
draft: false
slug: custom-url-slug
---
```

## Obsidian特性支持

- **内部链接**: `[[链接文本]]` 自动转换为HTML链接
- **标签**: `#标签` 自动转换为带样式的标签
- **图片**: 支持本地图片引用
- **代码块**: 完整支持代码高亮

## 开发

### 安装依赖
```bash
npm install
```

### 构建项目
```bash
npm run build
```

### 运行测试
```bash
npm test
npm run test:watch    # 监视模式
npm run test:coverage # 覆盖率报告
```

### 代码检查
```bash
npm run lint
npm run lint:fix
```

## 许可证

MIT License