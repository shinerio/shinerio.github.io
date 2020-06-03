---
title: Redis源码解析——redisObject
date: 2020-05-18
categories:
- C/C++
tags:
- C/C++
---

redis是一个key-value存储系统，其中key类型一般为字符串，而value类型则为redis对象。Redis对象可以绑定各种类型的数据，如string、hash、list、set和zset。redisObejct在redis.h中定义。

<!---more-->

## 1. 定义

```c
//使用了位域，unsigned等价于unsigned int，type、encoding和lru共占用4字节
typedef struct redisObject {
    // 类型，string/hash/list/set/zset
    unsigned type:4;
    // 编码
    unsigned encoding:4;
    // 对象最后一次被访问的时间，当内存紧张，淘汰数据时使用
    // lru time (relative to server.lruclock) */
    unsigned lru:REDIS_LRU_BITS;  //#define REDIS_LRU_BITS 24
    // 引用计数
    int refcount;
    // 指向实际值的指针
    void *ptr;
} robj;
```

### 1.1 type

redisObject共有以下5种类型，type占4bit（理论支持2^4=16种）

```c
/* Object types */
// 对象类型
#define REDIS_STRING 0
#define REDIS_LIST 1
#define REDIS_SET 2
#define REDIS_ZSET 3
#define REDIS_HASH 4
```

### 1.2 encoding

redisObject共有以下9种编码类型，占用4bit，如“12345”既可以用字符串编码，也可能被存储为一个整数。

```c
/* Objects encoding. Some kind of objects like Strings and Hashes can be internally represented in multiple ways. The 'encoding' field of the object is set to one of this fields for this object. */
// 对象编码
#define REDIS_ENCODING_RAW 0     /* Raw representation */
#define REDIS_ENCODING_INT 1     /* Encoded as integer */
#define REDIS_ENCODING_HT 2      /* Encoded as hash table */
#define REDIS_ENCODING_ZIPMAP 3  /* Encoded as zipmap */
#define REDIS_ENCODING_LINKEDLIST 4 /* Encoded as regular linked list */
#define REDIS_ENCODING_ZIPLIST 5 /* Encoded as ziplist */
#define REDIS_ENCODING_INTSET 6  /* Encoded as intset */
#define REDIS_ENCODING_SKIPLIST 7  /* Encoded as skiplist */
#define REDIS_ENCODING_EMBSTR 8  /* Embedded sds string encoding */
```

| 编码类型                | 底层实现                           |
| ----------------------- | ---------------------------------- |
| OBJ_ENCODING_RAW        | 简单动态字符串sds                  |
| OBJ_ENCODING_INT        | long类型的整数                     |
| OBJ_ENCODING_HT         | 字典dict                           |
| OBJ_ENCODING_LINKEDLIST | 双端队列sdlist                     |
| OBJ_ENCODING_ZIPLIST    | 压缩列表ziplist                    |
| OBJ_ENCODING_INTSET     | 整数集合intset                     |
| OBJ_ENCODING_SKIPLIST   | 跳跃表skiplist和字典dict           |
| OBJ_ENCODING_EMBSTR     | EMBSTR编码的简单动态字符串sds      |
| OBJ_ENCODING_QUICKLIST  | 由双端链表和压缩列表构成的快速列表 |

redis的每一种对象类型可以对应不同的编码方式，极大地提高了redis的灵活性和效率。Redis可以根据不同场景来选择合适的编码方式。

| 对象类型   | 编码方式                                                     |
| ---------- | ------------------------------------------------------------ |
| OBJ_STRING | OBJ_ENCODING_RAW ,OBJ_ENCODING_INT ,OBJ_ENCODING_EMBSTR      |
| OBJ_LIST   | OBJ_ENCODING_LINKEDLIST ,OBJ_ENCODING_ZIPLIST ,OBJ_ENCODING_QUICKLIST |
| OBJ_SET    | OBJ_ENCODING_INTSET ,OBJ_ENCODING_HT                         |
| OBJ_ZSET   | OBJ_ENCODING_ZIPLIST ,OBJ_ENCODING_SKIPLIST                  |
| OBJ_HASH   | OBJ_ENCODING_ZIPLIST ,OBJ_ENCODING_HT                        |

### 1.3 lru

lru用来表示该对象最后一次被访问的时间，其占用24个bit位。Redis对数据集占用内存大小有实时计算，当超出限额时，会淘汰超时的数据。

### 1.4 refcount

引用计数，一个 Redis 对象可能被多个指针引用。C语言不具备自动内存回收机制，所以Redis对每一个对象设定了引用计数refcount字段，程序通过该字段的信息，在适当的时候自动释放内存进行内存回收。此功能与C++的智能指针相似。当需要增加或者减少引用的时候，必须调用相应的函数，相应实现在object.c中。

- 当创建一个对象时，其引用计数初始化为1；
- 当这个对象被一个新程序使用时，其引用计数加1；
- 当这个对象不再被一个程序使用时，其引用计数减1；
- 当引用计数为0时，释放该对象，回收内存。

