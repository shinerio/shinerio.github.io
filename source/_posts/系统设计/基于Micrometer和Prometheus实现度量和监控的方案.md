---
title: 基于Micrometer和Prometheus实现度量和监控的方案
date: 2022-01-16
categories:
- 运维
tags:
- 运维
---

应用程序的监控是微服务中很重要的一环。监控主要包括四个方面的内容：指标（metrics）的统计、采集、存储、监控、展示和报警机制。

<!--more-->

## 1. 指标统计

指标的统计使用Mircometer(千分尺)，正如其官方文档所说的那样，Micrometer就是监控界的slf4j，致力于通过外观模式的方式打造一套数据采集的标准。

Micrometer provides a simple facade over the instrumentation clients for the most popular monitoring systems, allowing you to instrument your JVM-based application code without vendor lock-in. Think SLF4J, but for metrics.

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1642313496803.png)

Micrometer 为 Java 平台上的性能数据收集提供了一个通用的 API，应用程序只需要使用 Micrometer 的通用 API 来收集性能指标即可。Micrometer 会负责完成与不同监控系统的适配工作。这就使得切换监控系统变得很容易。Micrometer 还支持推送数据到多个不同的监控系统。

### 1.1 MeterRegistry

Meter是收集关于你的应用的一系列指标的接口。Meter是由MeterRegistry创建的，MeterRegistry是Meter的注册中心，每个支持的监控系统都必须实现MeterRegistry。 MeterRegistry在Micrometer是一个抽象类，主要实现包括：

1. **SimpleMeterRegistry**：每个Meter的最新数据可以收集到SimpleMeterRegistry实例中，但是这些数据不会发布到其他系统，也就是数据是位于应用的内存中的。如果你还没有一个首选的监测系统，你可以先用SimpleMeterRegistry。
2. **CompositeMeterRegistry**：多个MeterRegistry聚合，内部维护了一个MeterRegistry的列表，允许同时向多个监视系统发布指标。
3. **全局的MeterRegistry**：工厂类io.micrometer.core.instrument.Metrics中持有一个静态final的CompositeMeterRegistry实例globalRegistry。

```java
        // 1. 内存条中维护数据
        MeterRegistry registry = new SimpleMeterRegistry();
        // 2. CompositeMeterRegistry初始化的时候，内部持有的MeterRegistry列表是空的，如果此时用这个registry创建一个Meter实例，Meter实例的操作都是无效的
        CompositeMeterRegistry compositeMeterRegistry = new CompositeMeterRegistry();
        // 3. 通过Metrics提供的静态属性，可以获得一个全局的meterRegistry，其本质是一个CompositeMeterRegistry
        CompositeMeterRegistry globalRegistry = Metrics.globalRegistry;
        Metrics.addRegistry(new SimpleMeterRegistry());
```

### 1.2 Tag

Tag（标签）是Micrometer的一个重要的功能，严格来说，一个度量框架只有实现了标签的功能，才能真正地多维度进行度量数据收集。Tag的命名一般需要是有意义的，所谓有意义就是可以根据Tag的命名可以推断出它指向的数据到底代表什么维度或者什么类型的度量指标。Meter由name和tag来唯一标识，在Micrometer中tag等价于dimension。具体举例来说比如监控一个Http Server的API请求数量，对于接口A的Meter可以定义为name=http.requests, tag=uri:/api/a,desc=api-a，对于接口B的Meter可以定义为name=http.requests, tag=uri:/api/b,desc=api-b，也就是说名称应该是对类别的描述而tag是针对某项具体统计的描述，这样便于数据分组，既可以统计某类的总体情况也可以对单个数据进行分析。假设我们需要监控不同用户的数据库调用：

```java
        MeterRegistry registry = new SimpleMeterRegistry();
        registry.counter("database.calls", "user", "openstack");
        registry.counter("database.calls", "user", "neutron");
        Search.in(registry).meters().forEach(each -> {
            StringBuilder builder = new StringBuilder();
            builder.append("name:")
                    .append(each.getId().getName())
                    .append(",tags:")
                    .append(each.getId().getTags())
                    .append(",type:").append(each.getId().getType())
                    .append(",value:").append(each.measure());
            System.out.println(builder.toString());
        });
```

输出：

> name:database.calls,tags:[tag(user=neutron)],type:COUNTER,value:[Measurement{statistic='COUNT', value=0.0}]
name:database.calls,tags:[tag(user=openstack)],type:COUNTER,value:[Measurement{statistic='COUNT', value=0.0}]

