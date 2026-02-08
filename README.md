# Obsidian博客生成器

将Obsidian笔记库转换为简约大气个人博客网站的工具。

## 功能特性

- 🚀 **自动扫描**: 自动扫描Obsidian vault中的markdown文件
- 📝 **元数据解析**: 支持YAML frontmatter和自动元数据提取
- 🎨 **响应式设计**: 适配桌面、平板和移动设备
- 🔍 **搜索功能**: 内置全文搜索功能
- 🏗️ **静态生成**: 生成纯静态HTML网站
- 💬 **评论系统**: 基于 GitHub Issues 的评论功能（Utterances）
- ⚡ **快速部署**: 可部署到任何静态网站托管服务

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

# 使用自定义配置文件本地预览
./deploy.sh -c my-config.json

# 使用自定义配置文件部署到GitHub Pages
./deploy.sh -c my-config.json -d github

# 使用自定义配置文件部署到Vercel
./deploy.sh -c my-config.json -d vercel

# 使用自定义配置文件部署到Netlify
./deploy.sh -c my-config.json -d netlify

# 使用自定义配置文件部署到Docker
./deploy.sh -c my-config.json -d docker
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
| `blacklist` | string[] | `[]` | 排除的文件/目录路径数组，支持通配符模式 |
| `customDomain` | string | `undefined` | GitHub Pages 自定义域名配置 |
| `comments` | object | `undefined` | 评论功能配置，详见[评论功能](#评论功能)章节 |

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
  "postsPerPage": 10,
  "customDomain": "your-domain.com",
  "blacklist": [
    "drafts/",
    "temp/",
    "*.tmp.md",
    "secret-notes/personal-diary.md",
    "**/private/**"
  ]
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

## 许可证

MIT License