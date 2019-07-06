---
title: ThreadLocal详解
Date: 2019-07-03
Categories:
- java
tags:
- java
---

ThreadLocal也叫线程本地变量，保证了线程之间独立，每个线程都访问的是独立的副本，在线程本地内存工作

<!--more-->

# 源码实现

```java
class ThreadLocal{
    public void set(T value) {
      	//获取当前线程
        Thread t = Thread.currentThread();
      	//每个线程都绑定了自己的ThreadLocalMap，保证线程独立
        ThreadLocalMap map = getMap(t);
        if (map != null)   //threadLocal对象为key,值为value
            map.set(this, value);  //内部为数组，可以支持多个threadLocal对象
        else
            createMap(t, value);
    }
  	ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
    }
}
class	Thread{
   ThreadLocal.ThreadLocalMap threadLocals = null;
}
```

> ThreadLocalMap为数组实现，通过threaLocal对象hash来定位索引位置，数据元素为Entry，Entry继承自WeakReference并维护了value值

# 为什么Entry要使用WeakReference

```java
    static class Entry extends WeakReference<ThreadLocal<?>> {
            /** The value associated with this ThreadLocal. */
            Object value;

            Entry(ThreadLocal<?> k, Object v) {
                super(k);
                value = v;
            }
    }
```

> 
> WeakReference是Java语言规范中为了区别直接的对象引用（程序中通过构造函数声明出来的对象引用）而定义的另外一种引用关系。WeakReference标志性的特点是：reference实例不会影响到被应用对象的GC回收行为（即只要对象被除WeakReference对象之外所有的对象解除引用后，该对象便可以被GC回收），只不过在被对象回收之后，reference实例想获得被应用的对象时程序会返回null。
> 

WeakReference对应用的对象threadLocal是弱引用，不会影响到threadLocal的GC行为。如果是强引用的话，在线程运行过程中，我们不再使用threadLocal了，将threadLocal置为null，但threadLocal在线程的ThreadLocalMap里还有引用，导致其无法被GC回收（当然，可以等到线程运行结束后，整个Map都会被回收，但很多线程要运行很久，如果等到线程结束，便会一直占着内存空间）。而Entry声明为WeakReference，threadLocal置为null后，线程的threadLocalMap就不算强引用了，threadLocal就可以被GC回收了。map的后续操作中，也会逐渐把对应的"stale entry"清理出去，避免内存泄漏。所以，我们在使用完ThreadLocal变量时，尽量用threadLocal.remove()来清除，避免threadLocal=null的操作。前者remove()会同时清除掉线程threadLocalMap里的entry，算是彻底清除；而后者虽然释放掉了threadLocal，但线种threadLocalMap里还有其"stale entry"，后续还需要处理。

# ThreadLocal注意事项

ThreadLocal对象通常用于防止对可变的单实例变量或全局变量进行共享。例如：由于JDBC的连接对象不是线程安全的，因此，当多个线程应用程序在没有协同的情况下，使用全局变量时，就是线程不安全的。通过将JDBC的连接对象保存到ThreadLocal中，每个线程都会拥有自己的连接对象副本。
    
ThreadLocal在Spring的事物管理，包括Hibernate管理等都有出现，在web开发中，有事会用来管理用户回话HttpSession，web交互这种典型的一请求一线程的场景似乎比较适合使用ThreadLocal，但是需要注意的是，由于此时session与线程关联，而Tomcat这些web服务器多采用线程池机制，也就是说线程是可以复用的，所以在每次进入的时候都需要重新进行set操作，或者使用完毕以后及时remove掉！

# ThreadLocal在Spring事务中的运用

[Spring基于ThreadLocal的"资源-事务"](https://blog.csdn.net/bluishglc/article/details/7784502)