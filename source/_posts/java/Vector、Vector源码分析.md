---
title: Vector、Stack源码分析
date: 2019-03-07
categories:
- java
tags:
- java
---

 # Vector、Stack源码分析及Synchronized实现原理分析

## Vector

Vector继承自AbstractList，实现了List,RandowAccess,Cloneable,Serializable接口，是ArrayList在多线程下的替代选择。Vector大部分方法都与ArrayList实现相同，不同的是需要同步的方法都使用了`synchronized` 关键词进行修饰，所有是同步的。

<!--more-->

```java
 /** 按索引顺序返回vector元素列表
 */
   public Enumeration<E> elements() {
        return new Enumeration<E>() {
            int count = 0;

            public boolean hasMoreElements() {
                return count < elementCount;
            }

            public E nextElement() {
                synchronized (Vector.this) {
                    if (count < elementCount) {
                        return elementData(count++);
                    }
                }
                throw new NoSuchElementException("Vector Enumeration");
            }
        };
    }
```

### Vector和ArrayList区别

| Vector                            | ArrayList              |
| --------------------------------- | ---------------------- |
| 同步、线程安全的                          | 异步、线程不安全               |
| 需要开销维持同步锁，性能低                     | 性能高                    |
| 可以使用Iterator、foreach、Enumration迭代 | 可以使用Iterator、foreach迭代 |
| 容量2倍增长                            | 容量1.5倍增长               |

> 在线程安全不是必须的情况下，尽量使用ArrayList，vector对诸如 `get` 等获取属性的方法都添加了synchronized关键词进行修饰，所以性能会大受影响



## Stack

栈是一种先进后出的数据结构，JAVA API中提供了基于Vector的栈的实现Stack。

```java
public class Stack<E> extends Vector<E>
```

Stack是继承自Vector的，所有本质也是数组实现，线程安全的，下面我们看下Stack实现的独有的几个方法

```java
 	/** 向数组末尾追加元素，push方法本身没有加同步，但是addElement方法是Synchronized修饰的
 	*/
   public E push(E item) {
        addElement(item);

        return item;
    }

   /**移除栈顶元素并返回
   */
    public synchronized E pop() {
        E       obj;
        int     len = size();

        obj = peek();
        removeElementAt(len - 1);

        return obj;
    }

    /**
     * 获取栈顶元素(不移除)
     */
    public synchronized E peek() {
        int     len = size();

        if (len == 0)
            throw new EmptyStackException();
        return elementAt(len - 1);
    }

    /**
     * Tests if this stack is empty.
     */
    public boolean empty() {
        return size() == 0;
    }

    /**
     * 返回元素在栈中的位置，栈顶(数组末尾)返回1，如果栈中不存在返回-1
     */
    public synchronized int search(Object o) {
        int i = lastIndexOf(o);

        if (i >= 0) {
            return size() - i;
        }
        return -1;
    }
```

## 总结

ArrayList、Vector和Stack都是基于数组实现的，所以查找复杂度较低，插入复杂度较高，前者是线程不安全的，后者是线程安全的，开发中优先使用ArrayList。

## Synchronized

Synchronized是Java中解决并发问题的一种最常用的方法，也是最简单的一种方法。Synchronized的作用主要有三个：（1）确保线程互斥的访问同步代码（2）保证共享变量的修改能够及时可见（3）有效解决重排序问题。从语法上讲，Synchronized总共有三种用法：
1. 修饰普通方法
2. 修饰静态方法
3. 修饰代码块

###  修饰普通方法(对象同步)

多线程中同一对象同时调用普通方法时，后调用的线程需要等先调用的线程运行完成释放锁后才能执行。由于是在对象层面加锁，所以不同的对象可以同时调用普通方法(其实方法本身就是独立的，并不会受多线程影响)

### 修饰静态方法(类同步)

对静态方法的同步本质上是对类的同步（静态方法本质上是属于类的方法，而不是对象上的方法），所以即使属于同一类的不同实例对象对同一方法的调用，也只能顺序的执行，不能并发执行

### 修饰代码块

代码块的修饰又分为三种形式，前面两种需要拿到对象锁，最后一种需要拿到类锁
- synchronized (this){}
- synchronized (非this对象){}
- synchronized (类.class){}

### 使用总结

不管什么形式的锁，执行同步方法（或代码块时），需要先拿到对应的对象锁或者类锁，对象锁和类锁间是独立的。

### 原理分析

Sychronized代码块同步在JVM中通过`monitorenter` 和 `monitorexit` 指令实现

每个对象有一个监视器锁（monitor）。当monitor被占用时就会处于锁定状态，线程执行monitorenter指令时尝试获取monitor的所有权，过程如下：
1. 如果monitor的进入数为0，则该线程进入monitor，然后将进入数设置为1，该线程即为monitor的所有者。

2. 如果线程已经占有该monitor，只是重新进入，则进入monitor的进入数加1.

3. 如果其他线程已经占用了monitor，则该线程进入阻塞状态，直到monitor的进入数为0，再重新尝试获取monitor的所有权。

执行monitorexit的线程必须是objectref所对应的monitor的所有者。
指令执行时，monitor的进入数减1，如果减1后进入数为0，那线程退出monitor，不再是这个monitor的所有者。其他被这个monitor阻塞的线程可以尝试去获取这个monitor的所有权。

通过这两段描述，我们应该能很清楚的看出Synchronized的实现原理，Synchronized的语义底层是通过一个monitor的对象来完成，其实wait/notify等方法也依赖于monitor对象，这就是为什么只有在同步的块或者方法中才能调用wait/notify等方法，否则会抛出java.lang.IllegalMonitorStateException的异常的原因。 

方法的同步并没有通过指令monitorenter和monitorexit来完成（理论上其实也可以通过这两条指令来实现），不过相对于普通方法，其常量池中多了ACC_SYNCHRONIZED标示符。JVM就是根据该标示符来实现方法的同步的：当方法调用时，调用指令将会检查方法的ACC_SYNCHRONIZED访问标志是否被设置，如果设置了，执行线程将先获取monitor，获取成功之后才能执行方法体，方法执行完后再释放monitor。在方法执行期间，其他任何线程都无法再获得同一个monitor对象。 其实本质上没有区别，只是方法的同步是一种隐式的方式来实现，无需通过字节码来完成。

![Synchronized参考](http://www.cnblogs.com/paddix/p/5367116.html)
