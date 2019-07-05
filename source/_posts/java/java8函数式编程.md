---
Title: java8函数式编程
date: 2019-07-04
Categories:
- java
Tags:
- java
---

# java8函数式编程

## 1 lambda表达式

### 1.1 Lambda表达式形式

labmda共有五种基本形式

1. 无入参，单行执行，无返回值

   ```java
   Runnable runnable = ()->System.out.print("");
   ```

2. 有入参，单行执行，有返回值

   ```java
   ActionListener listener = e->System.out.print(e);
   ```

   <!--more-->

3. 无入参，多行执行，无返回值

   ```java
   Runnable runnable1 = ()->{
               System.out.println("1");
               System.out.println("2");
           };
   ```

4. 有入参，有返回值

   ```java
   BinaryOperator<Long> add = (x,y)->x+y;
   BinaryOperator<Long> add = (x,y)->{return x+y;};  //也可以显示返回
   ```

5. 显示申明参数类型

   ```java
   BinaryOperator<Long> addExplicit = (Long x, Long y) -> x + y;
   ```

> 总结：lambda都可以扩写为匿名类的形式，可以直接把一个lambda表达式当做一个实例化的匿名类。接口有且只能有一个抽象方法，用lambda表达式实现，lambda只能作为接口(抽象类不行)的默认匿名实现。接口可以使用@FunctionalInterface申明为函数式接口，但是没有用注解申明的接口也可以使用lambda表达式匿名实现。

### 1.2 函数接口

| 接口              | 参数  | 返回类型 | 描述                                                     |
| ----------------- | ----- | -------- | -------------------------------------------------------- |
| Predicate<T>      | T     | boolean  | 用于判别一个对象，比如判断商品是否过期                   |
| Consumer<T>       | T     | void     | 用于接收一个对象进行处理，没有返回值，比如向打印一些日志 |
| Function<T,R>     | T     | R        | 接收一个对象，返回一个对象，常用来拆装箱对象             |
| Supplier<T>       | 无    | T        | 提供一个对象                                             |
| UnaryOperator<T>  | T     | T        | 一元运算，接收一个对象，进行处理，并返回同类型对象       |
| BinaryOperator<T> | (T,T) | T        | 二元运算，接收两个同类型的对象，并返回一个同类型对象     |

## 2. 集合

### 2.1 stream

所有继承自Collection的接口都可以转化为Stream。Stream的方法分为两类，一类叫惰性求值，一类叫及早求值。如果返回值是 Stream，那么是惰性求值。Stream只是记录下了这个惰性求值方法的过程，并没有去计算，等到调用及早求值方法后，就连同前面的一系列惰性求值方法顺序进行计算，返回结果。

通用形式为：

```java
Stream.惰性求值.惰性求值. ... .惰性求值.及早求值
```

**示例代码：**

```java
/**
* 求list中年龄大于20的人数
**/
//不适用stream
long count = 0;
for (Person p : persons) {
    if (p.getAge() > 20) {
        count ++;
    }
}
//使用stream
long count = Persons.stream().filter(person->person.getAge()>20).count();
```

### 2.2 Stream常用方法

1. collect

   `collect(toList())`方法由Stream里的值生成一个列表，是一个及早求值操作

   `collect(groupingBy())`方法由Stream里的值生成一个字典，是一个及早求值操作

2. map

   map接受一个Function匿名类，将一个流中的值转化成一个新的值

   ```java
     List<String> lists = new ArrayList<>();
           lists.add("a");
           lists.add("b");
           lists.add("shinerio");
           List<String> lists = lists.stream().map(String::toUpperCase).collect(Collectors.toList());
           System.out.println(lists);
   //[A, B, SHINERIO]
   ```

3. filter

   遍历数据，利用Predicate匿名类进行数据过滤

   ```java
   Stream.of(1,2,3).filter(i->i>2).collect(Collectors.toList());
   ```

4. flatMap

   将多个`Stream`连接成一个`Stream`

   ```java
   List<Integer> together = Stream.of(asList(1, 2), asList(3, 4))
                                  .flatMap(numbers -> numbers.stream())
                                  .collect(toList());
   ```

5. max和min

   求最大值和最小值

   ```java
   List<Integer> list = Lists.newArrayList(3, 5, 2, 9, 1);
   int maxInt = list.stream()
                    .max(Integer::compareTo)
                    .get();
   int minInt = list.stream()
                    .min(Integer::compareTo)
                    .get();
   assertEquals(maxInt, 9);
   assertEquals(minInt, 1);
   ```

   - `max` 和 `min` 方法返回的是一个 `Optional` 对象（和 Google Guava 里的 Optional 对象是一样的）。`Optional` 对象封装的就是实际的值，可能为空，所以保险起见，可以先用 `isPresent()` 方法判断一下。`Optional` 的引入就是为了解决方法返回 `null` 的问题。

   - `Integer::compareTo` 也是属于 Java 8 引入的新特性，叫做 **方法引用（Method References）**。在这边，其实就是 `(int1, int2) -> int1.compareTo(int2)` 的简写。

6. reduce

   `reduce`操作可以实现从一组值中生成一个值，count,min和max都是reduce操作。

   ```java
   int result = Stream.of(1, 2, 3, 4)
                      .reduce(0, (acc, element) -> acc + element);
   assertEquals(10, result);
   ```

   注意 `reduce` 的第一个参数，这是一个初始值。`0 + 1 + 2 + 3 + 4 = 10`。

### 2.3 数据并行化

`Stream` 的并行化也是 Java 8 的一大亮点。数据并行化是指将数据分成块，为每块数据分配单独的处理单元。这样可以充分利用多核 CPU 的优势。并行化操作流只需改变一个方法调用。如果已经有一个 `Stream` 对象，调用它的 `parallel()` 方法就能让其拥有并行操作的能力。如果想从一个集合类创建一个流，调用 `parallelStream()` 就能立即获得一个拥有并行能力的流。

```java
int sumSize = Stream.of("Apple", "Banana", "Orange", "Pear")
                    .parallel()
                    .map(s -> s.length())
                    .reduce(Integer::sum)
                    .get();
assertEquals(sumSize, 21);
```

如果你去计算这段代码所花的时间，很可能比不加上 `parallel()` 方法花的时间更长。这是因为数据并行化会先对数据进行分块，然后对每块数据开辟线程进行运算，这些地方会花费额外的时间。并行化操作只有在 **数据规模比较大** 或者 **数据的处理时间比较长** 的时候才能体现出有事，所以并不是每个地方都需要让数据并行化，应该具体问题具体分析。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20190704161256.png)

