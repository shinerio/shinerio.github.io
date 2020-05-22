---
title: Redis源码解析——动态字符串sds
date: 2020-05-22
categories:
- C/C++
tags:
- C/C++
- Redis

---

Redis没有使用C语言的字符串结构，而是自己设计了一个简单的动态字符串结构sds(simple dynamic string))。Redis中关于sds的实现主要在sds.c和sds.h中

<!--more-->

## 1. sds数据结构定义

```c
/*
 * 类型别名，用于指向 sdshdr 的 buf 属性
 */
typedef char *sds;

/*
 * 保存字符串对象的结构
 */
struct sdshdr {
    // buf 中已占用空间的长度
    int len;
    // buf 中剩余可用空间的长度
    int free;
    // 数据空间
    char buf[];
};
```

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200522165735.png)

buf[]为长度为0的数据，不占用内存，sizeof(struct sdshdr)返回8。使用char buf[]而不是char *buf，可以避免二次分配内存，同时buf[]不占用空间，也能节省内存。

## 2. sds创建函数

```c
sds sdsnewlen(const void *init, size_t initlen) {
    struct sdshdr *sh;
    // 根据是否有初始化内容，选择适当的内存分配方式
    // T = O(N)
    // calloc()会对分配的空间做初始化工作（初始化为0），而malloc()不会
    if (init)
        // zmalloc 不初始化所分配的内存
        sh = zmalloc(sizeof(struct sdshdr) + initlen + 1);
    } else {
        // zcalloc 将分配的内存全部初始化为0
        sh = zcalloc(sizeof(struct sdshdr) + initlen + 1);
    }

    // 内存分配失败，返回
    if (sh == NULL) return NULL;

    // 设置初始化长度，sds长度没有计算'\0'
    sh->len = initlen;
    // 新 sds 不预留任何空间
    sh->free = 0;
    // 如果有指定初始化内容，将它们复制到 sdshdr 的 buf 中
    // T = O(N)
    if (initlen && init)
        memcpy(sh->buf, init, initlen);
    // 以 \0 结尾
    sh->buf[initlen] = '\0';

    // 返回 buf 部分，而不是整个 sdshdr
    return (char *) sh->buf;
}
```

## 3. sds释放函数

```c
void sdsfree(sds s) {
    if (s == NULL) return;
    //将sds指针前移sizeof(struct sdshdr)，得到真正分配内存地址
    zfree(s - sizeof(struct sdshdr));
}
```

## 4. sds扩容函数

 对 sds 中 buf 的长度进行扩展，确保在函数执行之后，buf 至少会有 addlen + 1 长度的空余空间（额外的 1 字节是为 \0 准备的）


```c
sds sdsMakeRoomFor(sds s, size_t addlen) {

    struct sdshdr *sh, *newsh;

    // 获取s目前的空余空间长度
    size_t free = sdsavail(s);

    size_t len, newlen;

    // s 目前的空余空间已经足够，无须再进行扩展，直接返回
    if (free >= addlen) return s;

    // 获取 s 目前已占用空间的长度
    len = sdslen(s);
    sh = (void *) (s - (sizeof(struct sdshdr)));

    // s 最少需要的长度
    newlen = (len + addlen);

    // 根据新长度，为 s 分配新空间所需的大小
    if (newlen < SDS_MAX_PREALLOC) //预分配内存最大为1MB
        // 如果新长度小于 SDS_MAX_PREALLOC 
        // 那么为它分配两倍于所需长度的空间
        newlen *= 2;
    else
        // 否则，分配长度为目前长度加上 SDS_MAX_PREALLOC
        newlen += SDS_MAX_PREALLOC;
    // T = O(N)
    newsh = zrealloc(sh, sizeof(struct sdshdr) + newlen + 1);

    // 内存不足，分配失败，返回
    if (newsh == NULL) return NULL;

    // 更新 sds 的空余长度
    newsh->free = newlen - len;

    // 返回 sds
    return newsh->buf;
}
```

## 5. sds回收函数

```c
sds sdsRemoveFreeSpace(sds s) {
    struct sdshdr *sh;

    sh = (void *) (s - (sizeof(struct sdshdr)));

    // 进行内存重分配，让 buf 的长度仅仅足够保存字符串内容
    // T = O(N)
    sh = zrealloc(sh, sizeof(struct sdshdr) + sh->len + 1);

    // 空余空间为 0
    sh->free = 0;

    return sh->buf;
}
```

## 6. sds拼接函数

```c
sds sdscatlen(sds s, const void *t, size_t len) {
    struct sdshdr *sh;
    // 原有字符串长度
    size_t curlen = sdslen(s);
    // 扩展 sds 空间
    // T = O(N)
    //由于预分配内存机制的存在，这里可能并没有进行实际内存分配
    s = sdsMakeRoomFor(s, len);
    // 内存不足，直接返回
    if (s == NULL) return NULL;

    // 复制 t 中的内容到字符串后部
    // T = O(N)
    sh = (void *) (s - (sizeof(struct sdshdr)));
    memcpy(s + curlen, t, len);
    // 更新属性
    sh->len = curlen + len;
    sh->free = sh->free - len;
    // 添加新结尾符号
    s[curlen + len] = '\0';
    // 返回新 sds
    return s;
}
```

## 7. sds与C中字符串区别

- C语言使用长度N+1的字符数组表示长度为N的字符串，使用'\0'作为字符串的结尾
- C字符串不记录字符串长度，strlen操作复杂度为O(N)，而sds取长度操作为O(1)
- C语言字符串使用不当容易造成缓冲区溢出，而sds通过free变量控制。
- sds扩容是不是按照字符串所占用字节大小严格扩容的，而是会额外分配一些暂时使用不到的空间。通过这种策略可以一定程度上减少字符串增长所需的内存重分配次数。
- C语言字符串以'\o'结尾，字符串中不能含有空字符，sds通过len来判断字符串结尾，可以用来存一些具有特殊格式要求的二进制数据。

