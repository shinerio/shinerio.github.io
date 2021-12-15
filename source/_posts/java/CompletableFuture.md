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

## 计算完成时处理

当completableFuture计算结果完成，或者抛出异常的时候，可以通过如下方法指定特定的Action。action参数的类型为`(BiConsumer<? super T,? super Throwable> `，代表可以处理正常的计算结果，也可以处理异常情况。when开头的方法当action执行完成后，会返回原始的CompletableFuture计算结果或异常，而exceptionally则返回一个新的CompletableFuture对象。exceptionally用来处理当原始CompletableFuture抛出异常的时候，触发计算，否则以原始CompletableFuture作为返回结果。方法不以Async结尾，意味着Action使用相同的线程执行，而Async可能会使用其它的线程去执行(如果使用相同的线程池，也可能会被同一个线程选中执行）

```java
public CompletableFuture<T> 	whenComplete(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> 	whenCompleteAsync(BiConsumer<? super T,? super Throwable> action)
public CompletableFuture<T> 	whenCompleteAsync(BiConsumer<? super T,? super Throwable> action, Executor executor)
public CompletableFuture<T>     exceptionally(Function<Throwable, ? extends T> fn)
```

下面一组方法虽然也返回CompletableFuture对象，但是对象的值和原来的CompletableFuture计算的值不同。当原先的CompletableFuture的值计算完成或者抛出异常的时候，会触发这个CompletableFuture对象的计算，结果由BiFunction参数计算而得。因此这组方法兼有whenComplete和转换的两个功能。

```java
public <U> CompletableFuture<U> 	handle(BiFunction<? super T,Throwable,? extends U> fn)
public <U> CompletableFuture<U> 	handleAsync(BiFunction<? super T,Throwable,? extends U> fn)
public <U> CompletableFuture<U> 	handleAsync(BiFunction<? super T,Throwable,? extends U> fn, Executor executor)
```

示例：

```java
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).whenComplete((v, e) -> System.out.println(v));
        TimeUnit.SECONDS.sleep(2);
```

输出：
> run over

```java
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                int a = 1/0;
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).whenComplete((v, e) -> System.out.println(e)).exceptionally(Throwable::toString);
        System.out.println(future.get());
```

输出：
> java.util.concurrent.CompletionException: java.lang.ArithmeticException: / by zero
java.util.concurrent.CompletionException: java.lang.ArithmeticException: / by zero

## 转换

通过回调机制，我们不必因为等待一个计算完成而阻塞着调用线程，而是告诉CompletableFuture当计算完成的时候请执行某个function。而且我们还可以将这些操作串联起来，或者将CompletableFuture组合起来。

```java
public <U> CompletableFuture<U> 	thenApply(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> 	thenApplyAsync(Function<? super T,? extends U> fn)
public <U> CompletableFuture<U> 	thenApplyAsync(Function<? super T,? extends U> fn, Executor executor)
```

这一组函数的作用在于当原始CompletableFuture计算完成后，可以将结果传递给回调函数fn，将fn的结果作为新的CompletableFuture结果计算。将`CompletableFuture<T>`转换成`CompletableFuture<U>`。这里的转换不是阻塞式的，而是等去前一个stage完成后，回调执行的。这些方法和handle方法的区别在于，这些方案只会计算正常值，有异常就会抛出，而handle方法可以处理异常，避免异常继续抛出。

示例：

```java
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).thenApply(ret -> ret + "\nrun over").whenComplete((v, e) -> System.out.println(v));
        TimeUnit.SECONDS.sleep(2);
```

输出：
> run over
run over

## 消费

上面的方法是当计算完成的时候，会生成新的计算结果(thenApply, handle)，或者返回同样的计算结果whenComplete，CompletableFuture还提供了一种处理结果的方法，只对结果执行Action，而不返回新的计算值，因此计算值为Void。

```java
public CompletableFuture<Void> 	thenAccept(Consumer<? super T> action)
public CompletableFuture<Void> 	thenAcceptAsync(Consumer<? super T> action)
public CompletableFuture<Void> 	thenAcceptAsync(Consumer<? super T> action, Executor executor)
```

示例：

```java
        CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).thenAccept(System.out::println);
        TimeUnit.SECONDS.sleep(2);
```

输出：
> run over

thenAcceptBoth以及相关方法提供了类似的功能，当原始completableFuture和传入的other completableFuture都正常完成计算的时候，就会执行提供的action。

```java
public <U> CompletableFuture<Void> 	thenAcceptBoth(CompletionStage<? extends U> other, BiConsumer<? super T,? super U> action)
public <U> CompletableFuture<Void> 	thenAcceptBothAsync(CompletionStage<? extends U> other, BiConsumer<? super T,? super U> action)
public <U> CompletableFuture<Void> 	thenAcceptBothAsync(CompletionStage<? extends U> other, BiConsumer<? super T,? super U> action, Executor executor)
```

示例：

```java
        CompletableFuture<String> other = CompletableFuture.supplyAsync(() -> "other run over");
        CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).thenAcceptBoth(other, (v1, v2) -> System.out.println(v1 + "\n" + v2));
        TimeUnit.SECONDS.sleep(2);
```

输出：

> run over
other run over

thenRun是当原始completableFuture计算完成是，就会执行另一个runnable；runAfterBoth是当两个CompletionStage都正常完成计算的时候，执行一个Runnable。这个Runnable并不使用计算的结果。

```java
public CompletableFuture<Void> 	thenRun(Runnable action)
public CompletableFuture<Void> 	thenRunAsync(Runnable action)
public CompletableFuture<Void> 	thenRunAsync(Runnable action, Executor executor)
public CompletableFuture<Void> 	runAfterBoth(CompletionStage<?> other,  Runnable action)
```

示例：

```java
        CompletableFuture<String> other = CompletableFuture.supplyAsync(() -> "other run over");
        CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1);
                return "run over";
            } catch (InterruptedException e) {
                e.printStackTrace();
                return "exception";
            }
        }).thenRun(() -> System.out.println("no input, do nothing"));
        TimeUnit.SECONDS.sleep(2);
```

输出：
> no input, do nothing

## 组合

compose系列方法接收一个Function作为参数，这个Function的输入是当前CompletableFuture的计算值，返回结果是一个新的CompletableFuture，这个新的CompletableFuture会组合原来的CompletableFuture和函数返回的CompletableFuture。

```java
public <U> CompletableFuture<U> 	thenCompose(Function<? super T,? extends CompletionStage<U>> fn)
public <U> CompletableFuture<U> 	thenComposeAsync(Function<? super T,? extends CompletionStage<U>> fn)
public <U> CompletableFuture<U> 	thenComposeAsync(Function<? super T,? extends CompletionStage<U>> fn, Executor executor)
```

compose和apply的区别在于，compose中提供的Function返回是CompletionStage，而apply中的Function返回的是一个普通对象。

```java
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "run over");
        CompletableFuture<String> other = CompletableFuture.supplyAsync(() -> "other run over");
        CompletableFuture<String> compose = future.thenCompose((v) -> other);
        CompletableFuture<CompletableFuture<String>> apply = future.thenApply(v -> other);
```

combine方法用来组合两个stage，将两个stage的输出作为后续异步流的输入，combine和acceptBoth方法的区别在于，acceptBoth没有返回值，combine有返回值。

```java
public <U,V> CompletableFuture<V> 	thenCombine(CompletionStage<? extends U> other, BiFunction<? super T,? super U,? extends V> fn)
public <U,V> CompletableFuture<V> 	thenCombineAsync(CompletionStage<? extends U> other, BiFunction<? super T,? super U,? extends V> fn)
public <U,V> CompletableFuture<V> 	thenCombineAsync(CompletionStage<? extends U> other, BiFunction<? super T,? super U,? extends V> fn, Executor executor)
```

示例：
```java
        CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> 10);
        CompletableFuture<Integer> other = CompletableFuture.supplyAsync(() -> 20);
        future.thenCombine(other, (v1, v2) -> v1 * v2).whenComplete((v, e) -> System.out.println(v));
```

输出：
> 200

## Either

thenAcceptBoth和runAfterBoth是当两个CompletableFuture都计算完成，either实现是当任意一个CompletableFuture计算完成的时候就会执行。

```java
public CompletableFuture<Void> 	acceptEither(CompletionStage<? extends T> other, Consumer<? super T> action)
public CompletableFuture<Void> 	acceptEitherAsync(CompletionStage<? extends T> other, Consumer<? super T> action)
public CompletableFuture<Void> 	acceptEitherAsync(CompletionStage<? extends T> other, Consumer<? super T> action, Executor executor)
public <U> CompletableFuture<U> 	applyToEither(CompletionStage<? extends T> other, Function<? super T,U> fn)
public <U> CompletableFuture<U> 	applyToEitherAsync(CompletionStage<? extends T> other, Function<? super T,U> fn)
public <U> CompletableFuture<U> 	applyToEitherAsync(CompletionStage<? extends T> other, Function<? super T,U> fn, Executor executor)
```

示例：

```java
        Random random = new Random();
        CompletableFuture<Integer> future = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1 + random.nextInt(3));
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 10;});
        CompletableFuture<Integer> other = CompletableFuture.supplyAsync(() -> {
            try {
                TimeUnit.SECONDS.sleep(1 + random.nextInt(3) );
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return 20;});
        future.acceptEither(other, System.out::println);
        TimeUnit.SECONDS.sleep(4);
```

以上代码有时候输出10，有时候输出20

## allOf和anyOf

```java
public static CompletableFuture<Void>  allOf(CompletableFuture<?>... cfs)
public static CompletableFuture<Object> anyOf(CompletableFuture<?>... cfs)
```
allOf方法是当所有的CompletableFuture都执行完后执行计算。anyOf方法是当任意一个CompletableFuture执行完后就会执行计算，计算的结果相同。anyOf的返回值是其中一个CompletableFuture的计算结果，而applyToEither返回值的计算结果要结果Function处理。

## 参考资料

https://colobu.com/2016/02/29/Java-CompletableFuture/