---
title: java锁
date: 2019-08-11
categories: 
- java
tags:
- java
---

# 可重入锁与不可重入锁

- 可重入锁

  同一个线程可以多次获得锁，可重复递归调用的且不发生死锁。如synchronized、ReentrantLock

- 不可重入锁

  同一个线程不可多次获得锁，再次尝试获得锁的时候会陷入死锁。

<!--more-->

# AQS(AbstractQueuedSynchronizer)

AQS使用一个int类型的成员变量state来表示同步状态，当state>0时表示已经获取了锁，当state=0时表示释放了锁，提供了`getState(),setState(int newState),compareAndSetState(int expect, int update)`来对同步状态state进行操作

## CLH同步队列

CLH同步队列是一个FIFO双向队列，AQS依赖它来完成同步状态的管理，当前线程如果获取同步状态失败时，AQS则会将当前线程已经等待状态等信息构造成一个节点（Node）并将其加入到CLH同步队列，同时会阻塞当前线程，当同步状态释放时，会把首节点唤醒（公平锁），使其再次尝试获取同步状态。在CLH同步队列中，一个节点表示一个线程，它保存着线程的引用（thread）、状态（waitStatus）、前驱节点（prev）、后继节点（next）

# ReentrantLock可重入的实现

```java
final void lock() {
  if (compareAndSetState(0, 1))   //CAS操作设置状态
    setExclusiveOwnerThread(Thread.currentThread());  //当前线程cas操作成功，设置锁被当前线程占用
  else 
    acquire(1);
}

public final void acquire(int arg) {
  if (!tryAcquire(arg) &&
      acquireQueued(addWaiter(Node.EXCLUSIVE), arg))  //拿不到锁就进入排队并进入自旋状态
    selfInterrupt();
}

final boolean nonfairTryAcquire(int acquires) {
  final Thread current = Thread.currentThread();
  int c = getState();
  if (c == 0) { 
    if (compareAndSetState(0, acquires)) {
      setExclusiveOwnerThread(current);
      return true;
    }
  }
  else if (current == getExclusiveOwnerThread()) {  //线程重入计数
    int nextc = c + acquires;
    if (nextc < 0) // overflow
      throw new Error("Maximum lock count exceeded");
    setState(nextc);  //这里不会出现并发
    return true;
  }
  return false;
}

final boolean acquireQueued(final Node node, int arg) {
  boolean failed = true;
  try {
    boolean interrupted = false;
    for (;;) {
      final Node p = node.predecessor();
      if (p == head && tryAcquire(arg)) {  // 前驱节点为头结点并且尝试拿到锁
        setHead(node);  // 设置自己为头结点
        p.next = null; // help GC
        failed = false;
        return interrupted;
      }
      if (shouldParkAfterFailedAcquire(p, node) &&
          parkAndCheckInterrupt())
        interrupted = true;
    }
  } finally {
    if (failed)
      cancelAcquire(node);
  }
}
```

# 分布式锁

1. 利用数据库行锁，需要自己考虑锁超时，加事务，局限于数据库，性能比较低效，不适合高并发场景。
2. Zookeeper

3. Redis

# 锁优化

 无锁状态->偏向锁状态->轻量级锁状态->重量级锁状态