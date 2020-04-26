---
title: Java多线程数据安全
date: 2020-03-06
categories:
- java
tags:
- java
- 多线程
---

谈到Volatile就不得不说Volatile的两个功能，保证可见性以及禁止指令重排，然而你真的了解透彻这些原理了吗，不妨先试着看看以下几个示例。

<!--more-->

- 示例1

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        t.running = false;
        System.out.println("main end");
    }
}
```

> main end
> m start!
> m end!

- 示例2

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        for (int i = 0; i < 10000 ; i++) {
            Math.pow(44,33);
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

> m start!
> main end
> m end!

- 示例3

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        for (int i = 0; i < 10000 ; i++) {
            Math.pow(444,333);
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

> m start!
> main end
>
> 子线程进入死循环

- 示例4

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

> m start!
>
> main end
>
> 子线程进入死循环

- 示例5

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
            try {
                TimeUnit.MILLISECONDS.sleep(1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

>m start!
>main end
>m end!

- 示例6

```java
public class VolatileTest {
    boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
            synchronized (this){
            }
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

> m start!
> main end
> m end!

- 示例7

```java
public class VolatileTest {
    volatile boolean running = true;

    void m(){
        System.out.println("m start!");
        while(running) {
        }
        System.out.println("m end!");
    }

    public static void main(String[] args) {
        final VolatileTest t = new VolatileTest();
        new Thread(t::m).start();
        try {
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        t.running = false;
        System.out.println("main end");
    }
}
```

> m start!
> main end
> m end!

这些示例输出是否符合你的预期呢，如果你现在对这些一脸懵逼，那么不妨先跟着我再深入了解一下原理，相信读完这篇文章，你一定会大有收获。

## 线程工作内存与主内存

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200306200105.png)

JVM将内存分为主内存和工作内存两部分。每个线程都拥有一个自己的工作内存，工作内存中保存着主内存的某些变量的拷贝，线程对变量的所有操作都必须在工作内存中完成，而不能直接读写主内存。线程间的数据是不可见的，如，共享变量初始值为1，线程1将共享变量修改为2，若线程1未将修改后的值写入主内存或线程1将修改后的值写入主内存但线程2未从主内存中重新读取，则线程2看到的共享变量值仍为1。

- <font color=red>工作内存从主内存中读取数据</font> 线程第一次用到某个变量时，从主存中复制变量到当前工作内存
- <font color=red>工作内存将数据写回主存</font> 若线程对变量值进行修改，计算机会在**适当的**（非立即）的时候用工作内存数据刷新主存数据
  

这里的“写”的时机是重点，多个线程同时读写某个变量时，由于不同线程之间的数据是**不可见**的，不同线程对变量的修改不会立即刷新到主存，主存中值的变化也不会导致线程工作区间变量的立即失效，因而就会产生多线程并发问题。

 ### Volatile关键字

volatile关键字提供两大特性保证，可见性和禁止指令重排

- <font color=red>可见性</font> volatile要求线程对变量的修改，每次都要写回主内存，每次访问变量时都要从主存中加载，但volatile并不能保证线程安全，可见性不代表线程安全。
- <font color=red>禁止指令重排</font> 对被volatile修饰的变量进行修改时，会保证在此之前的代码在执行变量修改之前完成，在此之后的代码在变量修改完成之后进行

### 关于可见性的总结

1. 一个线程终止时，改线程改变的所有属性的值会被同步到主存
2. 线程第一次访问对象的某个属性时，会从主存中复制属性值
3. 一个字段被声明为volatile时，线程对变量的修改会立即同步到主存，线程读取会从主存中加载
4. 当线程从阻塞中唤醒或线程内部调用加锁的同步方法或同步代码块时，线程缓存会进行刷新

### 回顾

此时，我们再来回顾文章开头引出的7个示例，我们应该有恍然大悟的感觉。

1. 示例1中可以分为两种情况。第一种情况，若主线程先执行，此时线程工作running副本被设置为false，打印“main end”，根据总结1可知，主线程结束，主线程对属性的修改会被同步到主存，此时主存中running为false，子线程后执行，打印“m start!”，根据总结2，子线程第一次访问running，从主内存中获取值为false，直接跳出循环，打印“m end！”。第二种情况，若主线程在启动子线程后先被挂起，子线程先执行，打印“m start!”，子线程第一次访问running，从主存中复制running值为true到线程工作内存，while进入死循环。此时，主循环虽然将running改为false并在线程终止后将false刷回到主内存，但由于子线程并不能感知主内存变量变化并且没有任何事情触发子线程内存空间变量失效，因而子线程running一直为false，程序无法终止。
2. 示例2中主内存启动后，进行一些稍微简单的操作，在子线程第一次访问running之前主线程就完成了running值的修改并以线程终止的方式同步回主存，因此可以正常结束。而示例3中进行了比较大的运算，在子线程第一次访问running之前，主线程还没有来得及修改running的值，此时子线程通过到子线程空间的running值为true，因为陷入死循环。示例4同样的道理，主线程经过1秒休眠，子线程在主线程修改running前拿到了running的值为true，陷入死循环。
3. 示例5在示例4的基础上，在子线程while循环体中加入了休眠，由总结4可知，子线程工作内存刷新，拿到主存中的true，程序正常结束。同理，示例6通过同步代码块的方式强制子线程内存刷新。
4. 示例7通过volatile关键字保证了共享变量修改的可见性

### 结论

在多线程中对共享变量进行读写操作时需要谨慎，不同线程的工作内存独立，容易产生各种意想不到的结果，volatile可以保证多线程间的可见性，但不能保证线程安全。

