---
title: Reactor编程（二）
date: 2021-12-18
categories:
- 异步编程
tags:
- 异步编程
- java
- reactor
---


Java 提供了两种异步编程模型：
- **回调**：异步方法没有返回值，但需要一个额外的 callback参数（一个 lambda 或匿名类），当结果可用时会被调用。
- **Futures**：异步方法立即返回一个Future<T>。异步过程计算一个T值，但Future对象包装了对它的访问。该值不会立即可用，并且可以轮询该对象直到该值可用。例如，一个ExecutorService正在运行的Callable<T>任务使用Future对象。

两种方式各有优劣，回调代码很难组合在一起，很快导致代码难以阅读和维护。Future比回调稍微好点，通过CompleteFuture，我们将多个Future对象编排 在一起。但Future也有一些缺点，它不支持惰性计算，没有背压能力，缺乏对多个值和高级错误处理的支持。

<!--more-->

## 1. CompleteFuture

在学习Reactor之前，我们先尝试使用CompleteFuture实现一段功能，稍后我们会使用Reactor就行重构，以此来体现Reactor代码编程的优美。 

我们根据用户订单获取到一个bookId的list，然后需要找出每个bookId对应的书名和作者。

```java
		Map<Integer, Book> books = new HashMap<>() {
			{
				put(1, new Book(1, "test1", "Jack"));
				put(2, new Book(2, "test2", "Tom"));
				put(3, new Book(3, "test3", "mary"));
				put(4, new Book(4, "test4", "Blue"));
			}
		};
		CompletableFuture<List<Integer>> ids = CompletableFuture.supplyAsync(() -> Arrays.asList(1, 2, 3, 4));
		ids.thenComposeAsync(idList -> {
			List<CompletableFuture<String>> nameAuthorPair = idList.stream().map(
					id -> {
						CompletableFuture<String> name = CompletableFuture.supplyAsync(() -> books.get(id).getName());
						CompletableFuture<String> author = CompletableFuture.supplyAsync(() -> books.get(id).getAuthor());
						return name.thenCombineAsync(author, (n, a) -> "Name is " + n + ",author is " + a);
					}
			).collect(Collectors.toList());
			return CompletableFuture.allOf(
					nameAuthorPair.toArray(new CompletableFuture[0]))
					.thenApply(v -> nameAuthorPair.stream().map(CompletableFuture::join).collect(Collectors.toList()));
		}).whenComplete((v, e) -> v.forEach(System.out::println));


		// wait for compute
		TimeUnit.SECONDS.sleep(3);
```

## 2. Reactor

反应式库，例如 Reactor，旨在解决 JVM 上“经典”异步方法的这些缺点，同时还关注一些其他方面：

- 可组合性和可读性
- 使用一系列丰富的运算符来流式处理数据
- 惰性计算，在subscribe之前，不会进行任何计算
- 背压能力，消费者向生产者发出生产速率过高的信号的能力
- 与并发无关的，具有高价值的高阶抽象

### 2.1 组合型和可读性

“可组合性”是指编排多个异步任务的能力，我们使用先前任务的结果作为后续任务的输入。或者，我们可以以 fork-join 方式运行多个任务。此外，我们可以在更高级别的系统中将异步任务重用为离散组件。

编排任务的能力与代码的可读性和可维护性紧密相关。随着异步进程层数和复杂性的增加，编写和读取代码变得越来越困难。正如我们所见，回调模型很简单，但它的主要缺点之一是，对于复杂的流程，您需要从回调中执行回调，回调本身嵌套在另一个回调中，依此类推。这种混乱被称为“回调地狱”。您可以猜到（或从经验中知道），这样的代码很难回溯和推理。

Reactor 提供了丰富的组合选项，其中代码反映了抽象过程的组织，并且所有内容通常都保持在同一级别（最小化嵌套）。

### 2.2 流失处理

您可以将反应式应用程序处理的数据想象成一个商品在一个流水线上处理。Reactor即是传送带又是工作站。原材料从一个来源（原始Publisher）倾倒并最终成为准备推向消费者（或Subscriber）的成品。

原材料可以经过各种转换和其他中间步骤，或者成为将中间件聚合在一起的更大装配线的一部分。如果某一点出现故障或堵塞（可能装箱产品花费的时间过长），受影响的工作站可以向上游发出信号以限制原材料的流动。

### 2.3 operator

