---
title: 写好Java文档注释，做一个负责的程序员
date: 2016-12-11 20:36:34
categories:
- JAVA SE
tags:
- 规范
---

# 格式

文档注释以`/**`开始，`*/`结束。javadoc命令只能在注释中出现。

# 三种类型的文档注释

```java
/** 类层次的注释 */
public class Documentation{
  /** 属性层次的注释 */
  public int id;
  /** 方法层次的注释 */
  public void sayHello(){}
}
```

# 标签使用

- @see 

```java
@see classname
@see fully-qualified-classname
@see fully-qualified-classname#method-name
```

使用“see also”作为文本链接至其他文档

- label

```
{@link package.class  member label}
```

用于行内，使用label作为链接文本

- version

```
@version version-information
```

- @author

```
@author author-information
```

- @since

指定代码最早使用的版本

- @param

```
@param paramter-name description
```

参数说明

