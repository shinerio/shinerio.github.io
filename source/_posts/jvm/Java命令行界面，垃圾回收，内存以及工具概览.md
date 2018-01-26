---
title: Java命令行，垃圾回收，内存及工具概览
date: 2016-12-18 20:13:21
categories:
- JVM
tags:
- 转载
- java
---

看到一篇不错的外文博客，阅读的同时将其翻译以加深记忆，<a href="https://www.ctheu.com/2016/01/10/java-cli-gc-memory-and-tools-overview/">传送门</a>

阅读本文的前提是你了解Java并且知道垃圾回收器对于新生代和老年代的处理。希望这篇博客能让你学到一些新的技巧。

- Java命令行可选项
- 简要概括垃圾回收器及其日志
- 内存管理和限制
- debug和剖析JVM的可视化工具
- JVM命令行工具

环境如下：

>java version “1.8.0_66″
>Java(TM) SE Runtime Environment (build 1.8.0_66-b18)
>Java HotSpot(TM) 64-Bit Server VM (build 25.66-b18, mixed mode)# 

# Java参数概述

我将介绍一些最有用的用于获得更多关于ava运行时信息参数的设置

- -XX:+[option]    设置option选项
- -XX:+[option]    取消option选项
- -XX:[property]=    设置参数的值

首先，JVM的默认可选项参数

使用`java -XX:+PrintCommandLineFlags -version`获得

-XX:InitialHeapSize=268055680 -XX:MaxHeapSize=4288890880 -XX:+PrintCommandLineFlags

-XX:+UseCompressedClassPointers -XX:+UseCompressedOops 

-XX:-UseLargePagesIndividualAllocation

-XX:+UseParallelGC

- -XX:IntialHeapSize=268055680,默认为RAM的1/64(简写-Xms)
- -XX:MaxHeapSize=4288890880默认为RAM的1/4(简写-Xmx)
- -XX:+UseParallelGC默认新生代使用ParallelGC回收器，老年代使用串行收集器

使用-XX:+PrintFlagsFinal列出所有存在的参数配置以及他们的值，有上百之多。

以下仅仅列出我们可以用来获取更多关于日志以及垃圾回收相关信息的参数

```
$ java -XX:+PrintFlagsFinal -version
[Global flags]
...
bool PrintAdaptiveSizePolicy             = false      {product}
bool PrintCMSInitiationStatistics        = false      {product}
intx PrintCMSStatistics                  = 0          {product}
bool PrintClassHistogram                 = false      {manageable}
bool PrintClassHistogramAfterFullGC      = false      {manageable}
bool PrintClassHistogramBeforeFullGC     = false      {manageable}
bool PrintCodeCache                      = false      {product}
bool PrintCodeCacheOnCompilation         = false      {product}
bool PrintCommandLineFlags               = false      {product}
bool PrintCompilation                    = false      {product}
bool PrintConcurrentLocks                = false      {manageable}
intx PrintFLSCensus                      = 0          {product}
intx PrintFLSStatistics                  = 0          {product}
bool PrintFlagsFinal                    := true       {product}
bool PrintFlagsInitial                   = false      {product}
bool PrintGC                             = false      {manageable}
bool PrintGCApplicationConcurrentTime    = false      {product}
bool PrintGCApplicationStoppedTime       = false      {product}
bool PrintGCCause                        = true       {product}
bool PrintGCDateStamps                   = false      {manageable}
bool PrintGCDetails                      = false      {manageable}
bool PrintGCID                           = false      {manageable}
bool PrintGCTaskTimeStamps               = false      {product}
bool PrintGCTimeStamps                   = false      {manageable}
bool PrintHeapAtGC                       = false      {product rw}
bool PrintHeapAtGCExtended               = false      {product rw}
bool PrintHeapAtSIGBREAK                 = true       {product}
bool PrintJNIGCStalls                    = false      {product}
bool PrintJNIResolving                   = false      {product}
bool PrintOldPLAB                        = false      {product}
bool PrintOopAddress                     = false      {product}
bool PrintPLAB                           = false      {product}
bool PrintParallelOldGCPhaseTimes        = false      {product}
bool PrintPromotionFailure               = false      {product}
bool PrintReferenceGC                    = false      {product}
bool PrintSafepointStatistics            = false      {product}
intx PrintSafepointStatisticsCount       = 300        {product}
intx PrintSafepointStatisticsTimeout     = -1         {product}
bool PrintSharedArchiveAndExit           = false      {product}
bool PrintSharedDictionary               = false      {product}
bool PrintSharedSpaces                   = false      {product}
bool PrintStringDeduplicationStatistics  = false      {product}
bool PrintStringTableStatistics          = false      {product}
bool PrintTLAB                           = false      {product}
bool PrintTenuringDistribution           = false      {product}
bool PrintTieredEvents                   = false      {product}
bool PrintVMOptions                      = false      {product}
bool PrintVMQWaitTime                    = false      {product}
bool PrintWarnings                       = true       {product}
...
bool UseParNewGC                         = false      {product}
bool UseParallelGC                      := true       {product}
bool UseParallelOldGC                    = true       {product}
...
```

“:=”指默认值被你或者JVM工程重写了。

更进一步，你可以知道任何JVM操控的参数的默认值

例如，你可以通过`| grep NewSize`新生代大小

```
uintx MaxNewSize                       := 1430257664  {product}
uintx NewSize                          := 89128960    {product}
```

# 日志方面更多的细节

