---
title: Reactor编程（一）
date: 2021-12-18
categories:
- 异步编程
tags:
- 异步编程
- java
- reactor
---

Reactor是响应式编程的一种实现方式。响应式编程关心数据流以及数据变化的传播，是一种异步编程的一种范式。这意味着通过编程语言实现的响应式编程可以轻松地表达静态（例如arrays）或动态（例如event emitters）数据。

<!--more-->

## 1. Flow

响应式编程最初由Microsoft创建，其在.NET生态中创造了响应式扩展库（Rx）。RxJava和Akka流是JAVA生态下反应是编程的流行实现。随着时间的推移，通过 Reactive Streams 的努力出现了 Java 的标准化，该规范为 JVM 上的反应库定义了一组接口和交互规则。 它的接口已集成到 Java 9的java.util.concurrent.Flow类下。

反应流是关于流的异步处理，其实是观察者模式的一种实现，所以应该有一个发布者和一个订阅者，发布者发布数据流，订阅者使用数据。

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1639806474119.png)

以上是一个最简单的流式模型，实际上流中的每一个节点即可以是Subscriber，消费上一个流结果，也可以是Publisher，为下一个流提供数据来源。

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1639806573224.png)

###1.1  java.util.concurrent.Flow

Flow是流API的主要类,这个类封装了流API的所有重要接口。
- `java.util.concurrent.Flow.Publisher`，这是一个功能接口，每个发布者都必须实现其subscribe方法，以便能够添加对应的subscriber
- `java.util.concurrent.Flow.Subscriber`，每个订阅者都必须实现此接口。包括四个方法：
	- onSubscribe：当订阅者像发布者发起订阅时触发，这是发布者给订阅者的第一条消息。
    - onNext：当从publisher每接收到一个消息时，就会调用这个方法，用来实现业务逻辑来处理流。
	- onError：当发生不可恢复的错误时调用此方法，我们可以在此方法中处理异常及执行清理资源，例如关闭数据库连接。
    - onComplete：当publisher没有生成其他项并且publisher关闭时调用它。我们可以用它来发送流处理成功的通知、
