---
title: LinkedList源码阅读
date: 2019-03-05
categories:
- java
tags:
- java
---

# LinkedList源码阅读

## 简介

- LinkedList继承自AbstractSequentialList

- 实现了List,Deque,Cloneable,Serializable接口

- LinkedList同时实现了List接口和Deque接口，也就是说它既可以看作一个顺序容器（List），又可以看作一个双端队列（Queue），同时又可以看作一个栈（Stack）。

- LinkedList是线程不安全的。

## 结构实现

![](http://ohyqvzpmb.bkt.clouddn.com/LinkedList.jpg)

> 图片引用自[知乎专栏](https://zhuanlan.zhihu.com/p/24730576)

LinkedList底层通过双向链表实现

链表中每个节点用Node表示，每个节点持有对上一个节点和下一个节点的引用

```java

    private static class Node<E> {
        E item;
        Node<E> next;
        Node<E> prev;

        Node(Node<E> prev, E element, Node<E> next) {
            this.item = element;
            this.next = next;
            this.prev = prev;
        }
    }

```

## 属性剖析

```java

    transient int size = 0;

    /**
     * Pointer to first node.
     * Invariant: (first == null && last == null) ||
     *            (first.prev == null && first.item != null)
     */
    transient Node<E> first;

    /**
     * Pointer to last node.
     * Invariant: (first == null && last == null) ||
     *            (last.next == null && last.item != null)
     */
    transient Node<E> last;

```

这里有个在java中非常重要的关键字**transient** 

官网解释：

Variables may be marked transient to indicate that they are not part of the persistent state of an object.  

翻译过来就是，变量需要标记为transient以指示它们不是一个对象的持久化状态的一部分

大白话就是如果一个对象实现了Serilizable接口，那么这个对象就可以被序列化，java的这种序列化模式为开发者提供了很多便利，我们可以不必关系具体序列化的过程，只要这个类实现了Serilizable接口，这个类的所有属性和方法都会自动序列化。然而在实际开发过程中，我们常常会遇到这样的问题，这个类的有些属性需要序列化，而其他属性不需要被序列化，打个比方，如果一个用户有一些敏感信息（如密码，银行卡号等），为了安全起见，不希望在网络操作（主要涉及到序列化操作，本地序列化缓存也适用）中被传输，这些信息对应的变量就可以加上transient关键字。换句话说，这个字段的生命周期仅存于调用者的内存中而不会写到磁盘里持久化。

> 总结来讲分为三点
(1）一旦变量被transient修饰，变量将不再是对象持久化的一部分，该变量内容在序列化后无法获得访问。
(2）transient关键字只能修饰变量，而不能修饰方法和类。本地变量(局部变量)是不能被transient关键字修饰的。变量如果是用户自定义类变量，则该类需要实现Serializable接口。
(3）被transient关键字修饰的变量不再能被序列化，一个静态变量不管是否被transient修饰，均不能被序列化。

一个静态变量不管是否被transient修饰，均不能被序列化，反序列化后类中static型变量可能有值，值为当前JVM中对应static变量的值，这个值是JVM中的不是反序列化得出的，也就是说如果在序列化后和反序列化前改变静态变量的值，那么反序列化得到的静态变量与改变后的值相同。

在Java中，对象的序列化可以通过实现两种接口来实现，若实现的是Serializable接口，则所有的序列化将会自动进行，若实现的是Externalizable接口，则没有任何东西可以自动序列化，需要在writeExternal方法中进行手工指定所要序列化的变量，这与是否被transient修饰无关。

参考博客，源博客有更加详细的介绍，[传送门](http://www.cnblogs.com/lanxuezaipiao/p/3369962.html)

## 方法剖析

1. linkFirst，linkLast，linkBefore

复杂度分析：常数复杂度O(1)

```java

 private void linkFirst(E e) {
        final Node<E> f = first;
        final Node<E> newNode = new Node<>(null, e, f);
        first = newNode;
        if (f == null)
            last = newNode;
        else
            f.prev = newNode;
        size++;
        modCount++;
    }

```

将头节点指向新节点，以前的头节点的前向节点指向新节点



2. unlinkFirst，unlinkLast，unlink

复杂度分析：常数复杂度O(1)

从容器中拿出相应的元素，并返回相应节点的值，这几个方法都是私有的，抽象出来的常见操作，在复杂节点中复用的方法

3. getFirst,getLast

得到相应的节点值，但节点还保留在容器中

4. add 本质就是 linkLast 

5. remove(Object o) 

复杂度分析：线性复杂度O(n)

```java

    public boolean remove(Object o) {
        //分为两种情况，分别进行迭代处理
        if (o == null) {
            for (Node<E> x = first; x != null; x = x.next) {
                if (x.item == null) {
                    unlink(x);
                    return true;
                }
            }
        } else {
            for (Node<E> x = first; x != null; x = x.next) {
                if (o.equals(x.item)) {
                    unlink(x);
                    return true;
                }
            }
        }
        return false;
    }

```

6. addAll

线性复杂度O(n)

```java

 public boolean addAll(int index, Collection<? extends E> c) {
        checkPositionIndex(index);  //检查索引是否存在

        Object[] a = c.toArray();
        int numNew = a.length;
        if (numNew == 0)
            return false;     //c为空，直接返回false

        Node<E> pred, succ;
        if (index == size) {
            succ = null;
            pred = last;
        } else {
            succ = node(index);   //找到插入点位置
            pred = succ.prev;
        }

        for (Object o : a) {
            @SuppressWarnings("unchecked") E e = (E) o;
            Node<E> newNode = new Node<>(pred, e, null);
            if (pred == null)
                first = newNode;
            else
                pred.next = newNode;
            pred = newNode;
        }

        if (succ == null) {
            last = pred;
        } else {
            pred.next = succ;
            succ.prev = pred;
        }

        size += numNew;
        modCount++;
        return true;
    }


  
     Node<E> node(int index) {
        // assert isElementIndex(index);
        //这里有个细节，由于LinkedList是双向链表，所以可以从两边开始遍历，先判断索引在前半部分还是后半部分
        if (index < (size >> 1)) { 
            Node<E> x = first;
            for (int i = 0; i < index; i++)
                x = x.next;
            return x;
        } else {
            Node<E> x = last;
            for (int i = size - 1; i > index; i--)
                x = x.prev;
            return x;
        }
    }


```

7. clone

LinkedList的克隆方法也是浅复制

8. pop和push，offerFirst和offerLast,peek和poll

可以用作stack

```java

     public boolean offerFirst(E e) {
        addFirst(e);
        return true;
    }

    public boolean offerLast(E e) {
        addLast(e);
        return true;
    }

    public void push(E e) {
        addFirst(e);
    }

    public E pop() {
        return removeFirst();
    }


    public E peek() {
        final Node<E> f = first;
        return (f == null) ? null : f.item;
    }
    
    public E poll() {
        final Node<E> f = first;
        return (f == null) ? null : unlinkFirst(f);
    }


```

## 不安全分析

和ArrayList一样，LinkedLsit通过modcount来对list的改变进行技术，在迭代过程中会引发ConcurrentModificationException异常，LinkedList的所有方法都没有进行线程同步控制