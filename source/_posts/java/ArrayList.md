---
title: ArrayList源码阅读
date: 2019-03-06
categories:
- java
tags:
- java
---


# ArrayList可变长动态数组

继承自AbstractList，实现了`List<E>, RandomAccess, Cloneable, java.io.Serializable`接口

ArrayList 继承了AbstractList，实现了List。它是一个数组队列，提供了相关的添加、删除、修改、遍历等功能。
ArrayList 实现了RandmoAccess接口，即提供了随机访问功能。RandmoAccess是java中用来被List实现，为List提供快速访问功能的。在ArrayList中，我们即可以通过元素的序号快速获取元素对象；这就是快速随机访问。
ArrayList 实现了Cloneable接口，即覆盖了函数clone()，能被克隆。
ArrayList 实现java.io.Serializable接口，这意味着ArrayList支持序列化，能通过序列化去传输。

和Vector不同，ArrayList中的操作不是线程安全的！所以，建议在单线程中才使用ArrayList，而在多线程中可以选择Vector或者CopyOnWriteArrayList

<!--more-->

## 复杂度分析

- <p>The <tt>size</tt>, <tt>isEmpty</tt>, <tt>get</tt>, <tt>set</tt>,<tt>iterator</tt>, and <tt>listIterator</tt> operations run in constant time（常数时间），时间复杂度O(1)

- add 分摊时间复杂度为O(1)，means adding n elements requires O(n) time

- 其他方法一般线性复杂度

## 源码分析

- modCount

这是AbstractList的一个属性，记录list结构改变（大小的改变）的次数，否则迭代过程中可能出现错误，迭代过程中会对这个变量进行检查，如果不符，则抛出异常throw new ConcurrentModificationException();
常见错误示范

```java
public class TestArrayListIterator {
    public static void main(String[] args)  {
        ArrayList<Integer> list = new ArrayList<Integer>();
        list.add(10);
        Iterator<Integer> iterator = list.iterator();
        while(iterator.hasNext()){
            Integer integer = iterator.next();
            if(integer==10)
                list.remove(integer);   //Cause Exception
        }
    }
}

```

- 属性分析

```java

public class ArrayList<E> extends AbstractList<E> implements List<E>, RandomAccess, Cloneable, Serializable {  
    // 序列化id  
    private static final long serialVersionUID = 8683452581122892189L; 
    // 默认初始容量  
    private static final int DEFAULT_CAPACITY = 10;  
    // 用于空实例的共享空数组实例  
    private static final Object[] EMPTY_ELEMENTDATA ={};
    // 存储arraylist元素的数组缓冲区
    private static final Object[] elementData;  
    // 当前数组长度  
    private int size; 
    //数组的最大尺寸，有些虚拟机在数组中存储一些数据头
    private static final int MAX_ARRAY_SIZE = Integer.MAX_VALUE - 8; 
}  

```

- 数组复制方法介绍


Arrays.copyOf方法
| original | 要复制的数组 | 
| newLength | 要返回的副本的长度 | 
| newType | 要返回的副本的类型 |

```java

    public static <T,U> T[] copyOf(U[] original, int newLength, Class<? extends T[]> newType) {
        T[] copy = ((Object)newType == (Object)Object[].class)
            ? (T[]) new Object[newLength]
            : (T[]) Array.newInstance(newType.getComponentType(), newLength);
        System.arraycopy(original, 0, copy, 0,
                         Math.min(original.length, newLength));
        return copy;
    }

```

System.arraycopy 方法,这是一个本地方法

| 参数 | 说明 |
| src	| 原数组 |
| srcPos | 原数组的起始位置 |
| dest	| 目标数组 |
| destPos | 目标数组的起始位置 |
| length | 要复制的数组元素的数目 |

```java
  public static native void arraycopy(Object src,  int  srcPos,
                                        Object dest, int destPos,
                                        int length);

```

- 构造函数

```java

 public ArrayList() {
        super();
        this.elementData = EMPTY_ELEMENTDATA;
    }

```

另外，还可以通过指定数组容量和利用其他指定容器来初始化

- add方法

