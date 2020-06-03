---
title: Redis源码解析——压缩列表ziplist
date: 2020-06-03
categories:
- C/C++
tags:
- C/C++
- Redis

---

在Redis中，list有两种存储方式：双端链表（LinkedList）和压缩双端链表（ziplist）。双端链表即普通数据结构中遇到的，在adlist.h和adlist.c中实现。压缩双端链表在ziplist.h和ziplist.c实现。

<!--more-->

## 1. 定义

在redisObject一文中我们得知redis的hash底层存储可以使用ziplist和hashtable两种编码方式。当hash对象可以同时满足以下两个条件时，hash对象采样点ziplist编码。

- 哈希对象保存的所有键值对的键和值的字符串长度都小于64字节
- 哈希对象保存的键值对数量小于512个

ziplist包括zip header、zip entry和zip end三部分组成，其存储格式可以用下图表示。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200603160420.png)

zip_bytes是zip list占用的空间，zip_tail是最后一个数据项的偏移地址，方便反向遍历链表。zip_length表示zip_entry的个数，zip_end为定值0xFF，占1字节。

zip_entry的结构如下：

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200603160744.png)

```c
//保存 ziplist 节点信息的结构
typedef struct zlentry {
    // prevrawlen ：前置节点的长度
    // prevrawlensize ：编码 prevrawlen 所需的字节大小
    unsigned int prevrawlensize, prevrawlen;
    // len ：当前节点值的长度
    // lensize ：编码len所需的字节大小
    unsigned int lensize, len;
    // 当前节点 header 的大小
    // 等于 prevrawlensize + lensize
    unsigned int headersize;
    // 当前节点值所使用的编码类型
    unsigned char encoding;
    // 指向当前节点的指针
    unsigned char *p;
} zlentry;
```

!!! warning prevlen
    ziplist在编码前置节点长度的时候，采用以下规则。1.如果前置节点的长度小于254字节，那么采用1个字节来保存这个长度值；2. 如果前置节点的长度大于254字节，则采用5个字节来保存这个长度值，其中，第一个字节被设置为0xFE(254)，用于表示该长度大于254字节，后面四个字节则用来存储前置节点的长度值。

**编码前置长度**

- 如果前置节点的长度大于254字节，则采用5个字节来保存这个长度值，其中，第一个字节被设置为0xFE(254)，用于表示该长度大于254字节，后面四个字节则用来存储前置节点的长度值。

```c
/* Encode the length of the previous entry and write it to "p". Return the
 * number of bytes needed to encode this length if "p" is NULL. 
 *
 * 对前置节点的长度 len 进行编码，并将它写入到 p 中，
 * 然后返回编码 len 所需的字节数量。
 *
 * 如果 p 为 NULL ，那么不进行写入，仅返回编码 len 所需的字节数量。
 *
 * T = O(1)
 */
static unsigned int zipPrevEncodeLength(unsigned char *p, unsigned int len) {

    // 仅返回编码 len 所需的字节数量
    if (p == NULL) {
        return (len < ZIP_BIGLEN) ? 1 : sizeof(len)+1;

    // 写入并返回编码 len 所需的字节数量
    } else {

        // 1 字节
        if (len < ZIP_BIGLEN) {
            p[0] = len;
            return 1;

        // 5 字节
        } else {
            // 添加 5 字节长度标识
            p[0] = ZIP_BIGLEN;
            // 写入编码
            memcpy(p+1,&len,sizeof(len));
            // 如果有必要的话，进行大小端转换
            memrev32ifbe(p+1);
            // 返回编码长度
            return 1+sizeof(len);
        }
    }
}
```

**解码前置节点长度**

```c
/* Decode the number of bytes required to store the length of the previous
 * element, from the perspective of the entry pointed to by 'ptr'. 
 *
 * 解码 ptr 指针，
 * 取出编码前置节点长度所需的字节数，并将它保存到 prevlensize 变量中。
 *
 * T = O(1)
 */
#define ZIP_DECODE_PREVLENSIZE(ptr, prevlensize) do {      \
    if ((ptr)[0] < ZIP_BIGLEN) {                           \
        (prevlensize) = 1;                                 \
    } else {                                               \
        (prevlensize) = 5;                                 \
    }                                                      \
} while(0);
/* Decode the length of the previous element, from the perspective of the entry
 * pointed to by 'ptr'. 
 *
 * 解码 ptr 指针，
 * 取出编码前置节点长度所需的字节数，
 * 并将这个字节数保存到 prevlensize 中。
 * 然后根据 prevlensize ，从 ptr 中取出前置节点的长度值，
 * 并将这个长度值保存到 prevlen 变量中。
 *
 * T = O(1)
 */
#define ZIP_DECODE_PREVLEN(ptr, prevlensize, prevlen) do { \
    /* 先计算被编码长度值的字节数 */                           \
    ZIP_DECODE_PREVLENSIZE(ptr, prevlensize);             \
    /* 再根据编码字节数来取出长度值 */                         \
    if ((prevlensize) == 1) {                             \
        (prevlen) = (ptr)[0];                             \
    } else if ((prevlensize) == 5) {                      \
        assert(sizeof((prevlensize)) == 4);               \
        memcpy(&(prevlen), ((char*)(ptr)) + 1, 4);        \
        memrev32ifbe(&prevlen);                           \
    }                                                     \
} while(0);
```

