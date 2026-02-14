## 1. CSS 样式

- [x] 1.1 创建 `templates/assets/css/text-selection-comment.css`，定义浮动工具栏样式（定位、图标、动画）
- [x] 1.2 定义评论弹窗样式（输入框、提交按钮、定位）
- [x] 1.3 定义高亮标记样式（`<mark>` 背景色、hover 效果）
- [x] 1.4 定义悬浮评论气泡样式（tooltip 定位、箭头、内容布局）
- [x] 1.5 定义未定位评论汇总区域样式
- [x] 1.6 实现暗色/亮色主题适配（CSS 变量或 media query）
- [x] 1.7 实现响应式适配（移动端触控选择场景）

## 2. 核心 JavaScript 模块

- [x] 2.1 创建 `templates/assets/js/text-selection-comment.js` 模块骨架，包含初始化入口和配置读取
- [x] 2.2 实现文本选择检测：监听 `mouseup`/`selectionchange` 事件，判断选区是否在 `.content` 内
- [x] 2.3 实现浮动工具栏：选中文字后在选区上方显示评论按钮，取消选择后隐藏
- [x] 2.4 实现评论弹窗：点击评论按钮后显示文本输入区域和提交/取消按钮
- [x] 2.5 实现文本锚点提取：获取选中文本、前后上下文（各 30 字符）、段落索引
- [x] 2.6 实现评论数据序列化（JSON 格式：selectedText、prefix、suffix、paragraphIndex、comment、author、createdAt）

## 3. GitHub API 集成

- [x] 3.1 实现 GitHub OAuth 认证流程（登录按钮、token 存储到 localStorage）
- [x] 3.2 实现查找或创建文章对应的 annotation Issue（title: `[annotation] <slug>`，label: `text-annotation`）
- [x] 3.3 实现提交评论：将序列化的评论数据作为 Issue comment 创建
- [x] 3.4 实现加载评论：获取指定 annotation Issue 的所有 comments 并解析 JSON

## 4. 评论渲染与交互

- [x] 4.1 实现评论高亮渲染：页面加载后根据已有评论数据定位文本并用 `<mark>` 包裹
- [x] 4.2 实现文本定位算法：基于 selectedText + prefix/suffix + paragraphIndex 匹配文本节点
- [x] 4.3 实现无法定位评论的降级处理：收集未匹配评论并在内容区末尾展示汇总
- [x] 4.4 实现悬浮气泡：hover 高亮文本时显示评论内容（作者、日期、评论文本）
- [x] 4.5 实现同一文本多条评论的聚合展示（按时间排序）

## 5. 构建集成

- [x] 5.1 修改 `src/core/SiteGenerator.ts`：在文章页面 head 中注入 `text-selection-comment.css`
- [x] 5.2 修改 `src/core/SiteGenerator.ts`：在文章页面注入 `text-selection-comment.js` 脚本（defer）
- [x] 5.3 修改 `src/core/SiteGenerator.ts`：传递划词评论配置（repo、label）到页面 script 变量
- [x] 5.4 扩展 `src/types/index.ts` 中的 `BlogConfig` 或 `CommentsConfig`，添加 annotation 相关配置字段
- [x] 5.5 修改 `templates/article.html`：添加划词评论所需的容器元素（无需修改，JavaScript 动态创建）

## 6. 验证与测试

- [x] 6.1 验证划词评论功能在亮色/暗色主题下的视觉表现（CSS 变量支持）
- [x] 6.2 验证评论数据与 Utterances 底部评论完全隔离（不同 Issue、不同 label）
- [x] 6.3 验证文本定位在文章内容未变化时准确匹配（前缀+后缀+段落索引匹配）
- [x] 6.4 验证未认证用户的提示流程（显示登录按钮和提示）
- [x] 6.5 验证移动端的交互适配（响应式样式和媒体查询）
- [x] 6.6 更新 README 文档添加划词评论功能的使用说明