在Reactor中，operator可以类比为流水线上的工作站。每个operator代表了Publisher的一种行为，用来将上一步的Publisher输出包装到一个新实例中。整个链条因此被链接起来，使得数据从第一个Publisher开始并沿着链条向下移动，由每个节点转换。最终，最后一个Subscriber完成了该过程。并且在 Subscriber订阅Publisher之前什么也不会发生。

Reactor等响应式库最有价值的一点就是它们提供的丰富的operate能力，涵盖从简单的转换和过滤到复杂的编排和错误处理等多方面。

### 2.4 惰性计算

在 Reactor 中，当您编写Publisher链时，默认情况下数据不会开始注入其中。因此，可以基于此创建异步流程的抽象描述（这有助于可重用性和组合）。

通过订阅行为，将绑定Publisher到Subscriber，这会触发整个链中的数据流。内部实现原理是，通过一个subscriber的一个request信号触发，并逐级传播到上游，以至于最终的源publisher

### 2.5 背压（Backpressure）

像上游传播的信号也可以用来实现背压，我们可以类比在生产流水线中，某个生产节点处理比上游的节点慢时，可以向上游反馈信号。

Reactive Streams规范定义的真正机制与类比非常接近。订阅者可以在无界模式下工作，让源以最快的速度推送所有数据，也可以通过request机制向源发送信号，表示他最多可以处理n个元素。整个流中，中间的operator还可以改变这个request，比如可以通过buffer将元素以10个一组进行分组。一些中间的节点还可以有自己的缓存机制，如果下游从上游拉元素，如果有缓存，则可以直接push，否则会向上游请求。

### 2.6 hot vs cold

Rx系列响应式库区主要分为两类响应序列：hot和cold。这种区别主要与响应流如何对订阅者做出响应有关：

- **cold**：一个冷序列对每个Subscriber提供从头开始的完整的元数据。例如，如果源包装了一个HTTP调用，那么每一个订阅都是一个新的HTTP请求。
- **hot**：一个热序列不对每个subscriber提供完整的数据。相反，迟到的订阅者会收到订阅后发出的消息。但是可能存在一些热响应流可以全部或部分缓存或重放消息历史。从一般的角度来看，当没有订阅者正在监听时，热序列甚至可以推出消息（这是“订阅前什么都不会发生”规则的一个例外）。

### 2.7 reactor-core

Reactor工程的主要artifact是`reactor-core`，一个Java 8下面，专注于响应式流lib。可以通过如下方式引入：

```xml
	<dependencies>
		<dependency>
			<groupId>io.projectreactor</groupId>
			<artifactId>reactor-core</artifactId>
		</dependency>
	</dependencies>
```

Reactor引入了可组合的反应类型，其实现Publisher接口，同时也提供了丰富的operator：Flux和Mono。一个Flux对象表示一个包含0..N个对象的序列，而一个Mono对象表示一个单值或空 (0..1) 结果。

这两种有类型本身携带了一些语义信息，可以对其自身代表的数据容量有个大致预估。比如一个HTTP请求只产生一个响应，所以做一个Flux操作没有多大意义。因此，将此类 HTTP 调用的结果表示为Mono<HttpResponse>比将其表示为Flux<HttpResponse>更有意义，因为它仅提供与零项或一项的上下文相关的operator。

有时候，流式处理过程中operator也会有切换。例如，count运算符存在于中Flux，但它返回一个 Mono<Long>。

#### 2.7.1 Flux, 0-N 项的异步序列

下图是Flux的一个典型工作流：

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1639834040985.png)

Flux<T>是一个标准Publisher<T>，表示 0 到 N 个异步消息序列，可以由完成信号或错误信号终止。如图所示，有三种信号可以分别触发下游订阅者的onNext，onComplete和onError方法。

重要的是所有事件，包括终止事件，都是可选的。没有onNext事件，但是有onComplete事件代表一个空的有限序列。但是移除onComplete，代表一个无限的空序列（不是特别有用，除了围绕取消的测试）。同样，无限序列也不一定是空的。例如，Flux.interval(Duration) 产生一个时钟触发的规律的无限序列Flux<Long>

#### 2.7.2 Mono, 0-1异步结果

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1639834718028.png)

Mono<T>是一种特殊的Publisher<T>，它通过onNext信号产生最多一个事件，随着一个onComplete信号（成功Mono，有或没有值）而终止，或者只发出一个onError信号（失败Mono）。

