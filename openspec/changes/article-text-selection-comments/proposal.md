## Why

文章详情页目前仅支持底部整体评论（Utterances），缺少对文章特定段落或语句的精确讨论能力。划词评论（text selection annotation）允许读者选中文章中的文字后直接添加评论，并在悬浮时查看已有评论内容，提升阅读互动体验和讨论精度。

## What Changes

- 新增划词评论功能：用户在文章详情页选中文字后弹出评论入口，点击后可提交针对选中文本的评论
- 新增评论高亮标记：已有划词评论的文本段落显示高亮底色，鼠标悬浮时弹出气泡展示评论内容
- 划词评论数据独立于底部 Utterances 评论系统，使用独立的 GitHub Issues label 或独立 API 存储
- 新增客户端 JavaScript 模块处理文本选择、评论提交、评论渲染
- 新增划词评论相关 CSS 样式（高亮、弹出气泡、评论表单）

## Capabilities

### New Capabilities
- `text-selection-comment`: 划词评论核心能力——文本选择检测、评论创建、评论存储与加载、高亮渲染、悬浮展示

### Modified Capabilities
（无现有 spec 需要修改，划词评论与底部 Utterances 评论完全独立）

## Impact

- **Templates**: `article.html` 需添加划词评论容器和脚本引用
- **Assets/JS**: 新增 `text-selection-comment.js` 客户端模块
- **Assets/CSS**: 在 `style-addition.css` 或新增专用 CSS 文件中添加划词评论样式
- **SiteGenerator.ts**: 需在文章页面注入划词评论脚本和配置
- **Types**: 可能需扩展 `BlogConfig` 添加划词评论配置项（如独立 GitHub repo/label）
- **Dependencies**: 无新运行时依赖（纯前端实现 + GitHub Issues API）
