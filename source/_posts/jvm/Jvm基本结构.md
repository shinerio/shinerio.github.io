---
title: JVM基本结构
date: 2016-12-13 14:51:02
categories:
- JVM
tags:
- java
---

![](http://ohyqvzpmb.bkt.clouddn.com/images/LearnJVM/jvm_structure.png)

- 类加载子系统：负责从文件系统或者网络中加载class信息。

- 方法区：存放加载类信息，运行时的常量池信息，包括字符串字面量和数字常量（永久代从JDK8已移除，使用MetaSpace代替）

  关于常量池信息参考<http://www.cnblogs.com/iyangyuan/p/4631696.html>

- Java堆：虚拟机启动时建立，是Java程序最主要的内存工作区域。几乎所有的Java对象实例都存放于Java堆中。堆空间所有线程共享

- 直接内存：java的NIO库允许Java程序使用直接内存。直接内存是Java堆外，直接向系统申请的内存空间，使用-Xmx可以指定最大堆大小

- 垃圾回收器：可以对方法区，JAVA堆和直接内存进行回收。Java堆是垃圾回收器的工作重点。

- Java栈：JAVA虚拟机为每个线程在线程被**创建的时候**开辟一个私有的Java栈。其中保存着帧信息，局部变量，方法参数，同时和Java方法的调用、返回密切相关

- 本地方法栈：类似于Java栈，只不过用于本地方法调用，允许Java直接调用本地方法（通常C编写）

- PC寄存器：JAVA虚拟机为每个线程创建PC寄存器。在任何时刻，一个Java线程总是在执行一个方法，这个方法如果不是本地方法，PC寄存器就会指向当前正在被执行的指令。如果当前是本地方法的话，那么PC寄存器的值就是undefined

- 执行引擎：负责执行虚拟就的字节码。

