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
</pre>
</details>
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
</pre>
</details>

### 1.4 文字添加颜色

```html
<font color=red>红色</font>
<font color=blue>蓝色</font>
<font color=#008000>绿色</font>
```

<font color=red>红色</font>
<font color=blue>蓝色</font>
<font color=#008000>黄色</font>

### 1.5 警告提示块

```
!!! note hexo-admonition 插件使用示例
    这是基于 hexo-admonition 插件渲染的一条提示信息。类型为 note，并设置了自定义标题。 
    提示内容开头留 4 个空格，可以有多行，最后用空行结束此标记。
```

!!! note hexo-admonition 插件使用示例
    这是基于 hexo-admonition 插件渲染的一条提示信息。类型为 note，并设置了自定义标题。标题是可选的，当为设置时，将用类型名称作为默认值
    提示内容开头留 4 个空格，可以有多行，最后用空行结束此标记。

支持如下类型：

- note
- info,todo
- warning,attention,caution
- error,failure,missing,fail

```
!!! warning
    这是一条采用默认标题的警告信息。
```

!!! warning
    这是一条采用默认标题的警告信息。

```
!!! Warning ""
    这是一条不带标题的警告信息。
```

!!! Warning ""
    这是一条不带标题的警告信息。

```
!!! node "嵌套链接及引用块"
    在hexo-admonition内部可以嵌套标准markdown标签, 如引用
    > 原文作者 [悟尘纪](https://www.lixl.cn)
```

!!! node "嵌套链接及引用块"
    在hexo-admonition内部可以嵌套标准markdown标签, 如引用
    > 原文作者 [悟尘纪](https://www.lixl.cn)

## 2. Alfred-Snippets

对于写博客的人来说，想要实现这些功能，需要写较长的html代码，这无疑增加了我们的工作量，这时候我们可以配合Alfred食用。Alfred的Snippets可以使用关键词替换一个文本片段，比如我们可以将1.3中html主体部分用关键字blogdetail替代，当我们键入blogdetail的时候自动转换，关于这部分内容可以参考[引用2](#ref2)

[Alfred](https://www.alfredapp.com/extras/snippets/)也为我们提供了很多常用的Snippets，感兴趣的可以自行[前往下载](https://www.alfredapp.com/extras/snippets/)。例如:

🇨🇳🇭🇰🇺🇸🇬🇧

:joy::sob:

⌥⌘

## 3. Hexo插件

### 3.1 Emoji支持

hexo默认使用hexo-renderer-marked作为markdown渲染引擎，不支持emoji表情，可以使用[hexo-filter-github-emojis](https://github.com/crimx/hexo-filter-github-emojis)插件支持。

```bash
 $ npm install hexo-filter-github-emojis --save
```

打开博客根目录_config.yml，添加以下内容：

```yaml
githubEmojis:
  enable: true
  className: github-emoji
  unicode: false
  styles:
  localEmojis:
```

### 3.2 警告提示块

```bash
npm install hexo-admonition --save
```

<details>
<summary>将如下样式放入 hexo 主题的自定义样式文件中（如：my.css），并按自己喜好修改：</summary>
<pre>
.admonition { margin: 1.5625em 0; padding: .6rem; overflow: hidden; font-size: .64rem; page-break-inside: avoid; border-left: .3rem solid #42b983; border-radius: .3rem; box-shadow: 0 0.1rem 0.4rem rgba(0,0,0,.05), 0 0 0.05rem rgba(0,0,0,.1); background-color: #fafafa; } p.admonition-title { position: relative; margin: -.6rem -.6rem .8em -.6rem !important; padding: .4rem .6rem .4rem 2.5rem; font-weight: 700; background-color:rgba(66, 185, 131, .1); } .admonition-title::before { position: absolute; top: .9rem; left: 1rem; width: 12px; height: 12px; background-color: #42b983; border-radius: 50%; content: ' '; } .info>.admonition-title, .todo>.admonition-title { background-color: rgba(0,184,212,.1); } .warning>.admonition-title, .attention>.admonition-title, .caution>.admonition-title { background-color: rgba(255,145,0,.1); } .failure>.admonition-title, .missing>.admonition-title, .fail>.admonition-title, .error>.admonition-title { background-color: rgba(255,82,82,.1); } .admonition.info, .admonition.todo { border-color: #00b8d4; } .admonition.warning, .admonition.attention, .admonition.caution { border-color: #ff9100; } .admonition.failure, .admonition.missing, .admonition.fail, .admonition.error { border-color: #ff5252; } .info>.admonition-title::before, .todo>.admonition-title::before { background-color: #00b8d4; border-radius: 50%; } .warning>.admonition-title::before, .attention>.admonition-title::before, .caution>.admonition-title::before { background-color: #ff9100; border-radius: 50%; } .failure>.admonition-title::before,.missing>.admonition-title::before,.fail>.admonition-title::before,.error>.admonition-title::before{ background-color: #ff5252;; border-radius: 50%; } .admonition>:last-child { margin-bottom: 0 !important; }
</pre>
</details>

##4. 引用

1. <span id="ref1">[GitHub Protips: Tips, tricks, hacks, and secrets from Lee Reilly](https://github.blog/2020-04-09-github-protips-tips-tricks-hacks-and-secrets-from-lee-reilly/)</span>
2. <span id="ref2">[Mac效率神器Alfred系列教程---Snippets文字扩展](https://zhuanlan.zhihu.com/p/33753656)</span>
3. [Hexo-admonition 插件安装使用指南](https://www.lixl.cn/2020/041837756.html?spm=a2c6h.14275010.0.0.732e51c3cTag3n)