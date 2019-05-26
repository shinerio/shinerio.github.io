---
title: java栈结构
date: 2016-12-13 23:36:34
categories:
- JVM
tags:
- java
---

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/jvm/jvm_stack_structure.png)
使用-Xss来指定线程最大的栈空间，间接影响了方法调用的最大深度

方法1入栈，调用方法2,，方法2入栈，调用方法3，方法3入栈，调用方法4，方法4入栈，方法4调用结束，出栈.....当前被执行的方法所对应的栈位于栈顶，其中保存着方法的局部变量、中间运算结构等数据。

<!--more-->

# 栈帧被弹出的两种方式

- 正常使用return语句返回
- 抛出异常

# 栈帧的结构

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/jvm/jvm_stackframe_structure.png)

- 局部变量表：保存方法的参数及局部变量。方法执行结束，栈帧销毁，局部变量表销毁，参数及局部变量也随之销毁。

> 实例方法的第一个局部变量都是this的引用，占据1字（32位机为4B,64位机8B）
>
> 局部变量可以复用超过其作用范围的局部变量的槽位而减少最大局部变量表空间。

- 操作数栈：保存计算过程的中间结果，同时作为计算过程中变量临时的存储空间
- 帧数据区：访问常量的指针，方便程序访问常量池，方法返回或出现异常时，虚拟机用来回复调用函数的栈帧。

