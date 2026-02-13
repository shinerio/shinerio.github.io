## Why

Articles 页面当前仅提供平铺的文章列表视图（支持分页、排序和标签筛选），无法按源文件的目录结构浏览文章。用户在 Obsidian vault 中通常按主题分文件夹组织笔记，需要一种文件夹风格的视图来按原始目录结构检索和浏览文章。

## What Changes

- 在 Articles 页面顶部新增视图切换按钮，支持在「列表视图」和「文件夹视图」之间切换
- 列表视图：保留当前所有功能（分页、排序、标签筛选）
- 文件夹视图：以树形目录结构展示文章，支持展开/折叠文件夹，点击文章跳转到详情页
- 默认展示列表视图
- 构建时将文章的源目录路径信息传递到前端，供文件夹视图使用
- 视图切换状态通过 URL 参数持久化，支持刷新保持当前视图

## Capabilities

### New Capabilities
- `articles-folder-view`: 文件夹视图功能，包括树形目录结构渲染、展开/折叠交互、目录路径数据生成
- `articles-view-switch`: 视图切换功能，包括切换按钮 UI、视图状态管理与持久化、两种视图的显示/隐藏切换

### Modified Capabilities
- `articles-pagination`: 列表视图需要与视图切换功能共存，仅在列表视图激活时显示分页和筛选控件

## Impact

- **模板**: `templates/articles.html` — 需要新增视图切换按钮和文件夹视图容器
- **前端 JS**: `templates/assets/js/articles-filters.js` — 需要适配视图切换逻辑，新增文件夹视图 JS
- **前端 CSS**: `templates/assets/css/style.css` — 新增文件夹视图和视图切换按钮样式
- **后端生成器**: `src/core/SiteGenerator.ts` — `generateArticleList` 方法需要传递文章的源目录路径数据到前端
- **类型定义**: `src/types/index.ts` — 可能需要为文件夹树结构添加类型（仅前端 JSON 数据结构）
