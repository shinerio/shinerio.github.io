## Context

文章详情页当前使用 Utterances（基于 GitHub Issues）实现底部评论功能。Utterances 通过 `<script>` 标签嵌入 iframe，每篇文章对应一个 GitHub Issue。

划词评论是一个独立的交互层，需要在纯前端实现文本选择检测、锚点定位、评论数据存储与渲染。与 Utterances 不同，划词评论需要将评论绑定到文章中的特定文本片段。

当前文章页已有 `code-enhance.js` 和 `image-enhance.js` 两个增强模块，划词评论将作为第三个独立的增强模块加入。

## Goals / Non-Goals

**Goals:**
- 用户可以选中文章中的文字后添加评论
- 已有评论的文本片段显示高亮，悬浮时展示评论内容
- 划词评论数据与底部 Utterances 评论完全独立
- 纯前端实现，无需额外后端服务
- 支持暗色/亮色主题

**Non-Goals:**
- 不支持评论回复/嵌套评论（保持简单）
- 不支持评论编辑/删除（初版）
- 不实现实时协作（多人同时评论）
- 不修改现有 Utterances 评论系统

## Decisions

### 1. 数据存储方案：GitHub Issues API + 独立 Label

**选择**: 使用与 Utterances 相同的 GitHub repo，但通过独立的 label（如 `text-annotation`）区分数据。

**替代方案**:
- localStorage：数据仅本地存在，无法跨设备共享 → 排除
- 独立 GitHub repo：增加配置复杂度 → 排除
- 第三方服务（Hypothesis 等）：引入外部依赖 → 排除

**理由**: 复用现有 GitHub repo 配置，通过 label 隔离数据，零额外基础设施。每篇文章对应一个 Issue（title 格式: `[annotation] <article-slug>`），每条划词评论是该 Issue 的一个 comment，comment body 以 JSON 格式存储选区信息和评论文本。

### 2. 文本锚点定位方案：Text Fragment + 上下文定位

**选择**: 存储选中文本内容、前后上下文文本（各 30 字符）、所在段落索引。

**替代方案**:
- XPath：DOM 结构变化后失效 → 不可靠
- 纯文本偏移量：文章更新后偏移量全部失效 → 不可靠
- 字符级 hash：实现复杂 → 过度设计

**理由**: 上下文定位在文章内容小幅修改后仍能匹配，且实现简单。结构为：
```json
{
  "selectedText": "被选中的文字",
  "prefix": "选中文字之前的上下文",
  "suffix": "选中文字之后的上下文",
  "paragraphIndex": 3,
  "comment": "评论内容",
  "author": "github-username",
  "createdAt": "ISO-8601"
}
```

### 3. UI 交互设计

**选择**: 选中文字 → 浮动工具栏（评论按钮）→ 评论弹窗 → 提交后高亮显示

- **浮动工具栏**: 出现在选区上方，包含评论图标按钮
- **评论弹窗**: 简洁的文本输入框 + 提交按钮，出现在选区附近
- **高亮标记**: 对已有评论的文本使用 `<mark>` 标签包裹，带特殊 class
- **悬浮气泡**: 鼠标 hover 高亮文本时，显示评论内容气泡（tooltip 风格）

### 4. GitHub API 认证

**选择**: 使用 GitHub OAuth（通过 GitHub 登录按钮）获取 token，存储在 localStorage。

**替代方案**:
- Personal Access Token 硬编码：安全风险 → 排除
- 无认证匿名评论：GitHub API 不支持匿名写入 → 不可行

**理由**: 与 Utterances 类似的认证流程，用户体验一致。使用 GitHub OAuth App 进行授权，获取的 token 用于调用 GitHub Issues API 创建 comment。

### 5. 模块结构

新增文件：
- `templates/assets/js/text-selection-comment.js` — 核心逻辑模块
- `templates/assets/css/text-selection-comment.css` — 专用样式

通过 SiteGenerator 在文章页面注入，与现有 `code-enhance.js`、`image-enhance.js` 并列。

## Risks / Trade-offs

- **[文本定位失效]** 文章大幅修改后，已有评论可能无法定位到原始文本 → 降级处理：无法定位时在文章顶部聚合显示"未定位评论"
- **[GitHub API 限流]** 未认证请求 60次/小时，认证后 5000次/小时 → 前端缓存已加载的评论数据，减少重复请求
- **[OAuth 复杂度]** GitHub OAuth 需要注册 OAuth App → 可提供配置指引，或初版使用已有 Utterances OAuth proxy
- **[选区冲突]** 用户选中代码块等特殊区域 → 限制划词评论仅在 `.content` 区域内的文本节点生效