大多数Mono实现预计会在调用onNext成功后立即调用onComplete。Mono.never()是一个异常值：它不发出任何信号，这在技术上并没有被禁止，尽管其在测试之外并不是非常有用。另一方面，onNext和onError的组合是明确禁止的。

Mono仅提供Flux可用的operator的子集，并且一些operator会转换结果为Flux。比如, Mono#concatWith(Publisher)返回一个Flux，而Mono#then(Mono) 返回另一个Mono。

我们可以使用Mono来表示只有完成概念的无值异步进程（类似于 a Runnable），可以使用一个空的 Mono<Void>实现。

#### 2.7.3 工厂方法

最简单的创建Flux或Mono的是使用一系列工厂方法。

```java
		Mono<String> empty = Mono.empty();
		Mono<String> name = Mono.just("jack");
		Mono<String> monoResult = Mono.fromFuture(CompletableFuture.supplyAsync(() -> "result"));
		Mono<Void> monoFromRunnable = Mono.fromRunnable(() -> System.out.println("do nothing"));
		Mono<String> monoFromOtherMono = Mono.from(monoResult);
		
		Flux<Integer> nums = Flux.range(0, 10);
		Flux<String> colors = Flux.just("blue", "red", "yellow");
		Flux<String> colorFromArray = Flux.fromArray(new String[]{"blue", "red", "yellow"});
		Flux<String> colorFromList = Flux.fromIterable(Arrays.asList("blue", "red", "yellow"));
		Flux<String> colorFromStream = Flux.fromStream(Stream.of("blue", "red", "yellow"));
		Flux<String> colorFromOtherFlux = Flux.from(colors);
```

#### 2.7.4 subscribe

Flux和Mono使用java8的lambda表达式来提供订阅的能力，这些方法使用不同形式组合的回调函数作为参数。这些方法的返回值都是Disposable类型，可以用来取消订阅以及停止source的数据产生和清理已经创建的数据。

```java
// 订阅并触发流
Disposable subscribe(); 
// 订阅并处理流中的每一个数据
Disposable subscribe(Consumer<? super T> consumer); 
// 订阅并处理六中每一个数据，同时也有处理异常的能力
Disposable subscribe(Consumer<? super T> consumer, Consumer<? super Throwable> errorConsumer); 
// 订阅并处理六中每一个数据，也有处理异常的能力，也可以在流完成的时候运行一些代码
Disposable  subscribe(Consumer<? super T> consumer,  Consumer<? super Throwable> errorConsumer,  Runnable completeConsumer); 
```

示例：

```java
		Flux<Integer> ints = Flux.range(1, 4)
				.map(i -> {
					if (i <= 3) return i;
					throw new RuntimeException("Got to 4");
				});
		ints.subscribe(System.out::println,
				error -> System.err.println("Error: " + error));
```

输出：
> 1
2
3
Error: java.lang.RuntimeException: Got to 4

示例：

```java
		Flux<Integer> ints = Flux.range(1, 4);
		ints.subscribe(System.out::println, error -> System.err.println("Error: " + error),
				() -> System.out.println("Done"));
```

输出：
> 1
2
3
4
Done

```java
		Flux<Integer> ints = Flux.range(1, 4);
		ints.subscribeWith(new BaseSubscriber<Integer>() {

					private Subscription subscription;

					@Override
					protected void hookOnSubscribe(Subscription subscription) {
						this.subscription = subscription;
						subscription.request(1);
					}

					// you can control backpressure here
					@Override
					protected void hookOnNext(Integer value) {
						System.out.println(value);
						subscription.request(1);
					}

					@Override
					protected void hookOnComplete() {
						System.out.println("Done");
					}
				});
	}
```

输出：
> 1
2
3
4
Done

#### 2.7.5 Disposable

通过调用Disposable的 dispose()方法我们可以取消订阅。对于Flux或者Mono，取消信号意味者源应该停止生产数据，但是这种行为并不保证立即生效。有些源数据可能数据产生的非常快，以至于在收到取消信号之前已经完成数据生产。

示例：