- `java.util.concurrent.Flow.Subscription`，用于控制发布者和订阅者之间的链接。订阅者只有在requested的时候可以收到消息，并且可以在任何时候调用cancel方法取消。订阅者可以通过调用`request(long n)`方法来实现订阅之多n个消息。
- `java.util.concurrent.Flow.Processor`，此接口扩展发布服务器和订阅服务器，用于在发布服务器和订阅服务器之间转换消息。
```java
public final class Flow {

    private Flow() {} // 不可实例化

    /**
	  
     * A producer of items (and related control messages) received by
     * Subscribers.  Each current {@link Subscriber} receives the same
     * items (via method {@code onNext}) in the same order, unless
     * drops or errors are encountered. If a Publisher encounters an
     * error that does not allow items to be issued to a Subscriber,
     * that Subscriber receives {@code onError}, and then receives no
     * further messages.  Otherwise, when it is known that no further
     * messages will be issued to it, a subscriber receives {@code
     * onComplete}.  Publishers ensure that Subscriber method
     * invocations for each subscription are strictly ordered in <a
     * href="package-summary.html#MemoryVisibility"><i>happens-before</i></a>
     * order.
     *
     * <p>Publishers may vary in policy about whether drops (failures
     * to issue an item because of resource limitations) are treated
     * as unrecoverable errors.  Publishers may also vary about
     * whether Subscribers receive items that were produced or
     * available before they subscribed.
     *
     * @param <T> the published item type
     */
    @FunctionalInterface
    public static interface Publisher<T> {
        /**
         * Adds the given Subscriber if possible.  If already
         * subscribed, or the attempt to subscribe fails due to policy
         * violations or errors, the Subscriber's {@code onError}
         * method is invoked with an {@link IllegalStateException}.
         * Otherwise, the Subscriber's {@code onSubscribe} method is
         * invoked with a new {@link Subscription}.  Subscribers may
         * enable receiving items by invoking the {@code request}
         * method of this Subscription, and may unsubscribe by
         * invoking its {@code cancel} method.
         *
         * @param subscriber the subscriber
         * @throws NullPointerException if subscriber is null
         */
        public void subscribe(Subscriber<? super T> subscriber);
    }

    /**
     * A receiver of messages.  The methods in this interface are
     * invoked in strict sequential order for each {@link
     * Subscription}.
     *
     * @param <T> the subscribed item type
     */
    public static interface Subscriber<T> {
        /**
         * Method invoked prior to invoking any other Subscriber
         * methods for the given Subscription. If this method throws
         * an exception, resulting behavior is not guaranteed, but may
         * cause the Subscription not to be established or to be cancelled.
         *
         * <p>Typically, implementations of this method invoke {@code
         * subscription.request} to enable receiving items.
         *
         * @param subscription a new subscription
         */
        public void onSubscribe(Subscription subscription);

        /**
         * Method invoked with a Subscription's next item.  If this
         * method throws an exception, resulting behavior is not
         * guaranteed, but may cause the Subscription to be cancelled.
         *
         * @param item the item
         */
        public void onNext(T item);

        /**
         * Method invoked upon an unrecoverable error encountered by a
         * Publisher or Subscription, after which no other Subscriber
         * methods are invoked by the Subscription.  If this method
         * itself throws an exception, resulting behavior is
         * undefined.
         *
         * @param throwable the exception
         */
        public void onError(Throwable throwable);

        /**
         * Method invoked when it is known that no additional
         * Subscriber method invocations will occur for a Subscription
         * that is not already terminated by error, after which no
         * other Subscriber methods are invoked by the Subscription.
         * If this method throws an exception, resulting behavior is
         * undefined.
         */
        public void onComplete();
    }

    /**
     * Message control linking a {@link Publisher} and {@link
     * Subscriber}.  Subscribers receive items only when requested,
     * and may cancel at any time. The methods in this interface are
     * intended to be invoked only by their Subscribers; usages in
     * other contexts have undefined effects.
     */
    public static interface Subscription {
        /**
         * Adds the given number {@code n} of items to the current
         * unfulfilled demand for this subscription.  If {@code n} is
         * less than or equal to zero, the Subscriber will receive an
         * {@code onError} signal with an {@link
         * IllegalArgumentException} argument.  Otherwise, the
         * Subscriber will receive up to {@code n} additional {@code
         * onNext} invocations (or fewer if terminated).
         *
         * @param n the increment of demand; a value of {@code
         * Long.MAX_VALUE} may be considered as effectively unbounded
         */
        public void request(long n);

        /**
         * Causes the Subscriber to (eventually) stop receiving
         * messages.  Implementation is best-effort -- additional
         * messages may be received after invoking this method.
         * A cancelled subscription need not ever receive an
         * {@code onComplete} or {@code onError} signal.
         */
        public void cancel();
    }

    /**
     * A component that acts as both a Subscriber and Publisher.
     *
     * @param <T> the subscribed item type
     * @param <R> the published item type
     */
    public static interface Processor<T,R> extends Subscriber<T>, Publisher<R> {
    }

    static final int DEFAULT_BUFFER_SIZE = 256;

    /**
     * Returns a default value for Publisher or Subscriber buffering,
     * that may be used in the absence of other constraints.
     *
     * @implNote
     * The current value returned is 256.
     *
     * @return the buffer size value
     */
    public static int defaultBufferSize() {
        return DEFAULT_BUFFER_SIZE;
    }

}
```

### 1.2 示例

```java

@Data
public class Order {
    private String name;

    private int price;

    private int num;

    public Order(String name, int price, int num) {
        this.name = name;
        this.price = price;
        this.num = num;
    }
}

public class OrderSubscriber implements Flow.Subscriber<Order> {

    private Flow.Subscription subscription;

    private int counter = 0;

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(1); //requesting data from publisher
        System.out.println("receive subscription");
    }

    @Override
    public void onNext(Order item) {
        System.out.printf("receive item %s\n", item.getName());
        this.subscription.request(1);
        counter++;
    }

    @Override
    public void onError(Throwable throwable) {
        System.out.println("exception happened");
    }

    @Override
    public void onComplete() {
        System.out.println("All Processing Done");
    }

    public int getCounter() {
        return counter;
    }
}

public class MyApplication {
	public static void main(String[] args) throws InterruptedException {

		// Create Publisher
		SubmissionPublisher<Order> publisher = new SubmissionPublisher<>();

		// Register Subscriber
		OrderSubscriber subs = new OrderSubscriber();
		publisher.subscribe(subs);

		List<Order> orders = Arrays.asList(new Order("Iphone", 6000, 1), new Order("Book", 20, 3), new Order("Paper", 1, 20));

		// Publish items
		System.out.println("Publishing Items to Subscriber");
		orders.forEach(publisher::submit);

		// logic to wait till processing of all messages are over
		while (orders.size() != subs.getCounter()) {
			TimeUnit.MICROSECONDS.sleep(10);
		}

		// close the Publisher
		publisher.close();
	}
}
```

输出如下：

> Publishing Items to Subscriber
receive subscription
receive item Iphone
receive item Book
receive item Paper
All Processing Done

接着，我们可以简单来做个性能测试：

