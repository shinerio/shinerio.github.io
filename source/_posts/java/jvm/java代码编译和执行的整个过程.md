---
title: java代码编译与执行
date: 2019-03-30
categories:
- java
tags:
- java
---



## java代码编译和执行的整个过程

java代码编译是由java源码编译器完成

![img](http://wiki.jikexueyuan.com/project/java-vm/images/javadebug.gif)

java字节码的执行由jvm执行引擎完成

![img](http://wiki.jikexueyuan.com/project/java-vm/images/jvmdebug.gif)

## java代码编译和执行的过程包含了三个重要机制

- java源码编译机制
- 类加载机制
- 类执行机制

### 1. 源码编译机制

- 分析和输入到符号表
- 注解处理
- 语义分析和生成class文件

class文件的组成

- 结构信息。包括class文件格式版本号及各部分的数量与大小的信息
- 元数据。对应于java源码中声明与常量的信息。包含类/继承的超类/实现的接口的声明信息、域与方法声明信息和常量池。
- 方法信息。对应 Java 源码中语句和表达式对应的信息。包含字节码、异常处理器表、求值栈与局部变量区大小、求值栈的类型记录、调试符号信息。

### 2. 类加载机制

JVM是通过ClassLoader及其子类来完成类加载的

![img](http://wiki.jikexueyuan.com/project/java-vm/images/jvmclass.gif)

- Bootstrap ClassLoader

  负责加载$JAVA_HOME中jre/lib/*.jar里面的所有class，由c++实现，不是ClassLoader子类

- Extension ClassLoader

  负责加载Java平台中扩展功能的一些 jar 包，包括`$JAVA_HOME中jre/lib/ext或`-Djava.ext.dirs`指定目录下的 jar 包。

- App ClassLoader

  负责记载 classpath 中指定的 jar 包及目录中 class。

- Custom ClassLoader

  属于应用程序根据自身需要自定义的 ClassLoader，如 Tomcat、jboss 都会根据 J2EE 规范自行实现 ClassLoader。

加载过程中会先检查类是否被已加载，检查顺序是自底向上，从 Custom ClassLoader 到 BootStrap ClassLoader 逐层检查，只要某个 Classloader 已加载就视为已加载此类，保证此类只所有 ClassLoade r加载一次。而加载的顺序是自顶向下，也就是由上层来逐层尝试加载此类。

### 3. 类执行机制

JVM 是基于栈的体系结构来执行 class 字节码的。线程创建后，都会产生程序计数器（PC）和栈（Stack），程序计数器存放下一条要执行的指令在方法内的偏移量，栈中存放一个个栈帧，每个栈帧对应着每个方法的每次调用，而栈帧又是有局部变量区和操作数栈两部分组成，局部变量区用于存放方法中的局部变量和参数，操作数栈中用于存放方法执行过程中产生的中间结果。

![img](http://wiki.jikexueyuan.com/project/java-vm/images/classrun.gif)