```java
    //先保证容量（扩容），再复制
   public boolean add(E e) {
        ensureCapacityInternal(size + 1);  // Increments modCount!!
        //最后元素的索引为size-1，所以先复制后自增
        elementData[size++] = e;
        return true;
    }
    
    //miniCapacity是需要所有元素所需的最小空间
    private void ensureCapacityInternal(int minCapacity) {
        //如果用空构造函数初始化ArrayList,那么elementData =      //EMPTY_ELEMENTDATA,那么我们可以看到在第一次add的时候minCapacity值为//0（类定义中的属性若不赋予初值，则JAVA会自动赋予这个属性一个默认值，整形//默认值为0），随后被设为 DEFAULT_CAPACITY（值为10）
        if (elementData == EMPTY_ELEMENTDATA) {
            minCapacity = Math.max(DEFAULT_CAPACITY, minCapacity);
        }

        ensureExplicitCapacity(minCapacity);
    }

    //数组需要的最小长度大于当前数组的长度，则需要扩容
    private void ensureExplicitCapacity(int minCapacity) {
        modCount++;
        // overflow-conscious code
        if (minCapacity - elementData.length > 0)
            grow(minCapacity);
    }

    
    private void grow(int minCapacity) {
        // overflow-conscious code
        int oldCapacity = elementData.length;
        //先扩容0.5倍，新数组容量为旧数组容量的1.5倍，此处newCapacity可能为负值
        int newCapacity = oldCapacity + (oldCapacity >> 1);
        //若新数组容量仍然小于所需最小容量，则新容量设为所需最小容量
        if (newCapacity - minCapacity < 0)
            newCapacity = minCapacity;
        //如果新容量大于最大数组容量时，新容量设为最大尺寸
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        // minCapacity is usually close to size, so this is a win:
        //调用System.arraycopy，这是一个native方法，使用内存复制
        elementData = Arrays.copyOf(elementData, newCapacity);
    }

    private static int hugeCapacity(int minCapacity) {
        //Integer.MAX_VALUE+1 = -2147483648
        //数组长度超出Int最大值
        if (minCapacity < 0) // overflow
            throw new OutOfMemoryError();
        return (minCapacity > MAX_ARRAY_SIZE) ?
            Integer.MAX_VALUE :
            MAX_ARRAY_SIZE;
    }

```

定量扩容 **or** 增倍扩容

采用定量扩容，一次扩容m,增加n个数（n>>m）,一次扩容时间复杂度O(n)，扩容n/m次，分摊时间复杂度为O(n^2)

增倍扩容，一次扩容n+n>>2 ,分摊时间复杂度O(1)

- clone方法

实现浅拷贝(shallow copy)，集合元素本身并没有被复制,这意味着存储在原有List和克隆List中的对象会保持一致，并指向Java堆中同一内存地址

```java
  public Object clone() {
        try {
            @SuppressWarnings("unchecked")
                ArrayList<E> v = (ArrayList<E>) super.clone();
            v.elementData = Arrays.copyOf(elementData, size);
            v.modCount = 0;
            return v;
        } catch (CloneNotSupportedException e) {
            // this shouldn't happen, since we are Cloneable
            throw new InternalError();
        }
    }

```

Object对象的clone方法实现的都是浅拷贝，Object.clone会产生一个新对象，两个对象的内存地址不一样，对于基本数据类型（String除外）会拷贝一份新的，而对于String和对象属性则会拷贝的引用，**两个属性指向同一块地址空间，改动其中一个会改变另外一个的值**，这种叫做浅拷贝，Java中都是浅拷贝，要想实现深拷贝必须重写Object中的clone方法（属性对象也必须重写cloen方法）

- get方法

```java

    public E get(int index) {
        rangeCheck(index);

        return elementData(index);
    }  

    private void rangeCheck(int index) {
        if (index >= size)
            throw new IndexOutOfBoundsException(outOfBoundsMsg(index));
    }
 
    E elementData(int index) {
        return (E) elementData[index];
    }

```

- set方法

```java
    public E set(int index, E element) {
        rangeCheck(index);

        E oldValue = elementData(index);
        elementData[index] = element;
        return oldValue;
    }

```

- remove方法

根据索引来删除数据

```java

   public E remove(int index) {
        rangeCheck(index);

        modCount++;
        E oldValue = elementData(index);

        int numMoved = size - index - 1;  //需要移动的元素个数
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work

        return oldValue;
    }

```

删除指定对象

```java
     public boolean remove(Object o) {
        if (o == null) {
            for (int index = 0; index < size; index++)
                if (elementData[index] == null) {
                    fastRemove(index);
                    return true;
                }
        } else {
            for (int index = 0; index < size; index++)
                if (o.equals(elementData[index])) {
                    fastRemove(index);
                    return true;
                }
        }
        return false;
    }

    //和remove方法区别在于不检验index的合法性，无返回值这里index由for循环产生，//一定是合法的
    private void fastRemove(int index) {
        modCount++;
        int numMoved = size - index - 1;
        if (numMoved > 0)
            System.arraycopy(elementData, index+1, elementData, index,
                             numMoved);
        elementData[--size] = null; // clear to let GC do its work
    }

```

> addAll,removeRange等都是通过数组拷贝的原理实现，这里就不赘述了

- batchRemove方法