```java
		Flux<Integer> ints = Flux.range(1, 4);
		Disposable disposable = ints.subscribeWith(new BaseSubscriber<Integer>() {

					private Subscription subscription;

					@Override
					protected void hookOnSubscribe(Subscription subscription) {
						this.subscription = subscription;
						subscription.request(1);
					}

					// you can control backpressure here
					@Override
					protected void hookOnNext(Integer value) {
						System.out.println(value);
						try {
							TimeUnit.MICROSECONDS.sleep(100);
						} catch (InterruptedException e) {
							e.printStackTrace();
						}
						subscription.request(1);
					}

					@Override
					protected void hookOnComplete() {
						System.out.println("Done");
					}
				});
		TimeUnit.MICROSECONDS.sleep(200);
		disposable.dispose();
```

输出：
> 1
2
3
4
Done

示例：

```java
		Flux<Long> ints = Flux.interval(Duration.of(100, ChronoUnit.MILLIS));
		Disposable disposable = ints.subscribeWith(new BaseSubscriber<Long>() {

					private Subscription subscription;

					@Override
					protected void hookOnSubscribe(Subscription subscription) {
						this.subscription = subscription;
						subscription.request(1);
					}

					// you can control backpressure here
					@Override
					protected void hookOnNext(Long value) {
						System.out.println(value);
						subscription.request(1);
					}

					@Override
					protected void hookOnComplete() {
						System.out.println("Done");
					}
				});
		TimeUnit.MILLISECONDS.sleep(300);
		disposable.dispose();
		TimeUnit.SECONDS.sleep(10);
```

输出：
> 0
> 1

#### 2.7.6 自定义序列器

##### 2.7.6.1 同步生成

在有些情况下，序列的生成可能是有状态的，需要用到某些状态对象。此时可以使用`generate(Callable<S> stateSupplier, BiFunction<S,SynchronousSink<T>,S> generator)`，其中 stateSupplier 用来提供初始的状态对象。在进行序列生成时，状态对象会作为 generator 使用的第一个参数传入，可以在对应的逻辑中对该状态对象进行修改以供下一次生成时使用。

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1639899001379.png)

```java
		Flux<String> flux = Flux.generate(
				// 初始状态
				() -> 0,
				// 生产序列元素，返回下一个状态
				(state, sink) -> {
					sink.next("3 x " + state + " = " + 3 * state);
					if (state == 10) sink.complete();
					return state + 1;
				});
		flux.subscribe(System.out::println);
```
输出：
> 3 x 0 = 0
3 x 1 = 3
3 x 2 = 6
3 x 3 = 9
3 x 4 = 12
3 x 5 = 15
3 x 6 = 18
3 x 7 = 21
3 x 8 = 24
3 x 9 = 27
3 x 10 = 30

##### 2.7.6.2 异步多线程生成

create()方法与 generate()方法的不同之处在于所使用的是FluxSink对象。FluxSink声明了next, error和complete方法。支持同步和异步的消息产生，并且可以在一次调用中产生多个元素。create另一特性就是很容易把其他的接口与响应式桥接起来。注意，它是异步多线程并不意味着create可以并行化你写的代码或者异步执行，create方法里面的Lambda表达式代码还是单线程阻塞的。如果你在创建序列的地方阻塞了代码，那么可能造成订阅者即使请求了数据，也得不到，因为序列被阻塞了，没法生成新的。

```java
	interface MyEventListener<T> {
		void onDataChunk(List<T> chunk);
		void processComplete();
	}

	interface MyEventProcessor<T> {
		void register(MyEventListener<String> stringTestListener);
		MyEventListener<T> get();
	}

	public static void main(String[] args) throws InterruptedException {
		MyEventProcessor<String> myEventProcessor = new MyEventProcessor<>() {

			private MyEventListener<String> myEventListener;

			@Override
			public void register(MyEventListener<String> stringTestListener) {
				this.myEventListener = stringTestListener;
			}

			@Override
			public MyEventListener<String> get() {
				return this.myEventListener;
			}
		};

		Flux<String> bridge = Flux.create(sink -> {
			myEventProcessor.register(
					new MyEventListener<>() {
						public void onDataChunk(List<String> chunk) {
							for(String s : chunk) {
								sink.next(s);
							}
						}
						public void processComplete() {
							sink.complete();
						}
					});
		});

		bridge.subscribe(System.out::println);

		new Thread(() -> {
			List<String> list = new ArrayList<>(10);
			for (int i = 0; i < 10; ++ i) {
				list.add(i+"-run1");
			}
			myEventProcessor.get().onDataChunk(list);
		}).start();
		new Thread(() -> {
			List<String> list = new ArrayList<>(10);
			for (int i = 0; i < 10; ++ i) {
				list.add(i+"-run2");
			}
			myEventProcessor.get().onDataChunk(list);
		}).start();
		new Thread(() -> {
			List<String> list = new ArrayList<>(10);
			for (int i = 0; i < 10; ++ i) {
				list.add(i+"-run3");
			}
			myEventProcessor.get().onDataChunk(list);
		}).start();

		Thread.sleep(1000);
		myEventProcessor.get().processComplete();
	}
```

