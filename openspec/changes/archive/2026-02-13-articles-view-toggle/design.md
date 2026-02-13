## Context

Articles 页面当前采用单一列表视图，包含客户端排序、标签筛选和分页功能。文章数据在构建时通过 `SiteGenerator.generateArticleList()` 序列化为 JSON 嵌入 HTML，由 `articles-filters.js` 在客户端读取并渲染。

文章的 `filePath` 属性记录了源文件在 Obsidian vault 中的完整路径，但当前序列化到前端的 `articleData` 不包含路径信息。需要将路径信息传递到前端以支持文件夹视图。

## Goals / Non-Goals

**Goals:**
- 提供列表视图和文件夹视图两种浏览模式的无缝切换
- 文件夹视图按 Obsidian vault 目录结构展示文章树
- 切换视图时保持页面不刷新（纯前端交互）
- 视图状态通过 URL 参数持久化

**Non-Goals:**
- 不实现文件夹视图中的排序和筛选（列表视图已有此功能）
- 不修改文章生成逻辑或文章详情页
- 不实现文件夹的创建、删除等编辑功能
- 不实现拖拽排序

## Decisions

### 1. 目录数据传递方案

**选择**: 在构建时将 `relativePath`（相对于 vault 根目录的路径）加入 `articleData` JSON

**理由**:
- `filePath` 是绝对路径，包含本地环境信息，不适合暴露到前端
- 使用 `path.relative(vaultPath, filePath)` 计算相对路径，干净且跨平台一致
- 复用现有的 `articleData` JSON 传递机制，无需新增数据源

**替代方案**: 构建时预先生成树结构 JSON → 增加构建复杂度，且前端也需要做渲染转换，不如前端直接从扁平路径列表构建树

### 2. 树结构构建方案

**选择**: 前端 JS 从扁平的 `relativePath` 列表动态构建树

**理由**:
- 文章数量一般在几百篇以内，前端构建树结构性能无问题
- 避免后端额外的数据结构和序列化逻辑
- 树结构变化（如筛选）可以纯前端处理

### 3. 视图切换 UI 方案

**选择**: 在 `.articles-filters` 区域右侧放置两个图标按钮（列表图标 / 文件夹图标），使用 CSS class 切换 `.view-list` / `.view-folder` 控制内容区域显隐

**理由**:
- 图标按钮直觉清晰、不占空间
- CSS class 切换比 DOM 操作更高效
- 切换时隐藏/显示对应容器，避免每次重建 DOM

### 4. URL 状态持久化

**选择**: 使用 URL 查询参数 `view=list|folder`，与现有的 `tag` 参数和 `#page=N` hash 共存

**理由**:
- 查询参数比 hash 更语义化，且与现有 `?tag=xxx` 参数一致
- 切换视图时使用 `history.replaceState` 更新 URL，不触发页面刷新
- 页面加载时读取 `view` 参数决定初始视图

### 5. 文件夹视图展开/折叠

**选择**: 默认展开第一层目录，子目录默认折叠。点击文件夹名称切换展开/折叠状态。

**理由**:
- 默认展开第一层让用户能看到顶层分类结构
- 深层默认折叠避免初始渲染过多内容
- 展开/折叠状态不持久化到 URL（避免 URL 过于复杂）

### 6. 新增 JS 文件 vs 扩展现有文件

**选择**: 新增 `articles-folder-view.js` 处理文件夹视图逻辑，修改 `articles-filters.js` 添加视图切换协调逻辑

**理由**:
- 文件夹视图逻辑独立且代码量较大，放在单独文件中更清晰
- `articles-filters.js` 作为主入口负责视图切换协调，保持职责分明
- 新增文件在 `SiteGenerator` 中与 `articles-filters.js` 一同引入

## Risks / Trade-offs

- **[目录信息泄露]** → 前端 `relativePath` 会暴露 vault 的目录结构。风险低：这是个人博客，目录结构非敏感信息。
- **[大量文件夹渲染性能]** → 如果 vault 目录极深或文件极多，树形渲染可能卡顿。→ 缓解：文章一般数百篇，且默认折叠深层目录。
- **[视图切换闪烁]** → 切换时可能有布局跳动。→ 缓解：使用 CSS `display: none` 预渲染两个容器，切换仅改变可见性。
