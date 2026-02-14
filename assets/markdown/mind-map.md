#obsidian 
# 1. 使用方式

使用`command+p`呼出命令行，输入`mind map`通过提示补全命令

# 2. pin

可以将思维导图的预览面板嵌到当前笔记中。

# 3. copy screenshot

将svg格式mind map复制到剪切板

# 4. bug修改

mind map已经很久没有维护了，对于代码块支持存在bug，会导致无法生成，删除如下代码段，去除对代码段的解析。

```js
else if (token.type === 'fence') {
      let result = md.renderer.render([token], md.options, {}); 
      
      // Remarkable only adds className to `<code>` but not `<pre>`, copy it to make PrismJS style work.
      const matches = result.match(/<code( class="[^"]*")>/);
      if (matches) result = result.replace('<pre>', `<pre${matches[1]}>`);
      current.c.push({
        t: token.type,
        d: depth + 1,
        v: result,
        c: []
      });
    }
```

对于文章中存在不合法的双链，解析也会有问题，如使用`![[]]`讲述双链语法，会被mind map错误地认为是一个合法的双链进行解析。但是代码没有判空。
```js
// 原文
if (linkPath.startsWith('http')) {
    continue;
}
// 修改为如下
if (typeof(linkPath) == "undefined" || linkPath.startsWith('http')) {
    continue;
}
```