//complement为true时，删除除C包含的元素以外的所有元素，false删除C中包含的元素

```java
private boolean batchRemove(Collection<?> c, boolean complement) {
        final Object[] elementData = this.elementData;
        int r = 0, w = 0;
        boolean modified = false;
        try {
            for (; r < size; r++)
                if (c.contains(elementData[r]) == complement)
                    elementData[w++] = elementData[r];
        } finally {
            // Preserve behavioral compatibility with AbstractCollection,
            // even if c.contains() throws.
            if (r != size) {
                System.arraycopy(elementData, r,
                                 elementData, w,
                                 size - r);
                w += size - r;
            }
            if (w != size) {
                // clear to let GC do its work
                for (int i = w; i < size; i++)
                    elementData[i] = null;
                modCount += size - w;
                size = w;
                modified = true;
            }
        }
        return modified;
    }

```

- subList

创建了一个ArrayList类中内部类SubList对象，传入的值中第一个参数时this参数，其实可以理解为返回当前list的部分视图，真实指向的存放数据内容的地方还是同一个地方，如果修改了sublist返回的内容的话，那么原来的list也会变动。

```

    public List<E> subList(int fromIndex, int toIndex) {
            subListRangeCheck(fromIndex, toIndex, size);
            return new SubList(this, offset, fromIndex, toIndex);
        }

```

- readObject和writeObjec

实现java.io.Serializable了接口。
Java 提供了一种对象序列化的机制，该机制中，一个对象可以被表示为一个字节序列，该字节序列包括该对象的数据、有关对象的类型的信息和存储在对象中数据的类型。
将序列化对象写入文件之后，可以从文件中读取出来，并且对它进行反序列化，也就是说，对象的类型信息、对象的数据，还有对象中的数据类型可以用来在内存中新建对象。
整个过程都是 Java 虚拟机（JVM）独立的，也就是说，在一个平台上序列化的对象可以在另一个完全不同的平台上反序列化该对象。

## 线程不安全性分析

- 情形一

ArrayList的方法没有通过synchronized关键词进行修饰，所有多线程进行修改操作时可能发生异常。以add放大举例，多个线程可能同时执行ensureCapacityInternal方法，多个线程可能拿到相同的size做比较，而执行到elemntData[size++] = e时却又有先后顺序，而此时恰好数组空间又不够，就会发生常见的数组越界异常java.lang.ArrayIndexOutOfBoundsException

- 情形二

modCount也是Java用来判断List在迭代过程中，是否发生修改

```java
  final void checkForComodification() {
            if (modCount != expectedModCount)
                throw new ConcurrentModificationException();
        }
```

- 情形三

以上是程序运行中会触发异常的情形，而线程不安全最可怕之处不在于发生异常，而在于什么异常都没有，但是程序运行的结果并不是我们想要的。

设想情形一中多线程拿到相同的size，而进行elemntData[size++] = e的时候,
size++也并不是原子性操作，编译器会解析成size = size+1 ,包含加法运算和赋值运算两种操作，所以也是线程不安全的（为保证线程安全性可使用AtomicInteger类的实例方法incrementAndGet）。那么就有可能多线程执行size++操作时最后size出现漏加的情况且相同size后执行的线程将前一个线程的数组复制操作覆盖掉，从而出现原本add进数组的元素被覆盖了。

- 情形四

我们写一个测试案例，代码如下

```java
public class ArrayTest {

    public static int size;
    public static final Object[] elementData = new Object[25];

    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            new Thread() {
                @Override
                public void run() {
                    for (int j = 0; j < 5; j++) {
                        ArrayTest.add(j); //
                    }
                }
            }.start();
        }
        printArray();

    }

    public static boolean add(int e) {
        elementData[size++] = e;
        return true;
    }

    public static void printArray(){
        for (int i=0;i<elementData.length;i++) {
            System.out.print(elementData[i]+"\t");
        }
        System.out.println("\n");
    }

}

```
正常输入应该是什么呢，5个线程，每个线程add(0-4)，总输出共25个数

那么实际结果呢

> null	0	0	0	0	1	2	3	4	1	2	3	4	1	2	3	4	1	2	3	4	1	2	3	4

为什么只有四个0，输出一个null呢？

分析，不同线程同时执行了size++操作，而没有进行赋值操作，然后两个线程同时在size=2的时候进行了赋值操作，导致其中一个线程的add操作被忽略了，而index=1的位置却没有进行赋值操作，如果这是实际应用中用户的某个添加动作，那么这将是一个非常严重的问题


## 总结

ArrayList源码的分析就到此位置了，其底层是基于普通数组的，所以和数组拥有相同的属性，读取时间复杂度低，插入复杂度高，是线程不安全的