我们还可以定义全局的Tag，也就是全局的Tag定义之后，会附加到所有的使用到的Meter上(只要是使用同一个MeterRegistry)，全局的Tag可以这样定义：

```java
        MeterRegistry registry = new SimpleMeterRegistry();
        registry.config().commonTags("Region", " us-east-1", "Service", "vpc");
        registry.config().commonTags(Arrays.asList(Tag.of("Region", "us-east-1"), Tag.of("Service", "vpc")));
        registry.counter("database.calls", "user", "neutron");
        Search.in(registry).meters().forEach(each -> {
            StringBuilder builder = new StringBuilder();
            builder.append("name:")
                    .append(each.getId().getName())
                    .append(",tags:")
                    .append(each.getId().getTags())
                    .append(",type:").append(each.getId().getType())
                    .append(",value:").append(each.measure());
            System.out.println(builder.toString());
        });
```

输出：
> name:database.calls,tags:[tag(Region= us-east-1), tag(Service=vpc), tag(user=neutron)],type:COUNTER,value:[Measurement{statistic='COUNT', value=0.0}]

### 1.3 MeterFilter

Registry可以通过MeterFilter功能提供过滤功能，可以实现基于标签或者名称进行统计，或者为Meter的名称添加白名单。MeterFilter本身提供一些列的静态方法，多个MeterFilter可以叠加或者组成链实现用户最终的过滤策略。

```java
    public static void main(String[] args) {
        MeterRegistry registry = new SimpleMeterRegistry();
        registry.config()
                .meterFilter(MeterFilter.ignoreTags("url"))
                .meterFilter(MeterFilter.denyNameStartsWith("database"));
        registry.config().commonTags("Region", " us-east-1", "Service", "vpc");
        registry.config().commonTags(Arrays.asList(Tag.of("Region", "us-east-1"), Tag.of("Service", "vpc")));
        // 以database开头的Meter被过滤掉
        registry.counter("database.calls", "user", "neutron");
        // 名为url的tag被忽略
        registry.counter("api.calls", "url", "/v1/heartbeat");
        registry.counter("api.calls", "service", "nova");
        Search.in(registry).meters().forEach(each -> {
            StringBuilder builder = new StringBuilder();
            builder.append("name:")
                    .append(each.getId().getName())
                    .append(",tags:")
                    .append(each.getId().getTags())
                    .append(",type:").append(each.getId().getType())
                    .append(",value:").append(each.measure());
            System.out.println(builder.toString());
        });
    }
```

输出：
> name:api.calls,tags:[tag(Region= us-east-1), tag(Service=vpc), tag(service=nova)],type:COUNTER,value:[Measurement{statistic='COUNT', value=0.0}]
name:api.calls,tags:[tag(Region= us-east-1), tag(Service=vpc)],type:COUNTER,value:[Measurement{statistic='COUNT', value=0.0}]


### 1.4 Meters

#### 1.4.1 Counter

Counter是一种比较简单的Meter，它是一种单值的度量类型，或者说是一个单值计数器。Counter接口允许使用者使用一个固定值（必须为正数）进行计数。准确来说：Counter就是一个增量为正数的单值计数器。Counter的作用是记录总量，适用于一些增长类型的统计，例如下单、支付次数、HTTP请求总量记录等等。通过Tag可以区分不同的场景，对于下单，可以使用不同的Tag标记不同的平台来源，对于HTTP请求总量记录，可以使用Tag区分不同的URL。

1. 创建

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        // 1. registry创建
        Counter counter1 = registry.counter("counter1", "region", "us-east-1");
        // 2. Counter静态方法
        Counter counter2 = Counter
                .builder("counter2")
                .baseUnit("beans") // optional
                .description("a description of what this counter does") // optional
                .tags("region", "us-east-1") // optional
                .register(registry);
        // 3. Metrics静态方法
        Counter counter3 = Metrics.counter("counter3", "region", "us-east-1");

        // 4. FunctionCounter，自定义计数器，提供一个计数对象以及把计数对象转换成double型计数值的方法
        AtomicInteger adder = new AtomicInteger(0);
        FunctionCounter counter4 = FunctionCounter.builder("functionCounter", adder, AtomicInteger::get)
                .baseUnit("function")
                .description("functionCounter")
                .tag("createOrder", "CHANNEL-A")
                .register(registry);
