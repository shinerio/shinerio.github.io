# Obsidian博客生成器

将Obsidian笔记库转换为简约大气个人博客网站的工具。

## 功能特性

- **自动扫描**: 自动扫描Obsidian vault中的markdown文件
- **元数据解析**: 支持YAML frontmatter和自动元数据提取（标题、日期、标签、描述、草稿、slug）
- **响应式设计**: 适配桌面、平板和移动设备
- **明暗主题**: 支持 `light`/`dark`/`auto` 三种主题模式，含手动切换
- **搜索功能**: 内置加权全文搜索（标题权重3 > 标签权重2 > 正文权重1），支持中英文分词
- **评论系统**: 基于 GitHub Issues 的评论功能（Utterances），主题跟随博客自动切换
- **划词评论**: 支持对文章特定段落进行划词标注评论，独立于底部评论系统，悬浮显示评论内容
- **TODO看板**: 集成 GitHub Projects v2 的 Kanban 看板，支持任务管理（需配置 OAuth 和 Cloudflare Worker）
- **GitHub集成**: 侧边栏展示 GitHub 主页链接和 Follow 按钮
- **Obsidian语法**: 自动处理 `[[内部链接]]` 和 `#标签` 语法
- **黑名单过滤**: 支持 glob 通配符模式排除文件和目录
- **断点恢复**: 生成中断后可从上次断点继续
- **静态生成**: 生成纯静态HTML网站
- **快速部署**: 支持 GitHub Pages、Vercel、Netlify、Docker 等多种部署方式

## 项目结构

```
src/
├── index.ts              # 主流程编排（ObsidianBlogGenerator 类）
├── cli.ts                # 命令行接口（Commander.js）
├── types/index.ts        # TypeScript 类型定义
└── core/
    ├── ConfigManager.ts       # 配置加载、验证、保存
    ├── FileScanner.ts         # Vault 目录扫描与黑名单过滤
    ├── MetadataParser.ts      # YAML frontmatter 解析、Markdown 处理
    ├── SiteGenerator.ts       # HTML 生成、模板渲染、静态资源管理
    ├── SearchCoordinator.ts   # 搜索协调器（组合标题+内容引擎）
    ├── TitleSearchEngine.ts   # 标题搜索引擎（权重 3）
    ├── ContentSearchEngine.ts # 正文搜索引擎（权重 1）
    ├── SearchEngine.ts        # 旧版搜索引擎（兼容保留）
    └── ErrorHandler.ts        # 错误处理、进度报告、断点续传

templates/
├── layout.html            # 基础 HTML 模板
├── index.html             # 首页（英雄区、近期文章、标签云、侧边栏）
├── article.html           # 文章页（正文、评论、导航）
├── articles.html          # 文章列表页（分页、标签过滤）
├── search.html            # 搜索页（实时搜索、高亮结果）
└── assets/                # CSS、JS、图片资源

test/
├── unit/                  # 单元测试（13个测试文件）
├── integration/           # 集成测试
└── setup/                 # 测试环境配置
```

## 一键编译部署

项目提供了一键编译和部署脚本，支持指定JSON配置文件并可选择不同的部署方式。

### 使用方法

**Linux/macOS:**
```bash
chmod +x deploy.sh
./deploy.sh [-c config_file] [-d deploy_method]
```

**Windows:**
```cmd
deploy.bat [-c config_file] [-d deploy_method]
```

**参数说明:**
- `-c, --config`: 指定JSON配置文件路径（默认：`./blog.config.json`）
- `-d, --deploy`: 指定部署方式（`github`, `vercel`, `netlify`, `docker`, `local`）

**示例:**
```bash
# 使用默认配置本地预览
./deploy.sh

# 使用自定义配置文件部署到GitHub Pages
./deploy.sh -c my-config.json -d github

# 使用自定义配置文件部署到Vercel
./deploy.sh -c my-config.json -d vercel

# 使用自定义配置文件部署到Netlify
./deploy.sh -c my-config.json -d netlify

# 使用自定义配置文件部署到Docker
./deploy.sh -c my-config.json -d docker
```

## 开发命令

```bash
npm install          # 安装依赖
npm run build        # 编译 TypeScript
npm run dev          # 开发监视模式
npm run test         # 运行测试
npm run test:watch   # 测试监视模式
npm run test:coverage # 生成覆盖率报告
npm run lint         # 代码检查
npm run lint:fix     # 自动修复代码问题
```

## CLI 命令

