---
title: BlogTips
date: 2020年4月26日
categories:
- others
tags:
- others
---

本文介绍一写常见博客写作技巧。

<!--more-->

## 1. Markdown格式技巧

这部分内容主要参考自[引用1](#ref1)

### 1.1 图片居中并添加图注

```html
<div align="center">
<img src="https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200426164220.png" width="200"><br>
<sup><strong>Fig 1:</strong>这是图注</sup>
</div>
```

<div align="center">
<img src="https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200426164220.png" width="200"><br>
<sup><strong>Fig 1:</strong>这是图注</sup>
</div>

### 1.2 图片或文字居中

```html
<div align="center">
这是一段居中显示的文字
</div>
```

<div align="center">
这是一段居中显示的文字
</div>
### 1.3 点击查看更多

```html
<details>
<summary>Click here to see terminal history + debug info</summary>
<pre>
488 cd /opt/LLL/controller/laser/
489 vi LLLSDLaserControl.c
490 make
491 make install
492 ./sanity_check
493 ./configure -o test.cfg
494 vi test.cfg
495 vi ~/last_will_and_testament.txt
496 cat /proc/meminfo
497 ps -a -x -u
498 kill -9 2207
499 kill 2208
500 ps -a -x -u
501 touch /opt/LLL/run/ok
502 LLLSDLaserControl -ok1

正文和上一段保持空行
```

<details>
<summary>Click here to see terminal history + debug info</summary>
<pre>
488 cd /opt/LLL/controller/laser/
489 vi LLLSDLaserControl.c
490 make
491 make install
492 ./sanity_check
493 ./configure -o test.cfg
494 vi test.cfg
495 vi ~/last_will_and_testament.txt
496 cat /proc/meminfo
497 ps -a -x -u
498 kill -9 2207
499 kill 2208
500 ps -a -x -u
501 touch /opt/LLL/run/ok
502 LLLSDLaserControl -ok1
正文和上一段保持空行

### 1.4 文字添加颜色

```html
<font color=red>红色</font>
<font color=blue>蓝色</font>
<font color=#008000>绿色</font>
```

<font color=red>红色</font>
<font color=blue>蓝色</font>
<font color=#008000>黄色</font>

### 1.5 diff

```
​```diff
10 PRINT “BASIC IS COOL”
- 20 GOTO 11
+ 20 GOTO 10
​```
```
```diff
10 PRINT “BASIC IS COOL”
- 20 GOTO 11
+ 20 GOTO 10
```

### 1.6 按键样式

```
<kbd>W</kbd>
<kbd>ESC</kbd>
<kbd>return</kbd>
```

<kbd>W</kbd>
<kbd>ESC</kbd>
<kbd>return</kbd>

## 2. Alfred-Snippets

对于写博客的人来说，想要实现这些功能，需要写较长的html代码，这无疑增加了我们的工作量，这时候我们可以配合Alfred食用。Alfred的Snippets可以使用关键词替换一个文本片段，比如我们可以将1.3中html主体部分用关键字blogdetail替代，当我们键入blogdetail的时候自动转换，关于这部分内容可以参考[引用2](#ref2)

[Alfred](https://www.alfredapp.com/extras/snippets/)也为我们提供了很多常用的Snippets，感兴趣的可以自行[前往下载](https://www.alfredapp.com/extras/snippets/)。例如:

🇨🇳🇭🇰🇺🇸🇬🇧

:joy::sob:

⌥⌘<kbd>↵</kbd><kbd>⇪</kbd><kbd>⎋</kbd>

##3. 引用

1. <span id="ref1">[GitHub Protips: Tips, tricks, hacks, and secrets from Lee Reilly](https://github.blog/2020-04-09-github-protips-tips-tricks-hacks-and-secrets-from-lee-reilly/)</span>
2. <span id="ref2">[Mac效率神器Alfred系列教程---Snippets文字扩展](https://zhuanlan.zhihu.com/p/33753656)</span>