输出：
```java
0-run1
0-run2
0-run3
1-run2
1-run3
2-run2
2-run3
3-run2
3-run3
4-run2
4-run3
5-run2
5-run3
6-run2
6-run3
7-run2
7-run3
8-run2
8-run3
9-run2
9-run3
1-run1
2-run1
3-run1
4-run1
5-run1
6-run1
7-run1
8-run1
9-run1
```

上述代码通过多个线程持有MyEventListener对象，并发地执行onDataTrunk方法，通过sink.next()产生消息。

##### 2.7.6.3 异步单线程生成

reate允许多线程环境下调用.next()方法，只管生成元素，元素的顺序不可控。但是push只允许一个线程生产元素，所以是有序的，至于异步指的是在新的线程中也可以，而不必非得在当前线程。顺带一提，push和create都支持onCancel()和onDispose()操作。一般来说，onCancel只响应于cancel操作，而onDispose响应于error，cancel，complete等操作。

```java
	interface MyEventListener<T> {
		void onDataChunk(List<T> chunk);
		void processComplete();
	}

	interface MyEventProcessor<T> {
		void register(MyEventListener<String> stringTestListener);
		MyEventListener<T> get();
	}

	public static void main(String[] args) throws InterruptedException {
		MyEventProcessor<String> myEventProcessor = new MyEventProcessor<>() {

			private MyEventListener<String> myEventListener;

			@Override
			public void register(MyEventListener<String> stringTestListener) {
				this.myEventListener = stringTestListener;
			}

			@Override
			public MyEventListener<String> get() {
				return this.myEventListener;
			}
		};

		Flux<String> bridge = Flux.push(sink -> {
			myEventProcessor.register(
					new MyEventListener<>() {
						public void onDataChunk(List<String> chunk) {
							for(String s : chunk) {
								sink.next(s);
							}
						}
						public void processComplete() {
							sink.complete();
						}
					});
		});

		bridge.subscribe(System.out::println);

		new Thread(() -> {
			List<String> list = new ArrayList<>(10);
			for (int i = 0; i < 10; ++ i) {
				list.add(i+"-run1");
			}
			myEventProcessor.get().onDataChunk(list);
		}).start();

		Thread.sleep(10000);
		myEventProcessor.get().processComplete();
	}
```

输出：
> 0-run1
1-run1
2-run1
3-run1
4-run1
5-run1
6-run1
7-run1
8-run1
9-run1

#### 2.7.7 filter和map

filter和map方法是实例方法，一般链接在一个已经存在的源上。

```java
Flux.range(0, 10).filter(i -> i > 3).map(i -> "value is " + i).subscribe(System.out::println);
```

输出：
> value is 4
value is 5
value is 6
value is 7
value is 8
value is 9

#### 2.7.8 handle

handle方法是一个实例方法，一般链接在一个已经存在的源上。handle和generate类似，只能同步地诸葛处理。

```java
		Flux.range(0, 10).handle((v, sink) -> {
			if (v > 3) {
				sink.next("value is " + v);
			}
		}).subscribe(System.out::println);
```

输出：
> value is 4
value is 5
value is 6
value is 7
value is 8
value is 9

#### 2.7.9 Threading and Schedulers

一般来说，响应式框架并不一定是并发的(create那个是生产者并发，它本身不是并发的)，依赖开发者自己通过一些lib库来实现并发。Flux或Mono并不意味着其运行在一个新的线程，大多数运算都在其上一个线程执行的线程里执行。除非特别指定，最顶层（源）运算运行在subscribe()被调用的线程里。

```java
		Thread test = new Thread(() -> {
			Flux.range(0, 10).filter(v -> {
				System.out.println("filter thread is " + Thread.currentThread().getName());
				return v > 3;
			}).map(v -> {
				System.out.println("map thread is " + Thread.currentThread().getName());
				return "value is " + v;
			}).subscribe(v -> {
				System.out.println("subscribe thread is " + Thread.currentThread().getName());
				System.out.println(v);
			});
		});
		test.setName("Test-thread");
		test.start();
		test.join();
```

