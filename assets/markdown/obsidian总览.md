---
tags:
- obsidian
- tool
---

#obsidian 

# 1. 视图

obsidian一共提供了三种视图：

- preview mode：预览模式，可以编辑，显示实时预览结果，此模式下metadata不会渲染
- reading mode：阅读模式，markdown渲染后结果，不可编辑
- source mode：以纯文本形式显示markdown

以下是我的切换快捷键设置

- `⌘⌥S` 切换预览和源码模式
- `⌘E` 切换预览和阅读模式
- 阅读和源码模式无法直接相互切换

 ---
# 2. 核心功能

## 2.1. 双链

### 2.1.1. 语法
- 链接到文章， `[[obsidian总览]]` 
- 链接到标题，`[[obsidian总览#语法]]` ^c9e6ba
- 链接到文本块，`[[obsidian总览#^c9e6ba]]`
- 链接别名，`[[obsidian总览#^c9e6ba | 链接别名]]`

### 2.1.2. 查看
按住`ctrl或command`，光标悬浮预览。

[[Obsidian总览]]
[[Obsidian总览#语法]]
[[Obsidian总览##^c9e6ba]]
[[Obsidian总览#^c9e6ba | 链接别名]]

### 2.1.3. 引用
使用`![[]]`可以直接将段落引用到当前页面，作为当前页面的一部分显示.
![[Obsidian总览#语法]]

### 2.1.4. 标注
[Callouts - Obsidian Help](https://help.obsidian.md/Editing+and+formatting/Callouts#Supported+types)

> [!tip]

> [!bug]

> [!warning]

> [!info]

> [!failure]

> [!success]

> [!question]

> [!danger]

> [!example]

> [!unknown]

> [!note]

> [!todo]



## 2.2. 搜索

### 2.2.1. `⌘F`进行搜索当前文档

### 2.2.2. `⌘⇧F`搜索整个资料库

默认是搜索全部内容，也可以使用`prefix:`的形式指定范围搜索。

	1. 搜索文本内容：`content:key`
	2. 搜索文件名：`file:key`
	3. 搜索tag: `tag:#key`
	4. 搜索同一章节：`section:key`
	5. 搜索同一段落：`block:key`
	6. 搜索同一行：`line:(key1 key2)`

obsidian还支持多个关键词组合查询，举例如下：

- 文件同时包含obsidian和tool标签，`tag:#obsidian and tag:#tool`
- 文件名包含数据库关键词，且文本中某一行同时出现了隔离和mysql关键字，`file:数据库 line:(隔离 mysql)`
- 文件名包含数据库或者文件名包含obsidian，`file:数据库 OR file:obsidian`
- 文件名包含数据库或者拥有obsidian标签，`file:数据库 OR tag:#database`
- 文件包包含数据库且不包含隔离关键字，`file:数据库 - file:隔离`

### 2.2.3. 搜索task

- 搜索所有待办事项：`task:''`
- 所有带有指定关键词的待办事项：`task:key`
- 搜索未完成的待办事项：`task-todo:''`
- 搜索已完成的待办事项：`task-done:''`

### 2.2.4. 保存搜索结果

使用如下语法进行查询

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/obsidian%E4%BF%9D%E5%AD%98%E6%9F%A5%E8%AF%A2%E7%BB%93%E6%9E%9C.png)

查询结果会内嵌到当前页面中。

```query
file:obsidian OR tag:#obsidian
```

## 2.3. 标签

#obsidian

obsidian添加标签有两种方式：

1. 在文章任意地方可以通过 `#标签名称` 插入标签，然后可以在「标签面板」中看到所有仓库中的标签。注意标签需要在单独一行，且`#`和标签名称间不能存在空格，否则会当成标题处理。
2. 在文章的meta区通过yaml语法插入标签，如下：
```yaml
---
tags:
- obsidian
---
```

---

# 3. 核心插件

## 3.1. 幻灯片

## 3.2. 日记

## 3.3. canvas

### 3.3.1. card
canvas支持以下几种card
- text card
- markdown笔记
- 视频&文件
- pdf文件
- 网页，可以预览整个网页

### 3.3.2. 拖拽文件夹

![Kapture 2023-01-21 at 14.00.50.gif](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/canvas%E6%8B%96%E6%8B%BD%E6%96%87%E4%BB%B6%E5%A4%B9.gif)

### 3.3.3. group

同时选中多个card，右击可以新建group

### 3.3.4. 嵌套
canvas支持嵌套使用，即在一个canvas上叠加canvas

## 3.4. Template

obsidian支持模板功能，可以快速插入一段模板代码。还支持动态参数，如`{{date:YYYY-MM-DD}}` 可以获取当天时间

第三方插件Templater可以支持更为强大的模板功能。

# 4. 三方插件

| 名称                                                                                        | 简介                                  | 详情介绍                         |
| ----------------------------------------------------------------------------------------- | ----------------------------------- | ---------------------------- |
| [paste url into selection](https://github.com/MarkMindCkm/obsidian-markmind)              | 可以实现选中文字后，按下`command + v`即可将url链接到文 |                              |
| [Editor Syntax Highlight](https://github.com/deathau/cm-editor-syntax-highlight-obsidian) | 代码高亮                                |                              |
| [mind map](https://github.com/lynchjames/obsidian-mind-map)                               | 将markdown通过思维导图的方式呈现                | [[Mind map]]                 |
| [Advanced Table](https://github.com/tgrosinger/md-advanced-tables)                        | 增强的表格工具                             | [[Advanced Table]]           |
| [Excalidraw](https://github.com/zsviczian/obsidian-excalidraw-plugin)                     | 手绘风格作图工具                            | [[Excalidraw]]               |
| File Explorer Note Count                                                                  | 显示文件夹中文件数量                          |                              |
| Image auto upload                                                                         | 图床工具                                | [[Image auto upload Plugin]] |
| Minimal Theme Setting                                                                     | obsidian主题设置                        | [[Minimal Theme setting]]    |
| Quick Explorer                                                                            | obsidian窗口下方显示文件导航                  |                              |
| pandoc                                                                                    | 将obsidian笔记导出为其他各种格式的文件             |                              |
| [memos](https://github.com/quorafind/obsidian-memos)                                      | 备忘录，记录小灵感                           |                              |
| dataview                                                                                  |                                     | [[dataview]]                 |
| kanban                                                                                    |                                     |                              |
| tasks                                                                                     |                                     |                              |
| calender                                                                                  |                                     |                              |
| reveal active file button                                                                 | 可以自动展开当前文件路径                        |                              |
| better file link                                                                          | 可以将文件插入到当前page，也可以引用其他存储目录的文件       |                              |
| [Templater](https://silentvoid13.github.io/Templater/)                                    | 支持强大的模板语法                           |                              |
| Number Headings                                                                           | 可以自动给标题编号                           |                              |
| Kanban                                                                                    | 可以实现类似teambition或者trello类似的看板功能     |                              |
| Eidting toolbar                                                                           | 提供一个编辑栏，给文字加颜色，添加附件等等工具             |                              |
| spreadsheet                                                                               | 提供类似于excel的高级表格工具                   |                              |
| obsidian git                                                                              | 使用git同步笔记，国内使用gitee体验更好             |                              |

# 5. 调试

当使用obsidian插件遇到问题的时候，可以使用`⌘+⌥+i`打开调试窗口。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/obsidian%E8%B0%83%E8%AF%95%E7%AA%97%E5%8F%A3.png)

# 6. 发布gitpage

## 6.1. excalidraw转化
1. 设置excalidraw同步生成svg图片
2. 图片上传阿里云，并自动将`![[]]`语法转化为`![]()`图片引用

```shell
# 以北京为例
git clone git@github.com:shinerio/ob_tools.git
cd ob_tools
export oss_endpoint='http://oss-cn-beijing.aliyuncs.com'
export oss_path='obsidian/'
export oss_ak=your_ak
export oss_sk=your_sk
export oss_bucket=your_bucket
python main.py --vaultpath="obsidian vault路径 \
--input="需要转换的文件相对于vaultpath的路径" \
--outputpath="输入文件根路径, 输出目录将会保持和vault一样的目录结构" \
--attachment="本地图片存储路径"
```