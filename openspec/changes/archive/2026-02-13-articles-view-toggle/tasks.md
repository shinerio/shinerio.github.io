## 1. 后端数据准备

- [x] 1.1 在 `SiteGenerator.generateArticleList()` 中为每篇文章计算 `relativePath`（相对于 vaultPath，使用正斜杠），添加到序列化的 `articleData` JSON 中
- [x] 1.2 确保 `relativePath` 在 Windows 环境下使用正斜杠分隔符（`replace(/\\/g, '/')`）

## 2. 视图切换 UI 与状态管理

- [x] 2.1 在 `SiteGenerator.generateArticleList()` 的 HTML 模板中，在 `.articles-filters` 区域添加视图切换按钮组（列表图标和文件夹图标按钮）
- [x] 2.2 在 `articles-filters.js` 中添加视图切换逻辑：读取 URL `view` 参数、切换按钮点击处理、使用 `history.replaceState` 更新 URL
- [x] 2.3 实现视图切换时隐藏/显示对应容器：列表视图（`.article-list`、`.articles-filters` 的筛选控件、`.pagination`）和文件夹视图（`.folder-tree-container`）

## 3. 文件夹视图实现

- [x] 3.1 创建 `templates/assets/js/articles-folder-view.js`，实现从扁平 `relativePath` 列表构建树结构的函数
- [x] 3.2 实现树结构 DOM 渲染：文件夹节点（带图标、文章计数、展开/折叠 chevron）和文章叶节点（带文档图标、文章标题链接）
- [x] 3.3 实现展开/折叠交互：第一层默认展开，深层默认折叠，点击文件夹切换状态
- [x] 3.4 在 `SiteGenerator.generateArticleList()` 的 HTML 模板中添加 `.folder-tree-container` 容器（默认 `display: none`）
- [x] 3.5 在 `SiteGenerator.generateArticleList()` 中引入 `articles-folder-view.js` 脚本

## 4. 样式

- [x] 4.1 在 `style.css` 或 `style-addition.css` 中添加视图切换按钮样式（按钮组、active 状态、hover 效果）
- [x] 4.2 添加文件夹树样式：缩进层级、文件夹/文档图标、chevron 动画、文章计数 badge
- [x] 4.3 添加暗色模式下的文件夹视图样式适配
- [x] 4.4 添加移动端响应式适配（树形缩进和按钮布局）

## 5. 集成与测试

- [x] 5.1 验证列表视图在视图切换后保持原有功能（分页、排序、标签筛选状态不丢失）
- [x] 5.2 验证 URL 参数持久化：`?view=folder`、`?tag=xxx&view=folder`、默认无 `view` 参数时显示列表视图
- [x] 5.3 验证文件夹视图正确反映 vault 目录结构，文章标题正确显示，链接正确跳转
- [x] 5.4 验证暗色/亮色模式切换时文件夹视图样式正确
