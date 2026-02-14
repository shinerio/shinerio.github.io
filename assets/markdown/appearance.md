打开笔记仓库的 .obsidian 文件夹，其中如果没有 snippets 文件夹则创建。在 Obsidian 中的 CSS snippets 都是以 .css 的档案格式储存在特定的文件夹。如果你有将 CSS snippets 放到该文件夹，就会在 Obsidian 显示开关。
1. 别人给你的，或者你看到不错的代码片段（CSS）文件，放进 snippets 文件夹就行。或者自己建立一个 CSS 文件，书写你自己的样式当然需要一点 CSS 代码基础。
2. Obsidian > 设置 > 外观，最后一项【CSS 代码片段】，刷新一下，会显示出新增的文件，把后面的切换按钮打开即可。
```css
/* 对引用进行设计 */
blockquote {
    border-left: 4px solid #4caf50!important; /* 鲜明的绿色边界 */
    background-color: #e8f5e9!important; /* 浅绿色背景 */
    color: #2e7d32!important; /* 引用文本的深绿色 */
    padding: 13px; /* 内边距 */
    margin: 16px 0; /* 外边距 */
 }
 
 /* 对粗体文字设置橙色文字和淡色背景*/
 b, strong {
     color: rgba(255,69,0,1); /* 橙红色 */;
 background-color: #f0f0f0; /* 淡灰色背景 */
     padding: 2px 4px; /* 加点内边距让背景更明显 */
     border-radius: 2px; /* 可选：为背景添加圆角 */
 }
 
/* 标题1设计，左侧边，居中，红色背景*/
 h1 {
  color: black!important;
   margin-bottom: 2em;
   margin-right: 5px;
   padding: 8px 15px;
   letter-spacing: 2px;
    /* 保持文字颜色为纯白色 */
   border-left: 10px solid rgba(240,19,19,0.5); /* 可以根据需要调整边框颜色 */
   background:rgba(240,19,19, 0.25);
   border-radius: 5px;
   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* 文字阴影，增强对比 */
   box-shadow: 1px 1px 2px rgba(51, 51, 51, 0.5); /* 盒子阴影，可根据需要调整 */
   text-align: center;
 }
 
/* 标题2设计，左侧边，居中，绿色背景*/
 h2 {
  color: black!important;
   margin-bottom: 2em;
   margin-right: 5px;
   padding: 8px 15px;
   letter-spacing: 2px;
    /* 保持文字颜色为纯白色 */
   border-left: 10px solid rgba(102, 204, 153,0.5); /* 可以根据需要调整边框颜色 */
    background:rgba(102, 204, 153, 0.25);
   border-radius: 5px;
   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3); /* 文字阴影，增强对比 */
   box-shadow: 1px 1px 2px rgba(51, 51, 51, 0.5); /* 盒子阴影，可根据需要调整 */
   text-align: center;
 }

```