在编码解码当前节点的长度，ziplist提供了zipEncodeLength和ZIP_DECODE_LENGTH这两个配套函数来完成。

## 2. 主要方法

### 2.1 创建空ziplist

```c
unsigned char *ziplistNew(void) {
    // ZIPLIST_HEADER_SIZE 是 ziplist 表头的大小
    //#define ZIPLIST_HEADER_SIZE (sizeof(uint32_t)*2+sizeof(uint16_t))
    // 1字节链表末端 ZIP_END 的大小
    unsigned int bytes = ZIPLIST_HEADER_SIZE+1;
    // 为表头和表末端分配空间
    unsigned char *zl = zmalloc(bytes);
    // 初始化表属性
    ZIPLIST_BYTES(zl) = intrev32ifbe(bytes);
    ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(ZIPLIST_HEADER_SIZE);
    ZIPLIST_LENGTH(zl) = 0;
    // 设置表末端
    zl[bytes-1] = ZIP_END;
    return zl;
}
```

### 2.2 插入节点

```c
/*
 * 将长度为 slen 的字符串 s 推入到 zl 中。
 *  where 参数的值决定了推入的方向：
 * - 值为 ZIPLIST_HEAD 时，将新值推入到表头。
 * - 否则，将新值推入到表末端。
 *
 * 函数的返回值为添加新值后的 ziplist 。
 * T = O(N^2)
 */
unsigned char *ziplistPush(unsigned char *zl, unsigned char *s, unsigned int slen, int where) {

    // 根据 where 参数的值，决定将值推入到表头还是表尾
    unsigned char *p;
    // ZIPLIST_ENTRY_HEAD和ZIPLIST_ENTRY_END通过宏定义计算分别指向第一个节点的其实位置和zip_end的起始位置
    p = (where == ZIPLIST_HEAD) ? ZIPLIST_ENTRY_HEAD(zl) : ZIPLIST_ENTRY_END(zl);

    // 返回添加新值后的 ziplist
    // T = O(N^2)
    return __ziplistInsert(zl,p,s,slen);
}

 /*
 * 根据指针 p 所指定的位置，将长度为 slen 的字符串 s 插入到 zl 中。
 * 函数的返回值为完成插入操作之后的 ziplist
 *
 * T = O(N^2)
 */
static unsigned char *__ziplistInsert(unsigned char *zl, unsigned char *p, unsigned char *s, unsigned int slen) {
    // 记录当前 ziplist 的长度
    size_t curlen = intrev32ifbe(ZIPLIST_BYTES(zl)), reqlen, prevlen = 0;
    size_t offset;
    int nextdiff = 0;
    unsigned char encoding = 0;
    long long value = 123456789; /* initialized to avoid warning. Using a value that is easy to see if for some reason we use it uninitialized. */
    zlentry entry, tail;

    /* Find out prevlen for the entry that is inserted. */
    if (p[0] != ZIP_END) {
        // 如果 p[0] 不指向列表末端，说明列表非空，并且 p 正指向列表的其中一个节点
        // 那么取出 p 所指向节点的信息，并将它保存到 entry 结构中
        // 然后用 prevlen 变量记录前置节点的长度
        // （当插入新节点之后 p 所指向的节点就成了新节点的前置节点）
        // T = O(1)
        entry = zipEntry(p);
        prevlen = entry.prevrawlen;
    } else {
        // 如果 p 指向表尾末端，那么程序需要检查列表是否为：
        // 1)如果 ptail 也指向 ZIP_END ，那么列表为空；
        // 2)如果列表不为空，那么 ptail 将指向列表的最后一个节点。
        unsigned char *ptail = ZIPLIST_ENTRY_TAIL(zl);
        if (ptail[0] != ZIP_END) {
            // 表尾节点为新节点的前置节点

            // 取出表尾节点的长度
            // T = O(1)
            prevlen = zipRawEntryLength(ptail);
        }
    }

    /* See if the entry can be encoded */
    // 尝试看能否将输入字符串转换为整数，如果成功的话：
    // 1)value 将保存转换后的整数值
    // 2)encoding 则保存适用于 value 的编码方式
    // 无论使用什么编码， reqlen 都保存节点值的长度
    // T = O(N)
    if (zipTryEncoding(s,slen,&value,&encoding)) {
        /* 'encoding' is set to the appropriate integer encoding */
        reqlen = zipIntSize(encoding);
    } else {
        /* 'encoding' is untouched, however zipEncodeLength will use the
         * string length to figure out how to encode it. */
        reqlen = slen;
    }
    /* We need space for both the length of the previous entry and
     * the length of the payload. */
    // 计算编码前置节点的长度所需的大小
    // T = O(1)
    reqlen += zipPrevEncodeLength(NULL,prevlen);
    // 计算编码当前节点值所需的大小
    // T = O(1)
    reqlen += zipEncodeLength(NULL,encoding,slen);

    /* When the insert position is not equal to the tail, we need to
     * make sure that the next entry can hold this entry's length in
     * its prevlen field. */
    // 只要新节点不是被添加到列表末端，
    // 那么程序就需要检查看 p 所指向的节点（的 header）能否编码新节点的长度。
    // nextdiff 保存了新旧编码之间的字节大小差，如果这个值大于 0 
    // 那么说明需要对 p 所指向的节点（的 header ）进行扩展
    // T = O(1)
    nextdiff = (p[0] != ZIP_END) ? zipPrevLenByteDiff(p,reqlen) : 0;

    /* Store offset because a realloc may change the address of zl. */
    // 因为重分配空间可能会改变 zl 的地址
    // 所以在分配之前，需要记录 zl 到 p 的偏移量，然后在分配之后依靠偏移量还原 p 
    offset = p-zl;
    // curlen 是 ziplist 原来的长度
    // reqlen 是整个新节点的长度
    // nextdiff 是新节点的后继节点扩展 header 的长度（要么 0 字节，要么 4 个字节）
    // T = O(N)
    zl = ziplistResize(zl,curlen+reqlen+nextdiff);
    p = zl+offset;

    /* Apply memory move when necessary and update tail offset. */
    if (p[0] != ZIP_END) {
        // 新元素之后还有节点，因为新元素的加入，需要对这些原有节点进行调整

        /* Subtract one because of the ZIP_END bytes */
        // 移动现有元素，为新元素的插入空间腾出位置
        // T = O(N)
        memmove(p+reqlen,p-nextdiff,curlen-offset-1+nextdiff);

        /* Encode this entry's raw length in the next entry. */
        // 将新节点的长度编码至后置节点
        // p+reqlen 定位到后置节点
        // reqlen 是新节点的长度
        // T = O(1)
        zipPrevEncodeLength(p+reqlen,reqlen);

        /* Update offset for tail */
        // 更新到达表尾的偏移量，将新节点的长度也算上
        ZIPLIST_TAIL_OFFSET(zl) =
            intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+reqlen);

        /* When the tail contains more than one entry, we need to take
         * "nextdiff" in account as well. Otherwise, a change in the
         * size of prevlen doesn't have an effect on the *tail* offset. */
        // 如果新节点的后面有多于一个节点
        // 那么程序需要将 nextdiff 记录的字节数也计算到表尾偏移量中
        // 这样才能让表尾偏移量正确对齐表尾节点
        // T = O(1)
        tail = zipEntry(p+reqlen);
        if (p[reqlen+tail.headersize+tail.len] != ZIP_END) {
            ZIPLIST_TAIL_OFFSET(zl) =
                intrev32ifbe(intrev32ifbe(ZIPLIST_TAIL_OFFSET(zl))+nextdiff);
        }
    } else {
        /* This element will be the new tail. */
        // 新元素是新的表尾节点
        ZIPLIST_TAIL_OFFSET(zl) = intrev32ifbe(p-zl);
    }

    /* When nextdiff != 0, the raw length of the next entry has changed, so
     * we need to cascade the update throughout the ziplist */
    // 当 nextdiff != 0 时，新节点的后继节点的（header 部分）长度已经被改变，
    // 所以需要级联地更新后续的节点
    if (nextdiff != 0) {
        offset = p-zl;
        // T  = O(N^2)
        zl = __ziplistCascadeUpdate(zl,p+reqlen);
        p = zl+offset;
    }

    /* Write the entry */
    // 一切搞定，将前置节点的长度写入新节点的 header
    p += zipPrevEncodeLength(p,prevlen);
    // 将节点值的长度写入新节点的 header
    p += zipEncodeLength(p,encoding,slen);
    // 写入节点值
    if (ZIP_IS_STR(encoding)) {
        // T = O(N)
        memcpy(p,s,slen);
    } else {
        // T = O(1)
        zipSaveInteger(p,value,encoding);
    }

    // 更新列表的节点数量计数器
    // T = O(1)
    ZIPLIST_INCR_LENGTH(zl,1);

    return zl;
}
```

## 总结

- 压缩双链表以连续内存空间表示双链表，压缩双链表节省前驱和后驱指针的空间（共8B），这在小的list上，压缩效率是非常明显的，因为在一个普通的双链表中，前驱后驱指针在64位机器上需要分别占用8B

- 使用ziplist比hashtable更省内存，ziplist的连续内存可以利用cpu的缓存特性（hashtable是非线性的），某些情况下查找效率更高。

  