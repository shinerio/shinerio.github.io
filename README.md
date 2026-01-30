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

### 概述
Obsidian 博客生成器提供了一个命令行界面，用于将 Obsidian 笔记库转换为优雅的个人博客。该 CLI 使用 Commander.js 库构建，并支持多个命令执行不同操作。

### 1. 生成 (`generate` 或 `gen`)
从您的 Obsidian 库 Vault 中生成博客网站。

```
obsidian-blog generate [选项]
```

**选项：**
- `-c, --config <路径>` - 配置文件路径（可选，默认自动发现）
- `-v, --verbose` - 显示生成过程中的详细输出
- `--resume` - 从中断点恢复生成（用于失败后的恢复）

**示例：**
```bash
# 使用默认配置生成
obsidian-blog generate

# 使用特定配置文件和详细输出生成
obsidian-blog generate -c ./my-config.json -v

# 恢复中断的生成过程
obsidian-blog generate --resume -v
```

### 2. 初始化 (`init`)
使用默认设置初始化新的配置文件。

```
obsidian-blog init [选项]
```

**选项：**
- `-o, --output <路径>` - 配置文件的输出路径（默认为 `./blog.config.json`）

**示例：**
```bash
# 在默认位置创建配置
obsidian-blog init

# 在特定位置创建配置
obsidian-blog init -o ./configs/my-blog.json
```

### 3. 验证 (`validate`)
验证配置文件以确保其符合所需的格式和约束。

```
obsidian-blog validate [选项]
```

**选项：**
- `-c, --config <路径>` - 要验证的配置文件路径

**示例：**
```bash
# 验证默认配置文件
obsidian-blog validate

# 验证特定配置文件
obsidian-blog validate -c ./my-config.json
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

## 配置文件格式
配置文件是一个 JSON 文件，具有以下结构：

```json
{
  "vaultPath": "./vault",
  "outputPath": "./dist",
  "siteTitle": "我的 Obsidian 博客",
  "siteDescription": "从 Obsidian 笔记生成的博客",
  "author": "",
  "theme": "auto",
  "postsPerPage": 10
}
```

## 生成过程
运行 `generate` 命令时，工具会执行以下步骤：
1. 加载配置
2. 扫描 Vault 中的 Markdown 文件
3. 解析文章元数据和内容
4. 构建搜索索引
5. 生成网站页面
6. 保存搜索数据

每个步骤在执行过程中都会报告进度。

## 错误处理
该工具实现了强大的错误处理：
- 单个文件错误不会停止整个进程
- 进度跟踪允许从断点恢复
- 完成时提供详细的错误报告
- 详细模式提供额外的调试信息

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

### 本地开发环境设置

#### 安装依赖
```bash
npm install
```

#### 构建项目
```bash
npm run build
```

#### 开发模式
```bash
npm run dev           # 监听文件变化并重新构建
```

#### 运行测试
```bash
npm test
npm run test:watch    # 监视模式
npm run test:coverage # 覆盖率报告
```

#### 代码检查
```bash
npm run lint
npm run lint:fix
```

#### 本地预览
生成博客后，你可以使用以下几种方法之一来启动本地服务器预览网站：

##### 方法一：使用 http-server
```bash
# 全局安装 http-server
npm install -g http-server

# 进入输出目录并启动服务器（假设输出目录为 ./dist）
cd dist
http-server
```

##### 方法二：使用 live-server
```bash
# 全局安装 live-server
npm install -g live-server

# 进入输出目录并启动服务器
cd dist
live-server
```

##### 方法三：使用 Python
如果你安装了 Python，可以使用内置的服务器：
```bash
# Python 3
cd dist
python -m http.server 8000

# 或 Python 2
cd dist
python -m SimpleHTTPServer 8000
```

##### 方法四：使用 PHP
如果你安装了 PHP，可以使用内置的服务器：
```bash
cd dist
php -S localhost:8000
```

访问 `http://localhost:8000` 来查看你的博客网站。

**注意**: 由于这是一个静态网站生成器，生成的网站是纯HTML/CSS/JS文件，因此需要通过Web服务器访问才能正确显示（直接在浏览器中打开HTML文件可能无法正常加载资源）。

### 远程编译与部署

#### CI/CD 部署流程

##### GitHub Actions 示例
创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy Blog

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build project
      run: npm run build

    - name: Generate blog
      run: |
        npm install -g obsidian-blog-generator
        obsidian-blog generate -c ./blog.config.json

    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

##### 使用 Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod
```

##### 使用 Netlify 部署
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 登录 Netlify
netlify login

# 构建并部署
netlify deploy --prod --dir=dist
```

##### 使用 Docker 部署
创建 `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

RUN npm install -g obsidian-blog-generator

EXPOSE 3000

CMD ["sh", "-c", "obsidian-blog generate && cd dist && npx serve -s -l 3000"]
```

构建并运行:
```bash
# 构建镜像
docker build -t obsidian-blog .

# 运行容器
docker run -d -p 3000:3000 obsidian-blog
```

## 许可证

MIT License