输出：
> filter thread is Test-thread
filter thread is Test-thread
filter thread is Test-thread
filter thread is Test-thread
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 4
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 5
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 6
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 7
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 8
filter thread is Test-thread
map thread is Test-thread
subscribe thread is Test-thread
value is 9

在Reactor里，Scheduler决定了操作在哪个线程被怎么执行，它的作用类似于ExecutorService。不过功能稍微多点。如果你想实现一些并发操作，那么可以考虑使用Schedulers提供的静态方法。

- `Schedulers.immediate()`：在当前线程运行
- `Schedulers.single()`：可重用的单线程。所有调用Schedulers.single()的方法都使用同样一个线程。如果每次想要不一样的线程，可以使用`Schedulers.newSingle()`
- `Schedulers.elastic()`：一个弹性无界线程池。有时候太多的线程对于计算机计算来说反而是中负担。
- `Schedulers.bounededElastic()`：有界可复用的线程池。可以在需要的时候创建工作线程池，并复用空闲的池。同时，某些池如果空闲时间超过一个限定的数值就会被抛弃。同时，它还有一个容量限制，一般10倍于CPU核心数，这是它后备线程池的最大容量。当线程不够用时，允许最多提交10万条任务，进入等待队列，等到有可用时再调度，如果是延时调度，那么延时开始时间是在有线程可用时才开始计算。由此可见Schedulers.boundedElastic()对于阻塞的I/O操作是一个不错的选择，因为它可以让每一个操作都有自己的线程。但是记得，太多的线程会让系统备受压力。
- `Schedulers.parallel()`：固定大小的线程池，会创建数量等于CPU核心数的线程来实现这一功能。
- `Schedulers.fromExecutorService(ExecutorService)`：除了使用已经存在的schedulers，还可以基于executorService产生自定义的Scheduler。

当然，我们也可以通过调用newXXX之类的方法来创建自己的Scheduler。比如`Schedulers.newParallel("My scheduler Name")`来创建一个新的并行调度器。boudedElastic被用来处理无法避免阻塞的代码，而single和parallel不被允许，在single和parallel线程中调用阻塞 API（block(), blockFirst(), blockLast()（以及迭代toIterable() 或toStream()）会导致抛出IllegalStateException异常。自定义Schedulers也可以通过创建实现了NonBlocking接口的线程来禁止阻塞调用。

一些运算其实默认使用了一些Scheduler。比如，`Flux.interval(Duration.ofMillis(300))`创建了一个每300ms触发一次的Flux<Long>，默认使用了Schedulers.parallel()。

```java
		Flux.interval(Duration.ofMillis(300)).take(1).subscribe(v -> System.out.println("Thread is " + Thread.currentThread().getName()));
		TimeUnit.SECONDS.sleep(1);
```

输出：
> Thread is parallel-1

#### 2.7.10 publishOn和subscribeOn

Reactor提供了两种切换执行上下文的方法，`publishOn`和`subscribeOn`。这两个方法接收一个scheduler，用于让后续流操作的执行上下文切换到此scheduler。`publishOn`在流式链中被调用，而`subscribeOn`则不是这么用的。

##### 2.7.10.1 publishOn

```java
		Thread test = new Thread(() -> {
			Flux.range(4, 1).filter(v -> {   // 工作在Teat-Thread线程
				System.out.println("filter thread is " + Thread.currentThread().getName());
				return v > 3;
			}).publishOn(Schedulers.single()).map(v -> {    // 切换后续执行线程到single线程
				System.out.println("map thread is " + Thread.currentThread().getName());
				return "value is " + v;
			}).subscribe(v -> {
				System.out.println("subscribe thread is " + Thread.currentThread().getName());
				System.out.println(v);
			});
		});
		test.setName("Test-thread");
		test.start();
		TimeUnit.SECONDS.sleep(1);
```

输出：
> filter thread is Test-thread
map thread is single-1
subscribe thread is single-1
value is 4