```bash
npx obsidian-blog generate                   # 使用默认配置生成博客
npx obsidian-blog generate -c ./config.json  # 使用自定义配置
npx obsidian-blog generate -v                # 详细输出模式
npx obsidian-blog generate --resume          # 从断点恢复生成
npx obsidian-blog init -o ./blog.config.json # 初始化配置文件
npx obsidian-blog validate -c ./config.json  # 验证配置文件
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
| `blacklist` | string[] | `[]` | 排除的文件/目录路径数组，支持 glob 通配符 |
| `customDomain` | string | - | GitHub Pages 自定义域名 |
| `githubUrl` | string | - | GitHub 主页 URL，显示在侧边栏 |
| `comments` | object | - | 评论功能配置，详见[评论功能](#评论功能)章节 |
| `todo` | object | - | TODO 看板功能配置，详见[TODO功能](#todo功能)章节 |

## 配置文件格式

配置文件是一个 JSON 文件，具有以下结构：

```json
{
  "vaultPath": "./vault",
  "outputPath": "./dist",
  "siteTitle": "我的 Obsidian 博客",
  "siteDescription": "从 Obsidian 笔记生成的博客",
  "author": "your-name",
  "theme": "auto",
  "postsPerPage": 10,
  "customDomain": "your-domain.com",
  "githubUrl": "https://github.com/your-username",
  "blacklist": [
    "drafts/",
    "temp/",
    "*.tmp.md",
    "secret-notes/personal-diary.md",
    "**/private/**"
  ],
  "comments": {
    "enabled": true,
    "repo": "owner/repo",
    "issueTerm": "pathname",
    "label": "blog-comment"
  }
}
```

### 黑名单配置说明

`blacklist` 选项允许您指定不想包含在生成的博客中的文件或目录：

- `"*.tmp.md"` - 排除所有以 `.tmp.md` 结尾的文件
- `"drafts/"` - 排除整个 drafts 目录及其所有内容
- `"**/private/**"` - 排除任意深度的 private 目录
- `"secret-notes/note.md"` - 排除特定文件

## 评论功能

博客支持基于 [Utterances](https://utteranc.es/) 的评论系统，使用 GitHub Issues 存储评论内容，读者通过 GitHub OAuth 授权后即可发表评论。

### 前置条件

1. 博客所使用的 GitHub 仓库必须是 **public** 的
2. 在仓库上安装 [Utterances App](https://github.com/apps/utterances)，授予其读写 Issues 的权限

### 配置方式

在 `blog.config.json` 中添加 `comments` 字段：

```json
{
  "comments": {
    "enabled": true,
    "repo": "owner/repo",
    "issueTerm": "pathname",
    "label": "blog-comment"
  }
}
```

### 配置项说明

| 选项 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `enabled` | boolean | 是 | - | 是否启用评论功能 |
| `repo` | string | 是 | - | GitHub 仓库，格式为 `"owner/repo"` |
| `issueTerm` | string | 否 | `"pathname"` | Issue 与文章的映射方式，可选 `pathname`、`title`、`og:title`、`url` |
| `label` | string | 否 | - | 为评论 Issue 添加的标签，便于区分评论和普通 Issue |

### Issue 映射方式

- **`pathname`**（推荐）：以文章的 URL 路径作为 Issue 标题，适合大多数场景
- **`title`**：以文章标题作为 Issue 标题
- **`og:title`**：以页面 `og:title` meta 标签的值作为 Issue 标题
- **`url`**：以文章完整 URL 作为 Issue 标题

### 主题同步

评论区会自动跟随博客的明暗主题切换。当用户手动切换主题或系统主题变化时，评论组件的配色方案会同步更新。

## 划词评论功能

博客支持对文章特定段落进行划词标注评论。读者可以选中文章中的任意文本段落，添加评论，并在悬浮时查看评论内容。该功能与底部的 Utterances 评论系统完全独立，数据存储在独立的 GitHub Issue 中。

### 前置条件

1. 博客必须启用底部的评论功能（`comments.enabled: true`）
2. 需要在 GitHub 上创建一个 OAuth App 用于用户认证（或使用现有的）
3. 确保博客使用的 GitHub 仓库已安装 Utterances App

### 配置方式

在 `blog.config.json` 中的 `comments` 字段下添加 `annotation` 配置：

```json
{
  "comments": {
    "enabled": true,
    "repo": "owner/repo",
    "issueTerm": "pathname",
    "label": "blog-comment",
    "annotation": {
      "enabled": true,
      "label": "text-annotation",
      "oauthClientId": "your-oauth-app-client-id"
    }
  }
}
```

### 配置项说明

| 选项 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `annotation.enabled` | boolean | 是 | - | 是否启用划词评论功能 |
| `annotation.label` | string | 否 | `"text-annotation"` | 用于划词评论的 GitHub Issue 标签 |
| `annotation.oauthClientId` | string | 否 | - | GitHub OAuth App 的 Client ID，用于用户认证 |

### 数据隔离

划词评论与底部 Utterances 评论的数据完全隔离：

- **Utterances 评论**：存储在标题为文章路径的 Issue 中，使用配置的 `label`（如 `blog-comment`）
- **划词评论**：存储在标题为 `[annotation] <article-slug>` 的 Issue 中，使用独立的 `annotation.label`（如 `text-annotation`）

这种设计确保两种评论数据不会混淆，便于管理和维护。

### 使用方式

1. 启用划词评论后，读者访问文章页面时，选中任意文本段落
2. 选中后会弹出浮动工具栏，点击评论图标
3. 如果是首次使用，需要点击 "使用 GitHub 登录" 按钮进行 OAuth 认证
4. 在弹出的评论框中输入评论内容，点击提交
5. 评论提交后，选中的文本会高亮显示，其他读者悬浮时可查看评论内容

### 主题同步

划词评论的界面元素（工具栏、弹窗、高亮标记、悬浮气泡）会自动跟随博客的明暗主题切换，确保与博客整体风格保持一致。

## TODO功能

博客支持集成了 GitHub Projects v2 的 Kanban 看板功能，用于任务管理和待办事项跟踪。

### 前置条件

1. 在您的 GitHub 账户下创建一个 GitHub Projects v2 项目
2. 项目中应包含一个名为 `Status` 的单选字段，用于任务状态跟踪
3. 准备一个 GitHub OAuth 应用用于身份验证（需启用设备流）

### Cloudflare Worker 配置

由于 GitHub OAuth 的端点不支持浏览器 CORS 请求，需要配置一个 Cloudflare Worker 作为代理：

1. **创建 OAuth 应用**：
   - 访问 https://github.com/settings/developers
   - 创建新的 OAuth App 或 GitHub App
   - 启用 "Device flow" 选项
   - 记下 Client ID

2. **部署 Cloudflare Worker**：
   ```bash
   # 安装 wrangler CLI (如果未安装)
   npm install -g wrangler

   # 进入 worker 目录
   cd cloudflare-worker

   # 登录到 Cloudflare (首次使用时)
   wrangler login

   # 部署 worker
   wrangler deploy
   ```

3. **获取 Worker URL**：
   - 部署成功后，会获得一个形如 `https://your-worker.your-account.workers.dev` 的 URL