```c
/*
 * 为对象的引用计数增一
 */
void incrRefCount(robj *o) {
    o->refcount++;
}

/*
 * 为对象的引用计数减一
 * 当对象的引用计数降为 0 时，释放对象。
 */
void decrRefCount(robj *o) {

    if (o->refcount <= 0) redisPanic("decrRefCount against refcount <= 0");

    // 释放对象
    if (o->refcount == 1) {
        switch(o->type) {
        case REDIS_STRING: freeStringObject(o); break;
        case REDIS_LIST: freeListObject(o); break;
        case REDIS_SET: freeSetObject(o); break;
        case REDIS_ZSET: freeZsetObject(o); break;
        case REDIS_HASH: freeHashObject(o); break;
        default: redisPanic("Unknown object type"); break;
        }
        zfree(o);
    // 减少计数
    } else {
        o->refcount--;
    }
}
```

!!! note ""
    因为redis是单进程单线程工作的，所以增加/减少引用的操作不必要保证原子性。

### 1.5 ptr

空类型指针，意味着可以指向任何类型的数据，用来存储真正的数据。

## 2. 主要方法

操作redisObject的主要方法在object.c中，主要包括以下函数。

```c
robj *createObject(int type, void *ptr); // 创建对象，设定其参数
robj *createStringObject(const char *ptr, size_t len); // 创建字符串对象
robj *createRawStringObject(const char *ptr, size_t len); // 创建简单动态字符串编码的字符串对象
robj *createEmbeddedStringObject(const char *ptr, size_t len); // 创建EMBSTR编码的字符串对象
robj *createStringObjectFromLongLong(long long value); // 根据传入的longlong整型值，创建一个字符串对象
robj *createStringObjectFromLongDouble(long double value, int humanfriendly); // 根据传入的long double类型值，创建一个字符串对象
robj *createQuicklistObject(void); // 创建快速链表编码的列表对象
robj *createZiplistObject(void); // 创建压缩列表编码的列表对象
robj *createSetObject(void); // 创建集合对象
robj *createIntsetObject(void); // 创建整型集合编码的集合对象
robj *createHashObject(void); // 创建hash对象
robj *createZsetObject(void); // 创建zset对象
robj *createZsetZiplistObject(void); //创建压缩列表编码的zset对象 
```

以下我们以字符串为例，展开介绍。

### 2.1 创建字符串

```c
#define REDIS_ENCODING_EMBSTR_SIZE_LIMIT 39
robj *createStringObject(char *ptr, size_t len) {
    //短字符使用特殊的EMBSTR编码
    if (len <= REDIS_ENCODING_EMBSTR_SIZE_LIMIT)
        return createEmbeddedStringObject(ptr,len);
    // 长字符采用RAW编码
    else
        return createRawStringObject(ptr,len);
}

// 创建一个 REDIS_ENCODING_RAW 编码的字符对象
// 对象的指针指向一个 sds 结构
robj *createRawStringObject(char *ptr, size_t len) {
    return createObject(REDIS_STRING,sdsnewlen(ptr,len));
}

// 创建一个 REDIS_ENCODING_EMBSTR 编码的字符对象
// 这个字符串对象中的 sds 会和字符串对象的 redisObject 结构一起分配
robj *createEmbeddedStringObject(char *ptr, size_t len) {
    robj *o = zmalloc(sizeof(robj)+sizeof(struct sdshdr)+len+1);
    //指向sdshdr
    struct sdshdr *sh = (void*)(o+1);

    o->type = REDIS_STRING;
    o->encoding = REDIS_ENCODING_EMBSTR;
    // 指向sdshdr中buf，实际存储数据地址
    o->ptr = sh+1;
    o->refcount = 1;
    o->lru = LRU_CLOCK();

    sh->len = len;
    sh->free = 0;
    if (ptr) {
        memcpy(sh->buf,ptr,len);
        sh->buf[len] = '\0';
    } else {
        memset(sh->buf,0,len+1);
    }
    return o;
}

//创建一个新 robj 对象
robj *createObject(int type,。 void *ptr) {
    robj *o = zmalloc(sizeof(*o));
    o->type = type;
    o->encoding = REDIS_ENCODING_RAW;
    o->ptr = ptr;
    o->refcount = 1;
    /* Set the LRU to the current lruclock (minutes resolution). */
    o->lru = LRU_CLOCK();
    return o;
}
```

!!! warning "RawString和EmbeddedString"区别
    RawString中robj和sdshdr是单独分配内存的，而EmbeddedString是一起分配内存的。EmbeddedString内存的申请和释放都只需要一次，连续的内存空间可以更好地利用缓存优势，缺点是Redis未提供修改EmbeddedString的方法。

### 2.2 字符串回收

```c
//释放字符串对象，这里只是释放了redisObject中ptr数据字段，整个redisObejct空间的释放在上文提到的decrRefCount方法中，当redisObject的引用计数为0时，会调用此方法
void freeStringObject(robj *o) {
    if (o->encoding == REDIS_ENCODING_RAW) {
        sdsfree(o->ptr);
    }
}
```

## 总结

- Redis使用RedisObject来统一表示各种数据类型，包括String/Set/Zset/List/Hash
- redis通过引用计数法表示对象生存状态，单进程单线程的工作原理使得引用计数的变化不需要保证原子性。