```

2. 计数

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        // 1. registry创建
        Counter counter1 = registry.counter("counter1", "region", "us-east-1");
        // 2. Counter静态方法
        Counter counter2 = Counter
                .builder("counter2")
                .baseUnit("beans") // optional
                .description("a description of what this counter does") // optional
                .tags("region", "us-east-1") // optional
                .register(registry);
        // 3. Metrics静态方法
        Counter counter3 = Metrics.counter("counter3", "region", "us-east-1");

        // 4. FunctionCounter，自定义计数器，提供一个计数对象以及把计数对象转换成double型计数值的方法
        AtomicInteger adder = new AtomicInteger(0);
        FunctionCounter counter4 = FunctionCounter.builder("functionCounter", adder, AtomicInteger::get)
                .baseUnit("function")
                .description("functionCounter")
                .tag("createOrder", "CHANNEL-A")
                .register(registry);

        counter1.increment();
        counter2.increment();
        counter3.increment();
        adder.incrementAndGet();
        System.out.println(counter1.measure());
        System.out.println(counter2.measure());
        System.out.println(counter3.measure());
        System.out.println(counter4.measure());
```

输出：
> [Measurement{statistic='COUNT', value=1.0}]
[Measurement{statistic='COUNT', value=1.0}]
[Measurement{statistic='COUNT', value=1.0}]
[Measurement{statistic='COUNT', value=1.0}]

#### 1.4.2 Timer

Timer（计时器）适用于记录耗时比较短的事件的执行时间，通过时间分布展示事件的序列和发生频率。所有的Timer的实现至少记录了发生的事件的数量和这些事件的总耗时，从而生成一个时间序列。Timer在事件结束时记录数据，每条记录代表一个时间段。

```java
 public static void main(String[] args) throws Exception {
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        Timer timer = Timer.builder("api.call")
                .tag("vpc", "/v1/network")
                .register(registry);
        timer.record(Duration.ofMillis(100));
        System.out.println(timer.record(() -> createVpc()));
        timer.record(() -> deleteVpc());
        System.out.println(wrapperCreateVpc(timer).call());
        wrapperDeleteVpc(timer).run();
        System.out.println("Total record: " + timer.count());
        System.out.println(timer.measure());
    }

    public static Callable<String> wrapperCreateVpc(Timer timer) {
        Callable<String> createVpc = () -> createVpc();
        return timer.wrap(createVpc);
    }

    public static Runnable wrapperDeleteVpc(Timer timer) {
        Runnable deleteVpc = () -> deleteVpc();
        return timer.wrap(deleteVpc);
    }

    public static void deleteVpc() {
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static String createVpc() {
        try {
            TimeUnit.SECONDS.sleep(2);
            return "test-vpc";
        } catch (InterruptedException e) {
            e.printStackTrace();
            return "None";
        }
    }
```

输出：
> test-vpc
test-vpc
Total record: 5
[Measurement{statistic='COUNT', value=5.0}, Measurement{statistic='TOTAL_TIME', value=6.1028661}, Measurement{statistic='MAX', value=2.000589}]

另外，Timer的使用还可以基于它的内部类Timer.Sample，通过start和stop两个方法记录两者之间的逻辑的执行耗时

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        Timer timer = Timer.builder("api.call")
                .tag("vpc", "/v1/network")
                .register(registry);
        Timer.Sample sample = Timer.start(registry);
        deleteVpc();
        sample.stop(timer);
        System.out.println(timer.measure());
```

输出：
> [Measurement{statistic='COUNT', value=1.0}, Measurement{statistic='TOTAL_TIME', value=1.0003523}, Measurement{statistic='MAX', value=1.0003523}]

类似于FunctionCounter，FunctionTimer也提供了自定义计时的功能。

```java
        MyTimer myTimer = new MyTimer();
        // 第二参数为计时对象，第三个参数为计数方法，第四个参数为总时长计时方式
        FunctionTimer timer = FunctionTimer.builder("functionTimer", myTimer, t -> t.totalCount.get(),
                t -> t.totalTimeNanos.get(), TimeUnit.NANOSECONDS)
                .register(new SimpleMeterRegistry());
        myTimer.totalTimeNanos.addAndGet(1000 * 1000 * 1000);
        myTimer.totalCount.incrementAndGet();
        System.out.println(timer.measure());
