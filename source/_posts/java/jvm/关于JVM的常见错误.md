---
title: 与JVM相关的错误
date: 2016-12-13 16:51:16
categories:
- JVM
tags:
- java
---

-  `java.lang.outOfMemoryError: PermGen space`jdk7及以下，方法区内存溢出，使用动态代理，有可能会在运行时生成大量的类

  -XX:PermSize和-XX:MaxPermSize（默认大小64MB）指定大小

  `java.lang.OutOfMemoryError: Metadata space`jdk8开始，元空间内存溢出

  -XX:MaxMetaspaceSize指定大小(不指定的情况下可能会耗尽所有的可用系统内存)

```java
public class DumpOOM {
	public static void main(String[] args) {
		Vector v = new Vector(); 
		for (int i = 0; i < 15; i++) {
			v.add(new byte[1*1024*1024]);
		}
	}
}
```

使用`-Xmx10m -Xms10m -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=H:/a.dump`执行

-XX:+HeapDumpOnOutOfMemoryError可以在内存溢出时导出整个栈的信息。-XX:HeapDumpPath=path

可以指定导出堆的存放位置。可以使用MAT等工具打开文件进行分析

- `java.lang.StackOverflowError`

  java栈内存溢出，通常是由于函数调用嵌套过多（无穷的递归嵌套）

  -Xxs指定线程的最大栈空间

