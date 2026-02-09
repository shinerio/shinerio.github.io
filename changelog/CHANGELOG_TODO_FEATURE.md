# 变更日志

## [未发布] - 2026-02-10

### 新增功能
- **TODO 看板功能**: 集成了 GitHub Projects v2 的任务管理与看板功能
  - 在 `src/types/index.ts` 中添加了 `TodoConfig` 接口
  - 实现了通过 Cloudflare Worker 代理的 OAuth 设备流，用于 GitHub 认证
  - 创建了客户端 JavaScript (`templates/assets/js/todo.js`) 用于 GitHub GraphQL API 集成
  - 添加了具有拖放功能、状态列和任务卡片的看板界面
  - 实现了设备流模态框，用于安全的 GitHub 认证
  - 添加了在 GitHub Projects 中添加/编辑/删除任务的功能

### 更改内容
- **配置系统**: 扩展了 `BlogConfig` 接口以支持 `todo` 配置部分
  - 在 `src/core/ConfigManager.ts` 中为新的 todo 配置选项添加了验证逻辑
  - 更新配置架构以支持 `enabled`、`projectNumber`、`repo`、`oauthClientId` 和 `oauthProxyUrl` 字段

- **导航系统**: 更新模板结构以包含 TODO 页面导航
  - 在 `templates/layout.html` 中添加了 "TODO" 链接，并带有 `todoActive` 活动状态指示器
  - 修改了 `src/core/SiteGenerator.ts` 中的所有页面生成方法，以包含 `todoActive` 参数

- **网站生成**: 增强了页面生成系统以支持 TODO 页面
  - 在 `src/core/SiteGenerator.ts` 中添加了 `generateTodoPage()` 方法用于生成 TODO 页面
  - 添加了 `extractGithubUsername()` 辅助函数用于 GitHub 用户识别
  - 将 TODO 页面生成与条件逻辑集成到 `generateSite()` 方法中
  - 更新了所有现有页面生成器以传递 `todoActive` 参数

- **用户界面**: 使用 TODO 特定样式和组件增强 UI
  - 在 `templates/assets/css/style.css` 中为看板布局添加了全面的 CSS 样式
  - 实现了 TODO 页面的响应式设计，支持全宽度显示
  - 为所有 TODO 组件添加了暗色模式支持
  - 为设备流认证和任务管理创建了模态框

- **文档**: 使用全面的 TODO 功能文档更新 README
  - 添加了 TODO 功能的安装和配置说明
  - 包含了详细的 Cloudflare Worker 设置指南及逐步说明
  - 记录了 OAuth 设备流过程和 GitHub Projects 集成
  - 添加了使用说明和功能解释

### 修复内容
- **模板一致性**: 确保所有生成的页面都包含适当的导航活动状态指示器
- **配置验证**: 改进了复杂配置对象的验证
- **UI 响应性**: 增强了新 TODO 组件的移动端兼容性

### 安全性
- **OAuth 代理**: 使用 Cloudflare Worker 实现安全的 CORS 代理，用于 GitHub OAuth 设备流
- **身份验证**: 添加了使用 localStorage 的安全令牌存储并进行适当清理
- **API 安全性**: 实现了具有安全令牌处理的 GraphQL 客户端，用于 GitHub API 集成

### 新增文件
- `templates/todo.html` - TODO 看板页面的 HTML 模板
- `templates/assets/js/todo.js` - GitHub 集成的客户端 JavaScript
- `cloudflare-worker/worker.js` - Cloudflare Worker OAuth 代理实现
- `cloudflare-worker/wrangler.toml` - Cloudflare Worker 部署的 Wrangler 配置

### 修改文件
- `src/types/index.ts` - 添加了 TodoConfig 接口并扩展了 BlogConfig
- `src/core/ConfigManager.ts` - 添加了 TODO 配置验证逻辑
- `src/core/SiteGenerator.ts` - 添加了 TODO 页面生成方法
- `templates/layout.html` - 添加了 TODO 导航链接
- `templates/assets/css/style.css` - 添加了 TODO 特定样式
- `blog.config.json` - 添加了 TODO 配置部分
- `README.md` - 添加了全面的 TODO 功能文档