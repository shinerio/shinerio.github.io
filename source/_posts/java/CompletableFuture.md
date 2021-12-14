---
title: CompletableFuture
date: 2021-12-14
categories:
- 异步编程
tags:
- 异步编程
- java
---

JAVA 5中引入了Future特性，可以获取异步执行结果。Future多用于使用线程池执行任务后获取任务结果，当我们submit一个callable的任务时可以获取一个Future对象，通过调用get()方法阻塞获得任务结果，或者通过轮训isDone()来判断任务是否执行完成。无论是使用get()和isDone()的方式，都会造成父线程的被迫等待，不算是真正的异步。JAVA8引入了一系列优秀的特性，包括lambda表达式，steam流式操作，同时也引入了CompletableFuture来提供更优雅的异步编程手段。

<!--more-->

 ## 类声明
 
 ```java
 public class CompletableFuture<T> implements Future<T>, CompletionStage<T>
 ```
 
 CompletableFuture除了实现了Future接口之外，还实现了CompletionStage接口。CompletionStage提供了一系列丰富的接口，可以添加一些回调函数用于任务完成时触发，通过这个异步任务流的方式可以构建出一个非阻塞的系统。
 
 ## supplyAsync和runAsync
 
 CompletableFuture提供了四个方法来开启一个异步方法，其中CompletableFuture.supplyAsync()支持返回值，而CompletableFuture.runAsync()不支持返回值。如果不指定Executor，则使用ForkJoinPool.commonPool()，ForkJoinPool的commonPool是一个静态方法，提供公共的线程池共业务使用。

```java

    public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier) {
        return asyncSupplyStage(asyncPool, supplier);
    }

    public static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor) {
        return asyncSupplyStage(screenExecutor(executor), supplier);
    }

    public static CompletableFuture<Void> runAsync(Runnable runnable) {
        return asyncRunStage(asyncPool, runnable);
    }

    public static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor) {
        return asyncRunStage(screenExecutor(executor), runnable);
    }
```

```java
        Executor executor = Executors.newSingleThreadExecutor();
        CompletableFuture.runAsync(() -> System.out.println("test run async, ForkJoin.commonPool!"));
        CompletableFuture.runAsync(() -> System.out.println("test run async, customize thread pool!"), executor);
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "supply async, ForJoin.CommonPool!");
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "supply async, customize thread pool!", executor);
        System.out.println(future1.get());
        System.out.println(future2.get());
```