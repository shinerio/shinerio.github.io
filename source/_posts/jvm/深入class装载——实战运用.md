---
title: 深入class装载——实战运用（一）
date: 2016-12-25 17:07:21
categories:
- JVM
tags:
- java
---

# 实例一(线程安全单例模式)

提起单例模式，你浅浅一笑，感觉手到擒来，这还不简单，大笔一挥

```java
public class SimpleSingleton {
	private SimpleSingleton(){}
	public static SimpleSingleton instance;
	public static SimpleSingleton getInstance(){
		if(instance==null){
			instance = new SimpleSingleton();
		}
		return instance;
	}
}
```

so easy！

等等，难道你就没发现什么问题？

这并不是个线程安全的方法，也就是会有多个线程同时进入if语句块。看到这，你心想，这还不简单，直接价格synchronized不就行了，没错，是这样的。

```java
public class SimpleSingleton {
	private SimpleSingleton(){}
	public static SimpleSingleton instance;
	public static synchronized SimpleSingleton getInstance(){
		if(instance==null){
		instance = new SimpleSingleton();
		}
		return instance;
	}
}
```
是的，你做到了线程安全，但是我们能不能更高级一点呢，这种方式其实是不高效的，因为在任何时候只有一个线程可以调用getInstance方法，而加锁只有在第一次创建对象时才需要。

那么你又想到了，可以使用双重检验锁

```java
public class SimpleSingleton {
	private SimpleSingleton(){}
	public static SimpleSingleton instance;
	public static SimpleSingleton getInstance(){
		if(instance==null){
			synchronized (SimpleSingleton.class) {
				if(instance==null){
					instance = new SimpleSingleton();
				}
			}
		}
		return instance;
	}
}
```

然而你会惊讶地发现这还是有问题的。

主要在于`instance = new SimpleSingleton()`这句，这并非是一个原子操作，事实上在 JVM 中这句话大概做了下面 3 件事情。

1. 给 instance 分配内存
2. 调用 SimpleSingleton的构造函数来初始化成员变量
3. 将instance对象指向分配的内存空间（执行完这步 instance 就为非 null 了）

但是在 JVM 的即时编译器中存在指令重排序的优化。也就是说上面的第二步和第三步的顺序是不能保证的，最终的执行顺序可能是 1-2-3 也可能是 1-3-2。如果是后者，则在 3 执行完毕、2 未执行之前，被线程二抢占了，这时 instance 已经是非 null 了（但却没有初始化），所以线程二会直接返回 instance，然后使用，然后顺理成章地报错。

进一步优化，我们只需要将 instance 变量声明成 volatile 就可以了。

```java
public class SimpleSingleton {
	private SimpleSingleton(){}
	public volatile static SimpleSingleton instance;
	public static SimpleSingleton getInstance(){
		if(instance==null){
			synchronized (SimpleSingleton.class) {
				if(instance==null){
			instance = new SimpleSingleton();
				}
			}
		}
		return instance;
	}
}
```

这里使用的并不是volatile的可见性，而是其另外一个特性：禁止指令重排序优化（Java 5之前是有问题的），也就是说，在 volatile 变量的赋值操作后面会有一个内存屏障（生成的汇编代码上），读操作不会被重排序到内存屏障之前。比如上面的例子，取操作必须在执行完 1-2-3 之后或者 1-3-2 之后，不存在执行到 1-3 然后取到值的情况。

看到这，你就会想，尼玛，一个小小的单例模式，居然这么复杂，你肯定不喜欢，那么重点来了，就用到我们上篇博客的知识了。

虚拟机对`<clinit>`函数调用会确保其线程安全性。使用静态内部类

```java
public class SimpleSingleton {
	private static class SingletonHolder{
		private static SimpleSingleton instance = new SimpleSingleton();
	}
	private SimpleSingleton(){}
	public static final SimpleSingleton getInstance(){
		return SingletonHolder.instance;
	}
}
```

调用getInstance方法时，虚拟机会去加载singletonHolder内部类，instance作为其静态成员赋值语句，JVM会保证其线程安全性。

这样的代码写出来是不是很优雅又很有逼格呢，所以下次别人让你写单例模式，果断用这个去提升自己的逼格吧