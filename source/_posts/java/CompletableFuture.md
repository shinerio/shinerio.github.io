---
title: CompletableFuture
date: 2021-12-14
categories:
- 异步编程
tags:
- 异步编程
- java
---

JAVA 5中引入了Future特性，可以获取异步执行结果。Future多用于使用线程池执行任务后获取任务结果，当我们submit一个callable的任务时可以获取一个Future对象，通过调用get()方法阻塞获得任务结果，或者通过轮训isDone()来判断任务是否执行完成。阻塞式的方式与异步的初衷相违背，而轮询的方式又会浪费CPU资源，通过观察者模式则可以实现在完成计算时通知订阅者。JAVA8引入了一系列优秀的特性，包括lambda表达式，steam流式操作，同时也引入了CompletableFuture来提供更优雅的异步编程手段。

<!--more-->

 ## 类声明
 
 ```java
 public class CompletableFuture<T> implements Future<T>, CompletionStage<T>
 ```
 
 CompletableFuture除了实现了Future接口之外，还实现了CompletionStage接口。CompletionStage提供了一系列丰富的接口和函数式编程的能力，可以添加一些回调函数用于任务完成时触发，通过这个异步任务流的方式可以构建出一个非阻塞的系统。
 
 ## 开启异步方法
 
completedFuture是一个静态辅助方法，用来返回一个已经计算好的CompletableFuture。此外，CompletableFuture提供了四个方法来开启一个异步方法，其中CompletableFuture.supplyAsync()支持返回值，而CompletableFuture.runAsync()不支持返回值。如果不指定Executor，则使用ForkJoinPool.commonPool()，ForkJoinPool的commonPool是一个静态方法，提供公共的线程池共业务使用。

```java

    public static <U> CompletableFuture<U> completedFuture(U value)

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

**示例：**

```java
        Executor executor = Executors.newSingleThreadExecutor();
		CompletableFuture<String> result = CompletableFuture.completedFuture("Run Over!");
        CompletableFuture.runAsync(() -> System.out.println("test run async, ForkJoin.commonPool!"));
        CompletableFuture.runAsync(() -> System.out.println("test run async, customize thread pool!"), executor);
        CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "supply async, ForJoin.CommonPool!");
        CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "supply async, customize thread pool!", executor);
```

## 主动完成计算

CompletableFuture类实现了CompletionStage和Future接口，所以可以像Future以前一样通过阻塞或者轮询的方式获得结果，但是这种方式不推荐使用。

```java
// 阻塞式等待任务执行完成，获得执行结果或异常，抛出的异常为checked exception
public T 	get()
// 等待超时时间后，抛出TimeoutException
public T 	get(long timeout, TimeUnit unit)
//立即获得结果，如果结果已经计算完则返回结果或者抛出异常，否则返回给定的valueIfAbsent值。
public T 	getNow(T valueIfAbsent)
// 阻塞式等待任务执行完成，获得执行结果或异常，抛出的异常为unchecked exception（CompletionException）
public T 	join()
```

> checked exception异常通常指RunTimeException及其子类，RuntimeException在默认情况下会得到自动处理。所以通常用不着捕获RuntimeException，但在自己的封装里，也许仍然要选择抛出一部分RuntimeException。RuntimeException是那些可能在 Java 虚拟机正常运行期间抛出的异常的超类。可能在执行方法期间抛出但未被捕获的RuntimeException的任何子类都无需在throws子句中进行声明。例如NullPointerException。除了RuntimeException以外的异常，都属于checkedException，它们都在java.lang库内部定义。Java编译器要求程序必须捕获或声明抛出这种异常。例如InterruptedException。

```java
		CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
			try {
				TimeUnit.SECONDS.sleep(10);
				return "run over";
			} catch (InterruptedException e) {
				e.printStackTrace();
				return "exception";
			}
		});
		System.out.println(future.getNow("get Now"));
```
输出
> get Now

```java
		CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
			try {
				TimeUnit.SECONDS.sleep(10);
				return "run over";
			} catch (InterruptedException e) {
				e.printStackTrace();
				return "exception";
			}
		});
		try {
			System.out.println(future.get(5, TimeUnit.SECONDS));
		} catch (TimeoutException e) {
			System.out.println("Timeout");
		}
```

输出：
> Timeout

```java
//If not already completed, sets the value returned by get() and related methods to the given value.
public boolean complete(T value) 
//f not already completed, causes invocations of get() and related methods to throw the given exception.
public boolean completeExceptionally(Throwable ex)
//Forcibly sets or resets the value subsequently returned by method get() and related methods, whether or not already completed. This method is designed for use only in error recovery actions, and even in such situations may result in ongoing dependent completions using established versus overwritten outcomes.
public void obtrudeValue(T value)
//Forcibly causes subsequent invocations of method get() and related methods to throw the given exception, whether or not already completed. This method is designed for use only in error recovery actions, and even in such situations may result in ongoing dependent completions using established versus overwritten outcomes.
public void obtrudeException(Throwable ex) 
```

> obtrudeValue、obtrudeException可以在计算完成的时候重新设置结果值，但是使用的时候要非常谨慎，因为complete已经触发了后续流程，有可能导致得不到期望的结果。

```java
		CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
			try {
				TimeUnit.SECONDS.sleep(10);
				return "run over";
			} catch (InterruptedException e) {
				e.printStackTrace();
				return "exception";
			}
		});

		future.complete("run over now!");

		System.out.println(future.get());
```

输出：
> run over now!

```java	CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "run over");

		try {
			TimeUnit.SECONDS.sleep(2);
		} catch (InterruptedException e) {
			e.printStackTrace();
		}
		future.obtrudeValue("reset run over");

		System.out.println(future.get());
```

输出：
> reset run over