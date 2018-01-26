---
title: JVM堆空间结构及垃圾回收过程分析
date: 2016-12-13 21:07:28
categories:
- JVM
tags:
- java
---

# Java堆空间

![](http://ohyqvzpmb.bkt.clouddn.com/images/LearnJVM/jvm_heap_structure.png)

新生代存放新生对象或者年龄不大的对象，老年代存放老年对象。from和to区域是两块大小相等，可以互换角色的内存空间，详细内容会在以后的博文中介绍

在大多数情况，对象首先被分配在eden区，在一次新生代回收之后，如果对象还存活，则会进入from或者to区，之后每经过一次新生代回收，对象如果存活，年龄就会加1，当对象年龄达到一定条件后，就会被认为是老年对象，从而进入老年代。

# 垃圾回收追踪

参数配置

| -Xms                            | 初始堆大小。如：-Xms256m                         |
| ------------------------------- | ---------------------------------------- |
| -Xmx                            | 最大堆大小。如：-Xmx512m                         |
| -Xmn                            | 新生代大小。通常为 Xmx 的 1/3 或 1/4。新生代 = Eden + 2 个 Survivor 空间。实际可用空间为 = Eden + 1 个 Survivor，即 90% |
| -Xss                            | JDK1.5+ 每个线程堆栈大小为 1M，一般来说如果栈不是很深的话， 1M 是绝对够用了的。 |
| -XX:NewRatio                    | 新生代与老年代的比例，如 –XX:NewRatio=2，则新生代占整个堆空间的1/3，老年代占2/3 |
| -XX:SurvivorRatio               | 新生代中 Eden 与 Survivor 的比值。默认值为 8。即 Eden 占新生代空间的 8/10，另外两个 Survivor 各占 1/10 |
| -XX:PermSize（JDK1.8废除）          | 永久代(方法区)的初始大小                            |
| -XX:MaxPermSize （JDK1.8废除）      | 永久代(方法区)的最大值                             |
| -XX:+PrinGCDetails              | 打印 GC 信息                                 |
| -XX:+HeapDumpOnOutOfMemoryError | 让虚拟机在发生内存溢出时 Dump 出当前的内存堆转储快照，以便分析用      |
| -XX:MaxMetaspaceSize            | 限制元空间大小，默认情况下类的元空间分配由可用本机内存量决定           |

测试代码：

```java
public class TestLocalVar {
	public  void localvarGC(){
		byte[] a = new byte[6*1024*1024];
		System.gc(); // 由于a变量还在作用域中，所以垃圾回收不能回收空间
	}
	public static void main(String[] args) {
       // 此时localVarGC方法执行完毕，栈帧被销毁，自然数组也失去引用，所以可以回收数组空间
		TestLocalVar v = new TestLocalVar();
		v.localvarGC();
		System.gc();
	}
}
```

使用-XX:+PrintGC来打印日志

```
[GC (System.gc())  8806K->6768K(125952K), 0.0070835 secs]   //Major GC仅为新生代GC
[Full GC (System.gc())  6768K->6658K(125952K), 0.0107015 secs]  //Full GC同时回收新生代、老年代及元空间(metaspace)
[GC (System.gc())  7324K->6722K(125952K), 0.0007453 secs]
[Full GC (System.gc())  6722K->514K(125952K), 0.0102179 secs]
```

数组占用空间为6MB，可见第一次（GC和Full GC为一次）垃圾回收并没有能处理

第二次6722k->514k，回收6208k（约为6M），由此可见数组在第二次垃圾回收时被成功回收，当前可用堆空间总和为125952k(123M)

-----

使用-XX:+PrintGCDetails获得详细信息，标号符和分割线为方便观察，后期人为添加的

```
1* [GC (System.gc()) [PSYoungGen: 8806K->616K(38400K)] 8806K->6760K(125952K), 0.0122872 secs] 
 [Times: user=0.00 sys=0.00, real=0.01 secs] 
2* [Full GC (System.gc()) [PSYoungGen: 616K->0K(38400K)] [ParOldGen: 6144K->6658K(87552K)] 6760K->6658K(125952K), [Metaspace: 2471K->2471K(1056768K)], 0.0126725 secs] [Times: user=0.03 sys=0.00, real=0.01 secs] 
--------------------------------------------------------------------------------------------
3* [GC (System.gc()) [PSYoungGen: 0K->0K(38400K)] 6658K->6658K(125952K), 0.0006529 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
4* [Full GC (System.gc()) [PSYoungGen: 0K->0K(38400K)] [ParOldGen: 6658K->514K(87552K)] 6658K->514K(125952K), [Metaspace: 2471K->2471K(1056768K)], 0.0105661 secs] [Times: user=0.00 sys=0.00, real=0.01 secs] 
---------------------------------------------------------------------------------------------
5* Heap
 PSYoungGen      total 38400K, used 998K [0x00000000d5e00000, 0x00000000d8880000, 0x0000000100000000)
  eden space 33280K, 3% used [0x00000000d5e00000,0x00000000d5ef9b70,0x00000000d7e80000)
  from space 5120K, 0% used [0x00000000d8380000,0x00000000d8380000,0x00000000d8880000)
  to   space 5120K, 0% used [0x00000000d7e80000,0x00000000d7e80000,0x00000000d8380000)
 ParOldGen       total 87552K, used 514K [0x0000000081a00000, 0x0000000086f80000, 0x00000000d5e00000)
  object space 87552K, 0% used [0x0000000081a00000,0x0000000081a80a08,0x0000000086f80000)
 Metaspace       used 2480K, capacity 4486K, committed 4864K, reserved 1056768K
  class space    used 273K, capacity 386K, committed 512K, reserved 1048576K
```

1* 新生区回收效果（8806K->616K）整个堆（8806K->6760k）

2* 同时回收新生代、老年代、和元空间

新生区清空（616K->0K），老年区（6144K->6658K），整个堆（6760K->6658K），【这里总空间变化与新生区和老年区变化总量不相等，按道理应该相等的，有哪位读者知道原因，麻烦留下言】元空间不变

User代表用户态CPU耗时，sys表示系统CPU耗时，real表示GC实际经历时间

3和4类似，这里就不过多解释了

5* 虚拟机会在推出前打印堆详细信息，描述了堆各个区间使用情况

- PSYoungGen:新生区总大小38400k，使用998k，[0x00000000d5e00000,0x00000000d5ef9b70,0x00000000d7e80000)分别表示新生代下界，当前上界和上界

  上界-下界：（0x00000000d7e80000-0x00000000d5e00000）/1024 = 33280k为eden大小（当前堆空间的理论可用最大值，新生对象总会放在eden中，所以并非真正总堆空间，真正堆空间也不是total=8755k,因为虚拟机同时只能使用from和to中的一个，所以系统分配的堆空间总大小其实是33280+5120*2）

  当前上界-下界：（0x00000000d5ef9b70-0x00000000d5e00000）/1024=997.18k等于已使用的空间

关于这部分空间的计算，参考<http://www.blogjava.net/fancydeepin/archive/2013/09/29/jvm_heep.html>

- ParOldGen类似

----

# 补充虚拟机相关设置

-XX:+PrintHeapAtGC在每次GC前后打印堆信息，获得更全面的堆信息

-XX:+PrintGCTimeStamps，输出每次GC发生在虚拟机启动后的时间偏移量

-XX:+PrintGCApplicationConcurrentTime打印应用程序的执行时间

-XX:+PrintGCApplicationStoppedTime打印应用程序由于G而产生的停顿时间

-XX:PrintReferenceGC跟踪系统内的软引用、弱引用和Finallize队列

---

# 扩展

默认情况下GC日志会在控制台输出，不利于分析及定位问题，虚拟机允许将GC日志以文件形式输出

用-Xloggc:filepath指定