```

输出：
> [Measurement{statistic='COUNT', value=1.0}, Measurement{statistic='TOTAL_TIME', value=1.0}]

#### 1.4.3  Long task timers

LongTaskTimer是Timer的一种特殊类型，主要统计的是当前有多少正在执行的任务，以及这些这任务已经耗费了多少时间，适用于监控长时间执行的方法，统计类似当前负载量的相关指标。Long Task Timer在事件开始时记录，在事件结束后将事件移除。

```java
    public static void main(String[] args) throws Exception {
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        LongTaskTimer timer = registry.more().longTaskTimer("longTime.task");
        Schedulers.boundedElastic().schedule(() -> timer.record(() -> deleteVpc()));
        Schedulers.boundedElastic().schedule(() -> timer.record(() -> createVpc()));
        TimeUnit.SECONDS.sleep(1);
        System.out.println(timer.measure());
        TimeUnit.MILLISECONDS.sleep(1500);
        System.out.println(timer.measure());
        TimeUnit.SECONDS.sleep(2);
        System.out.println(timer.measure());
    }

    public static void deleteVpc() {
        try {
            TimeUnit.SECONDS.sleep(4);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    public static String createVpc() {
        try {
            TimeUnit.SECONDS.sleep(2);
            return "test-vpc";
        } catch (InterruptedException e) {
            e.printStackTrace();
            return "None";
        }
    }
```

输出：
> [Measurement{statistic='ACTIVE_TASKS', value=2.0}, Measurement{statistic='DURATION', value=2.005069E9}]
[Measurement{statistic='ACTIVE_TASKS', value=1.0}, Measurement{statistic='DURATION', value=2.5038645E9}]
[Measurement{statistic='ACTIVE_TASKS', value=0.0}, Measurement{statistic='DURATION', value=0.0}]

#### 1.4.4 Gauge

gauge是获取当前值的句柄。典型的例子是，获取集合、map、或运行中的线程数等。MeterRegistry接口包含了用于构建gauges的方法，用于观察数字值、函数、集合和map。当指标不是递增的而是一个上下浮动的值时，你应该采用Gauge，同时Gauge也翻译为仪表盘，典型如汽车的速度仪。使用Gauge可以观察动态的数值，如数据库活跃连接数、api活跃线程数量、消息队列中消息数量等。


```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        // 第三参数为监控对象，第四个参数没监控值
        List<Thread> list = registry.gauge("jvm", Tags.of("thread", "num"), new ArrayList<>(), List::size);
        // 监控list大小
        List<String> list2 = registry.gaugeCollectionSize("ListSize", Tags.empty(), new ArrayList<>());
        // 监控map大小
        Map<String, Integer> map = registry.gaugeMapSize("mapSize", Tags.empty(), new HashMap<>());
        list.add(new Thread());
        list2.add("aa");
        map.put("a", 1);
        Search.in(registry).meters().forEach(each -> {
            StringBuilder builder = new StringBuilder();
            builder.append("name:")
                    .append(each.getId().getName())
                    .append(",tags:")
                    .append(each.getId().getTags())
                    .append(",type:").append(each.getId().getType())
                    .append(",value:").append(each.measure());
            System.out.println(builder.toString());
        });
```

输出：
> name:mapSize,tags:[],type:GAUGE,value:[Measurement{statistic='VALUE', value=1.0}]
> name:ListSize,tags:[],type:GAUGE,value:[Measurement{statistic='VALUE', value=1.0}]
> name:jvm,tags:[tag(thread=num)],type:GAUGE,value:[Measurement{statistic='VALUE', value=1.0}]

上面的三个方法通过MeterRegistry构建Gauge并且返回了List或者Map实例，使用这些集合或者映射实例就能在其size变化过程中记录这个变更值。更重要的优点是，我们不需要感知Gauge接口的存在，只需要像平时一样使用集合或者映射实例就可以了。我们还可以通过如下方法监控一个已有实例。

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        MeterRegistry registry = Metrics.globalRegistry;
        List<Thread> listThread = new ArrayList<>();
        Gauge gauge = Gauge.builder("jvm", listThread, List::size).register(registry);
        listThread.add(new Thread());
        System.out.println(gauge.measure());
```

输出：
> [Measurement{statistic='VALUE', value=1.0}]

#### 1.4.5 DistributionSummary

分布概要（Distribution summary）用来记录事件的分布情况。分布概要根据每个事件所对应的值，把事件分配到对应的桶（bucket）中。Micrometer 默认的桶的值从 1 到最大的 long 值。可以通过minimumExpectedValue和maximumExpectedValue来控制值的范围。如果事件所对应的值较小，可以通过 scale 来设置一个值来对数值进行放大。与分布概要密切相关的是直方图和百分比（percentile）。大多数时候，我们并不关注具体的数值，而是数值的分布区间。比如在查看 HTTP 服务响应时间的性能指标时，通常关注是的几个重要的百分比，如 50%，75%和 90%等。所关注的是对于这些百分比数量的请求都在多少时间内完成。Micrometer 提供了两种不同的方式来处理百分比。

- 对于Prometheus 这样本身提供了对百分比支持的监控系统，Micrometer 直接发送收集的直方图数据，由监控系统完成计算。
- 对于其他不支持百分比的系统，Micrometer 会进行计算，并把百分比结果发送到监控系统。

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        DistributionSummary summary = DistributionSummary.builder("api.call.time")
                .description("simple distribution summary")
                .maximumExpectedValue(100.0D)
                .publishPercentiles(0.5, 0.8, 1)
                .register(Metrics.globalRegistry);
        summary.record(30);
        summary.record(51);
        summary.record(74);
        summary.record(90);
        summary.record(97);
        System.out.println(summary.takeSnapshot());
```

输出：
> HistogramSnapshot{count=5, total=342.0, mean=68.4, max=97.0, percentileValues=[(75.0 at 50.0%), (91.0 at 80.0%), (99.0 at 100.0%)]}

### 1.5 Histograms and percentiles（直方图和百分比）

Timers 和 distribution summaries 支持收集数据来观察它们的百分比。查看百分比有两种主要方法：

1. **Percentile histograms（百分比直方图）**：  Micrometer将值累积到底层直方图，并将一组预先确定的buckets发送到监控系统。监控系统的查询语言负责从这个直方图中计算百分比。目前，只有Prometheus , Atlas , Wavefront支持基于直方图的百分位数近似值，并且通过histogram_quantile , :percentile , hs()依次表示。
2. **Client-side percentiles（客户端百分比）**：Micrometer为每个meter ID（一组name和tag）计算百分位数近似值，并将百分位数值发送到监控系统。

```java
        Metrics.addRegistry(new SimpleMeterRegistry());
        Timer timer = Timer.builder("my.timer")
                .publishPercentiles(0.5, 0.95) // median and 95th percentile
                .publishPercentileHistogram()
                .sla(Duration.ofMillis(100))
                .minimumExpectedValue(Duration.ofMillis(1))
                .maximumExpectedValue(Duration.ofSeconds(10))
                .register(Metrics.globalRegistry);
```

> publishPercentileHistogram: 用于发布直方图, 适用于计算聚合 (多维度) 百分位近似值，在prometheus中用histogram_quantile，在atlas 中用:percentile。直方图结果中的buckets，由micrometer预先生成，生成器默认会产生 276 个 buckets，且micrometer只会将那些范围在minimumExpectedValue和maximumExpectedValue之内的发送给监控系统。sla用于发布基于SLA定义的桶的累积直方图。与publishPercentileHistogram用法一致，在支持百分比聚合的监视系统中，此设置用于向已发布的直方图中添加额外的桶。对于不支持百分比聚合的系统上使用时，将仅使用这些桶发布直方图。

### 1.6 Cumulate & Step

对于一个完整的监控体系来说，通常至少会有三个部分：应用程序、监控数据存储、监控数据表现，而某些框架或者工具会同时包含其中的多个或者多个工具共同组成一个部分，从而产生各种各样的组合。对于速率、平均值、事件分布、延迟等与时间窗口相关的监控指标（Rate aggregation）可以在不同的部分进行处理，例如对于某个接口请求速度的监控，可以在应用层计算好直接发送速度值；也可以直接发送请求数量到存储层然后由表现层来计算速度；又或者是由应用层存储累加值，由其他工具主动来抓取每个时刻的状态。

所以在应用层，有的Meter会有两种类型：累加（Accumulate）与滚动（Step）。以Counter为例，该基接口在core包提供的默认实现中包括：CumulativeCounter和StepCounter，源码并不复杂。

```java
public class CumulativeCounter extends AbstractMeter implements Counter {
    private final DoubleAdder value;

    public CumulativeCounter(Id id) {
        super(id);
        this.value = new DoubleAdder();
    }

    @Override
    public void increment(double amount) {
        value.add(amount);
    }

    @Override
    public double count() {
        return value.sum();
    }
}

```

```java
public class StepCounter extends AbstractMeter implements Counter {
    private final StepDouble value;

    public StepCounter(Id id, Clock clock, long stepMillis) {
        super(id);
        this.value = new StepDouble(clock, stepMillis);
    }

    @Override
    public void increment(double amount) {
        value.getCurrent().add(amount);
    }

    @Override
    public double count() {
        return value.poll();
    }
}

//向监视系统报告间隔速率的计数器，count()方法将报告上一个完整周期的数值
// 而非整个生命周期的总数。可以查看StepDouble(StepValue)源码来查看滚动的具体实现
public class StepCounter extends AbstractMeter implements Counter {
    private final StepDouble value;

    public StepCounter(Id id, Clock clock, long stepMillis) {
        super(id);
        this.value = new StepDouble(clock, stepMillis);
    }

    @Override
    public void increment(double amount) {
        value.getCurrent().add(amount);
    }

    @Override
    public double count() {
        return value.poll();
    }
}
```

##  2、 指标采集和监控

指标采集介绍statsd和Prometheus两种方式。

### 2.1 statsd

Statsd最早是2008年Flickr公司用Perl写的针对Graphite、datadog等监控数据后端存储开发的前端网络应用，2011 年 Etsy 公司用 node.js 重构。statsd狭义来讲，其实就是一个监听UDP（默认）或者TCP的守护程序，根据简单的协议收集statsd客户端发送来的数据，聚合之后，定时推送给后端，如graphite和influxdb等，再通过grafana等展示。statsd系统包括三部分：客户端（client）、服务器（server）和后端（backend）。客户端植入于应用代码中，将相应的metrics上报给statsd server。statsd server聚合这些metrics之后，定时发送给backends。backends则负责存储这些时间序列数据，并通过适当的图表工具展示。

statsd采用简单的行协议： 
```<bucket>:<value>|<type>[|@sample_rate]复制代码```
bucket
```bucket是一个metric的标识，可以看成一个metric的变量。```
value
```metric的值，通常是数字。```
type
```metric的类型，通常有timer、counter、gauge和get```
sample_rate
```如果数据上报量过大，很容易溢满statsd。所以适当的降低采样，减少server负载。这个频率容易误解，需要解释一下。客户端减少数据上报的频率，然后在发送的数据中加入采样频率，如0.1。statsd server收到上报的数据之后，如cnt=10，得知此数据是采样的数据，然后flush的时候，按采样频率恢复数据来发送给backend，即flush的时候，数据为cnt=10/0.1=100，而不是容易误解的10*0.1=1。```

#### 2.1.1 UDP和TCP
statsd可配置相应的server为UDP和TCP。默认为UDP。UDP和TCP各有优劣。但UDP确实是不错的方式。UDP不需要建立连接，速度很快，不会影响应用程序的性能。“fire-and-forget”机制，就算statsd server挂了，也不会造成应用程序crash。当然，UDP更适合于上报频率比较高的场景，就算丢几个包也无所谓，对于一些一天已上报的场景，任何一个丢包都影响很大。另外，对于网络环境比较差的场景，也更适合用TCP，会有相应的重发，确保数据可靠。


#### 2.1.2 Metric
statsd 有四种指标类型：counter、timer、gauge和set。

1. 计数器 counter
counter类型的指标，用来计数。在一个flush区间，把上报的值累加。值可以是正数或者负数。 
user.logins:10|c        // user.logins + 10
user.logins:-1|c        // user.logins - 1
user.logins:10|c|@0.1   // user.logins + 100
                                     // users.logins = 10-1+100=109

 2. 计时器 timer
timers用来记录一个操作的耗时，单位ms。statsd会记录平均值（mean）、最大值（upper）、最小值（lower）、累加值（sum）、平方和（sum_squares）、个数（count）以及部分百分值。 如下是在一个flush期间，发送了一个rpt的timer值100
rpt:100|g
以下是记录的值。
```
count_80: 1,
mean_80: 100,
upper_80: 100,
sum_80: 100,
sum_squares_80: 10000,
std: 0,
upper: 100,
lower: 100,
count: 1,
count_ps: 0.1,
sum: 100,
sum_squares: 10000,
mean: 100,
median: 100
```
对于百分数相关的数据需要解释一下。以90为例。statsd会把一个flush期间上报的数据，去掉10%的峰值，即按大小取cnt\*90%（四舍五入）个值来计算百分值。举例说明，假如10s内上报以下10个值。 
```1,3,5,7,13,9,11,2,4,8```
则只取10*90%=9个值，则去掉13。百分值即按剩下的9个值来计算。 
```
$KEY.mean_90   // (1+3+5+7+9+2+11+4+8)/9
$KEY.upper_90  // 11
$KEY.lower_90  // 1复制代码
```

3. 标量 gauge
gauge是任意的一维标量值。gague值不会像其它类型会在flush的时候清零，而是保持原有值。statsd只会将flush区间内最后一个值发到后端。另外，如果数值前加符号，会与前一个值累加。 
```
age:10|g    // age 为 10
age:+1|g    // age 为 10 + 1 = 11
age:-1|g    // age为 11 - 1 = 10
age:5|g     // age为5,替代前一个值复制代码
```

4. sets
记录flush期间，不重复的值。 
```
request:1|s  // user 1
request:2|s  // user1 user2
request:1|s  // user1 user2
```

### 2.2 Prometheus

Prometheus是一个开源监控系统，它前身是SoundCloud的警告工具包。从2012年开始，许多公司和组织开始使用Prometheus。该项目的开发人员和用户社区非常活跃，越来越多的开发人员和用户参与到该项目中。目前它是一个独立的开源项目，且不依赖与任何公司。Prometheus 基于服务发现的模式，定时从应用程序实例上拉取指标数据，它支持自定义查询的语言以及数学操作。

#### 2.2.1 接入

接入 Prometheus 时首先需要引入如下的 maven 依赖：
```xml
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-registry-prometheus</artifactId>
  <version>${micrometer.version}</version>
</dependency>
```


#### 2.2.2 创建

创建Prometheus Registry，同时需要给Prometheus的scraper暴露一个 HTTP 端点用于数据拉取。

```java
PrometheusMeterRegistry prometheusRegistry = new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);
try {
    HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
    server.createContext("/prometheus", httpExchange -> {
        String response = prometheusRegistry.scrape(); (1)
        httpExchange.sendResponseHeaders(200, response.getBytes().length);
        try (OutputStream os = httpExchange.getResponseBody()) {
            os.write(response.getBytes());
        }
    });
    new Thread(server::start).start();
} catch (IOException e) {
    throw new RuntimeException(e);
}

while (true) {
    TimeUnit.SECONDS.sleep(1);
    Counter counter = prometheusRegistry.counter("counter", "region", "us-east-1");
    counter.increment();
}
```

访问127.0.0.1:8080/prometheus可得到如下结果
> \# HELP counter_total  
> \# TYPE counter_total counter
> Counter_total{region="us-east-1",} 1.0

设置拉取的数据格式。默认情况下PrometheusMeterRegistry的scrape()方法返回的是 Prometheus 默认的文本格式。从 Micrometer 1.7.0 开始，也可以通过如下方式指定数据格式为OpenMetrics定义的数据格式：
```String openMetricsScrape = registry.scrape(TextFormat.CONTENT_TYPE_OPENMETRICS_100);```

#### 2.2.3 安装

从https://prometheus.io/download/获取安装压缩包，解压后编辑prometheus.xml配置文件。

```xml
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: "prometheus"

    # metrics_path defaults to '/metrics'
    metrics_path: /prometheus
    # scheme defaults to 'http'.

    static_configs:
      - targets: ["localhost:8080"]
```

运行后，访问http://localhost:9090/classic/graph可执行表达式，获取监控数据

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1642328537059.png)

prometheus只提供了简单查询界面，如果需要更直观的监控GUI，可以安装Grafana来对接prometheus

## 3. 集成

集成了Micrometer框架的JVM应用使用到Micrometer的API收集的度量数据位于内存之中，因此，需要额外的存储系统去存储这些度量数据，需要有监控系统负责统一收集和处理这些数据，还需要有一些UI工具去展示数据。常见的存储系统就是时序数据库，主流的有Influx、Datadog等。比较主流的监控系统（主要是用于数据收集和处理）就是Prometheus（一般叫普罗米修斯，下面就这样叫吧）。而展示的UI目前相对用得比较多的就是Grafana。另外，Prometheus已经内置了一个时序数据库的实现，因此，在做一套相对完善的度量数据监控的系统只需要依赖目标JVM应用，Prometheus组件和Grafana组件即可。