```java
public class OrderSubscriber implements Flow.Subscriber<Order> {

    private Flow.Subscription subscription;

    private CountDownLatch countDownLatch;

    private int num;

    public OrderSubscriber(int num, CountDownLatch countDownLatch) {
        this.countDownLatch = countDownLatch;
        this.num = num;
    }

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(num); //requesting data from publisher
        System.out.println("receive subscription");
    }

    @Override
    public void onNext(Order item) {
        //System.out.printf("receive item %s\n", item.getName());
        try {
            TimeUnit.MILLISECONDS.sleep(30);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        countDownLatch.countDown();
    }

    @Override
    public void onError(Throwable throwable) {
        System.out.println("exception happened");
    }

    @Override
    public void onComplete() {
        System.out.println("All Processing Done");
    }

    public CountDownLatch getCountDownLatch() {
        return countDownLatch;
    }
}

public class MyApplication {

	public static void main(String[] args) throws InterruptedException {
		List<Order> orders = new ArrayList<>();
		for(int i=0; i < 100; i++) {
			orders.add(new Order("Iphone", 6000, 1));
		}

		long t = System.nanoTime();

		// Create Publisher
		SubmissionPublisher<Order> publisher = new SubmissionPublisher<>();

		// Register Subscriber
		CountDownLatch countDownLatch = new CountDownLatch(orders.size());
		OrderSubscriber subs = new OrderSubscriber(orders.size(), countDownLatch);
		publisher.subscribe(subs);
		// Publish items
		System.out.println("Publishing Items to Subscriber");
		orders.forEach(publisher::submit);

		// logic to wait till processing of all messages are over
		countDownLatch.await();

		// close the Publisher
		publisher.close();

		System.out.println("Tps is: " + orders.size() * 1000000000L / (System.nanoTime() - t) );
	}

}
```

输出：

> Publishing Items to Subscriber
receive subscription
All Processing Done
Tps is: 31

此处，我们模拟了每个订单处理的过程是阻塞式的，需要30ms左右，最终看到TPS只有31，没有想象中的高。这是因为onNext是顺序执行的，每个阻塞30ms左右，自然最终TPS只有31。基于此，我们可以将onNext也改成异步非阻塞式的。

```java
public class OrderSubscriber implements Flow.Subscriber<Order> {

    private Flow.Subscription subscription;

    private CountDownLatch countDownLatch;

    private int num;

    public OrderSubscriber(int num, CountDownLatch countDownLatch) {
        this.countDownLatch = countDownLatch;
        this.num = num;
    }

    @Override
    public void onSubscribe(Flow.Subscription subscription) {
        this.subscription = subscription;
        this.subscription.request(num); //requesting data from publisher
        System.out.println("receive subscription");
    }

    @Override
    public void onNext(Order item) {
        ForkJoinPool.commonPool().execute(new OrderProcessor(countDownLatch, item));
    }

    @Override
    public void onError(Throwable throwable) {
        System.out.println("exception happened");
    }

    @Override
    public void onComplete() {
        System.out.println("All Processing Done");
    }

    public CountDownLatch getCountDownLatch() {
        return countDownLatch;
    }

    static class OrderProcessor implements Runnable {

        private CountDownLatch countDownLatch;
        private Order order;

        public OrderProcessor(CountDownLatch countDownLatch, Order order) {
            this.countDownLatch = countDownLatch;
            this.order = order;
        }

        @Override
        public void run() {
            String name = order.getName();
            try {
                TimeUnit.MILLISECONDS.sleep(30);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            countDownLatch.countDown();
        }
    }
}
```

输出：

> Publishing Items to Subscriber
receive subscription
All Processing Done
Tps is: 298

可以看到TPS提升了10倍左右，性能的提升与计算机的性能和异步线程池的大小有关，这里我们用的Forjoin线程池。接着，我们尝试调整线程池中线程的数量。

如果我们将线程池大小提高到与order数量一致，会得到如下输出。如果计算机核心够多，则此时所有任务都是并行的，所有任务一起阻塞30ms左右。TPS理论极限应该为1000 / 30 * N，其中N为CPU核心数量。

> Publishing Items to Subscriber
receive subscription
All Processing Done
Tps is: 1469

如果我们将线程池大小改成1，会得到如下输出，此时所有任务共享一个线程，相当于是串行阻塞的。
> Publishing Items to Subscriber
receive subscription
All Processing Done
Tps is: 31

所以在使用异步流工作的时候，我们的任务中的每一环最好都是无阻塞的，否则整个异步流都会因为一个阻塞点而大大降低性能。

## 2. 

## 参考链接

https://projectreactor.io/docs/core/release/reference/#about-doc