4. **配置project**
在github上创建是个名叫TODO的仓库，并创建一个Projects。
  - 创建完成后，项目 URL 会类似这样：https://github.com/users/your-username/projects/123
  - 其中的数字 123 就是您的 projectNumber，需要填入到 blog.config.json 中

### 配置方式

在 `blog.config.json` 中添加 `todo` 字段：

```json
{
  "todo": {
    "enabled": true,
    "projectNumber": 1,
    "repo": "TODO",
    "oauthClientId": "Ov23li65mtWdX973c2zm",
    "oauthProxyUrl": "https://your-worker.your-account.workers.dev"
  }
}
```

### 配置项说明

| 选项 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| `enabled` | boolean | 是 | - | 是否启用 TODO 功能 |
| `projectNumber` | number | 是 | - | GitHub Projects v2 项目的编号 |
| `repo` | string | 否 | `"TODO"` | 项目所属的仓库名 |
| `oauthClientId` | string | 是 | - | GitHub OAuth 应用的客户端 ID |
| `oauthProxyUrl` | string | 是 | - | Cloudflare Worker 的 URL，用作 OAuth 代理 |

### 使用方式

1. 部署完成后，在博客导航栏会出现 "TODO" 链接
2. 点击进入看板页面，点击 "Sign in with GitHub" 按钮
3. 系统会启动 OAuth 设备流，显示设备码
4. 在新窗口打开 GitHub，输入设备码进行授权
5. 授权完成后，即可查看和管理您的 GitHub Projects v2 看板

### 功能特性

- **Kanban 板视图**：根据 Status 字段显示任务列
- **添加任务**：支持创建新的待办事项
- **编辑任务**：可以修改任务状态
- **删除任务**：支持删除不需要的任务
- **响应式设计**：适配不同屏幕尺寸
- **暗色主题**：跟随站点主题设置

## 搜索架构

搜索系统采用双引擎加权架构，通过 `SearchCoordinator` 统一协调：

- **TitleSearchEngine** - 标题索引，权重 3（最高优先级）
- **ContentSearchEngine** - 正文索引，权重 1
- 标签匹配权重为 2
- 支持中文字符分词和英文停用词过滤
- 搜索结果包含匹配位置指示（标题/正文/标签）和高亮摘要

## 技术栈

- **语言**: TypeScript 5.0 (strict mode)
- **运行时依赖**: commander, fs-extra, gray-matter, marked
- **开发依赖**: jest, ts-jest, eslint, @typescript-eslint, fast-check
- **模板**: 原生 HTML + CSS + JavaScript
- **测试**: Jest + ts-jest + fast-check（属性测试）

## 许可证

MIT License
