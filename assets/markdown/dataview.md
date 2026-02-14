# 1 查询依据
yaml数据/metainfo
# 2 使用查询语言

使用下列语法创建查询语言代码块

````text
```dataview
 query command
```
````

## 2.1 examples

### 2.1.1 列表

例如，使用以下方式我们可以给每个文件夹创建一个目录

````text
```dataview
# 文件全路径名包含Note/Obsidian
LIST WHERE contains(file.path, "Note/Obsidian")
```
````

```dataview
LIST WHERE contains(file.path, "Note/Obsidian")
```

# 3 使用内联查询

内联查询的结果只能是一个，不能查询一个列表。当前页面可以通过`this.`获得，其他页面可以通过双链语法`[[page_name]]`获得

通过下列语法创建内联查询：

```text
`= this.file.name` 
```

此博客文件名：`= this.file.name`

# 4 使用JavaScript API

使用下列语法创建JS dataview代码块：

````text
```dataviewjs
... js code ...
```
````

# 5 参考链接
[官方文档](https://blacksmithgu.github.io/obsidian-dataview/)