```java
		Thread test = new Thread(() -> {
			Flux.range(4, 1).filter(v -> {   // 运行在Test-Thread线程
				System.out.println("filter thread is " + Thread.currentThread().getName());
				return v > 3;
			}).publishOn(Schedulers.single()).map(v -> {  // 后续线程运行在single线程
				System.out.println("map thread is " + Thread.currentThread().getName());
				return "value is " + v;
			}).publishOn(Schedulers.newSingle("My Single Thread")).subscribe(v -> {   // 后续线程运行在My Single Thread线程
				System.out.println("subscribe thread is " + Thread.currentThread().getName());
				System.out.println(v);
			});
		});
		test.setName("Test-thread");
		test.start();
		TimeUnit.SECONDS.sleep(1);
```

输出：
> filter thread is Test-thread
map thread is single-2
subscribe thread is My Single Thread-1
value is 4

#####  2.7.10.2 subscribeOn

subscribeOn工作在subscription过程，也就是整个流式链创建的地方。因此，不管你把subscribeOn放在链中的哪个位置，它总是影响数据源的上下文，并且不影响后续使用publishOn来执行上下文切换。

```java
		Thread test = new Thread(() -> {
			Flux.range(4, 1).filter(v -> {   // 继承自源序列的线程
				System.out.println("filter thread is " + Thread.currentThread().getName());
				return v > 3;
			}).subscribeOn(Schedulers.parallel()) // 源序列产生于parallel线程
					.publishOn(Schedulers.single()).map(v -> {  // 切换到single线程
				System.out.println("map thread is " + Thread.currentThread().getName());
				return "value is " + v;
			}).publishOn(Schedulers.parallel()).subscribe(v -> {   // 切换到parallel线程
				System.out.println("subscribe thread is " + Thread.currentThread().getName());
				System.out.println(v);
			});
		});
		test.setName("Test-thread");
		test.start();
		TimeUnit.SECONDS.sleep(1);
```

输出：
> filter thread is parallel-2
map thread is single-1
subscribe thread is parallel-1
value is 4

## 3. Reactor重构

还记得开头我们用completeFuture写的例子吗？现在是时候重构他了。

```java
		Map<Integer, Book> books = new HashMap<>() {
			{
				put(1, new Book(1, "test1", "Jack"));
				put(2, new Book(2, "test2", "Tom"));
				put(3, new Book(3, "test3", "mary"));
				put(4, new Book(4, "test4", "Blue"));
			}
		};

		Flux.just(1, 2, 3, 4)
				.publishOn(Schedulers.boundedElastic()).map(id -> {
			Mono<String> name = Mono.just(id).publishOn(Schedulers.boundedElastic()).map(i -> books.get(i).getName());
			Mono<String> author = Mono.just(id).publishOn(Schedulers.boundedElastic()).map(i -> books.get(i).getAuthor());
			return name.zipWith(author, (n, a) -> "Name is " + n + ",author is " + a);
		})
				.publishOn(Schedulers.boundedElastic()).subscribe(zip -> zip.subscribe(System.out::println));
		TimeUnit.SECONDS.sleep(3);
```

map返回的是一个Flux<String>对象，如果对于流中的每一个数据，我们处理map的期望的结果是从String->String，这点我们可以使用flatMap实现

```java
		Map<Integer, Book> books = new HashMap<>() {
			{
				put(1, new Book(1, "test1", "Jack"));
				put(2, new Book(2, "test2", "Tom"));
				put(3, new Book(3, "test3", "mary"));
				put(4, new Book(4, "test4", "Blue"));
			}
		};

		Flux.just(1, 2, 3, 4)
				.publishOn(Schedulers.boundedElastic()).flatMap(id -> {
			Mono<String> name = Mono.just(id).publishOn(Schedulers.boundedElastic()).map(i -> books.get(i).getName());
			Mono<String> author = Mono.just(id).publishOn(Schedulers.boundedElastic()).map(i -> books.get(i).getAuthor());
			return name.zipWith(author, (n, a) -> "Name is " + n + ",author is " + a);
		})
				.publishOn(Schedulers.boundedElastic()).subscribe(System.out::println);
		TimeUnit.SECONDS.sleep(3);
```

输出：
> Name is test1,author is Jack
Name is test2,author is Tom
Name is test4,author is Blue
Name is test3,author is mary

## 4. 参考链接

1. https://projectreactor.io/docs/core/release/reference/#error.handling
2. https://skyao.io/learning-reactor/docs/concept/flux/create.html
2. https://zhuanlan.zhihu.com/p/283903217