---
#title: Redis源码解析——字典dict
date: 2020-05-24
categories:
- C/C++
tags:
- C/C++
- Redis

---

Redis中有多个数据库，数据库采用的数据结构是哈希表，用以存储键值对。默认所有的客户端都使用第一个数据库，一个数据库对应一个哈希表。如果客户端有需要，可以使用select命令来选择不同的数据库。Redis在初始化服务器的时候就会初始化所有的数据集。Redis的字典采用哈希表作为底层结构，主要实现代码在dict.c和dict.h文件中。

<!--more-->

## 1. dict数据结构

### 1.1 哈希表节点（dictEntry）

```c
	typedef struct dictEntry {
    // 键
    void *key;
    // 值
    union {
        void *val;
        uint64_t u64;
        int64_t s64;
    } v;
    // 指向下个哈希表节点，形成哈希表”开链法“中的链表
    struct dictEntry *next;
} dictEntry;
```

### 1.2 哈希表

```c
typedef struct dictht {
    // 哈希表数组
    dictEntry **table;
    // 哈希表大小
    unsigned long size;
    // 哈希表大小掩码，用于计算索引值
    // 总是等于 size - 1
    unsigned long sizemask;
    // 该哈希表已有节点的数量
    unsigned long used;
} dictht;
```

### 1.3 字典

```c
typedef struct dict {
    // 类型特定函数
    dictType *type;
    // 私有数据
    void *privdata;
    // 哈希表，每个字典使用两个哈希表，能在不中断服务的情况下扩展哈希表
    dictht ht[2];
    // rehash 索引，表示下一次rehash索引位置
    // 当 rehash 不在进行时，值为 -1
    int rehashidx; /* rehashing not in progress if rehashidx == -1 */
    // 目前正在运行的安全迭代器的数量
    int iterators; /* number of iterators currently running */
} dict;
```

```c
// 字典类型特定函数
typedef struct dictType {
    // 计算哈希值的函数
    unsigned int (*hashFunction)(const void *key);
    // 复制键的函数
    void *(*keyDup)(void *privdata, const void *key);
    // 复制值的函数
    void *(*valDup)(void *privdata, const void *obj);
    // 对比键的函数
    int (*keyCompare)(void *privdata, const void *key1, const void *key2);
    // 销毁键的函数
    void (*keyDestructor)(void *privdata, void *key);
    // 销毁值的函数
    void (*valDestructor)(void *privdata, void *obj);
} dictType;
```

由此我们可以推断出Redis Dict的结构如下图所示：

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200525143216.png)

## 2. 主要方法

###2.1 Rehash算法

Dict采用开链法来处理哈希冲突，随着数据存放量的增加，必然会造成冲突链表越来越长，最终会导致字典查找效率显著下降。这种情况下，就需要对字典进行扩容。另外，当字典中键值对过少时，就需要对字典进行收缩来节省空间，这些扩容和收缩的过程就采用rehash来实现。Rehash算法使用rehashidx来控制rehash进度，此方法是线程不安全的，不能并发调用。

```c
/* Performs N steps of incremental rehashing. Returns 1 if there are still
 * keys to move from the old to the new hash table, otherwise 0 is returned.
 *
 * 执行 N 步渐进式 rehash 。
 *
 * 返回 1 表示仍有键需要从 0 号哈希表移动到 1 号哈希表，
 * 返回 0 则表示所有键都已经迁移完毕。
 *
 * Note that a rehashing step consists in moving a bucket (that may have more
 * than one key as we use chaining) from the old to the new hash table.
 *
 * 注意，每步 rehash 都是以一个哈希表索引（桶）作为单位的，
 * 一个桶里可能会有多个节点，
 * 被 rehash 的桶里的所有节点都会被移动到新哈希表。
 *
 * T = O(N)
 */
int dictRehash(dict *d, int n) {
    // 只可以在 rehash 进行中时执行
    if (!dictIsRehashing(d)) return 0;
    // 进行 N 步迁移
    // T = O(N)
    while(n--) {
        dictEntry *de, *nextde;

        /* Check if we already rehashed the whole table... */
        // 如果 0 号哈希表为空，那么表示 rehash 执行完毕
        // T = O(1)
        if (d->ht[0].used == 0) {
            // 释放 0 号哈希表
            zfree(d->ht[0].table);
            // 将原来的 1 号哈希表设置为新的 0 号哈希表
            d->ht[0] = d->ht[1];
            // 重置旧的 1 号哈希表
            _dictReset(&d->ht[1]);
            // 关闭 rehash 标识
            d->rehashidx = -1;
            // 返回 0 ，向调用者表示 rehash 已经完成
            return 0;
        }

        /* Note that rehashidx can't overflow as we are sure there are more
         * elements because ht[0].used != 0 */
        // 确保 rehashidx 没有越界
        assert(d->ht[0].size > (unsigned)d->rehashidx);

        // 略过数组中为空的索引，找到下一个非空索引，这里不会发生越界问题，因为d->ht[0].used == 0一定能找到下一个不为NULL的
        while(d->ht[0].table[d->rehashidx] == NULL) d->rehashidx++;

        // 指向该索引的链表表头节点
        de = d->ht[0].table[d->rehashidx];
        /* Move all the keys in this bucket from the old to the new hash HT */
        // 将链表中的所有节点迁移到新哈希表
        // T = O(1)
        while(de) {
            unsigned int h;

            // 保存下个节点的指针
            nextde = de->next;

            /* Get the index in the new hash table */
            // 计算新哈希表的哈希值，以及节点插入的索引位置
            h = dictHashKey(d, de->key) & d->ht[1].sizemask;

            // 采用头插法，插入节点到新哈希表
            de->next = d->ht[1].table[h];
            d->ht[1].table[h] = de;

            // 更新计数器
            d->ht[0].used--;
            d->ht[1].used++;

            // 继续处理下个节点
            de = nextde;
        }
        // 将刚迁移完的哈希表索引的指针设为空
        d->ht[0].table[d->rehashidx] = NULL;
        // 更新 rehash 索引
        d->rehashidx++;
    }
		// 返回1，表示rehash还未结束
    return 1;
}
```

Redis中的rehash操作不是一次完成的，而是渐进式完成的，每次只移动若干个bucket到新表。Redis提供了如下两种渐进式的操作来做rehash。

#### 2.1.1 按索引值

```c
static void _dictRehashStep(dict *d) {
    if (d->iterators == 0) dictRehash(d,1);
}
```

在dict不存在安全迭代器的情况下，对字典进行单步rehash（在迭代过程中修改字典是不被允许的，容易引发安全问题）

#### 2.1.2 按时间间隔

```c
// 获取当前的时间戳（一毫秒为单位）
long long timeInMilliseconds(void) {
    struct timeval tv;

    gettimeofday(&tv,NULL);
    return (((long long)tv.tv_sec)*1000)+(tv.tv_usec/1000);
}
// 在给定毫秒数内，以 100 步为单位，对字典进行 rehash 
int dictRehashMilliseconds(dict *d, int ms) {
    long long start = timeInMilliseconds();
    int rehashes = 0;

    while(dictRehash(d,100)) {  // 每次执行100步
        rehashes += 100;
        if (timeInMilliseconds()-start > ms) break; // 如果时间超过ms就退出
    }
    return rehashes;
}
```

### 2.2 Dict创建

dict创建时并没有实际为hash表分配内存

```c
 /*
 * 重置（或初始化）给定哈希表的各项属性值
 * T = O(1)
 */
static void _dictReset(dictht *ht)
{
    ht->table = NULL;
    ht->size = 0;
    ht->sizemask = 0;
    ht->used = 0;
}

/* Create a new hash table */
/*
 * 创建一个新的字典
 *
 * T = O(1)
 */
dict *dictCreate(dictType *type,
        void *privDataPtr)
{
    dict *d = zmalloc(sizeof(*d));

    _dictInit(d,type,privDataPtr);

    return d;
}

/* Initialize the hash table */
/*
 * 初始化哈希表
 *
 * T = O(1)
 */
int _dictInit(dict *d, dictType *type,
        void *privDataPtr)
{
    // 初始化两个哈希表的各项属性值
    // 但暂时还不分配内存给哈希表数组
    _dictReset(&d->ht[0]);
    _dictReset(&d->ht[1]);

    // 设置类型特定函数
    d->type = type;

    // 设置私有数据
    d->privdata = privDataPtr;

    // 设置哈希表 rehash 状态
    d->rehashidx = -1;

    // 设置字典的安全迭代器数量
    d->iterators = 0;

    return DICT_OK;
}
```

### 2.3 Dict扩容

```c
/* Expand or create the hash table */
/*
 * 创建一个新的哈希表，并根据字典的情况，选择以下其中一个动作来进行：
 *
 * 1) 如果字典的 0 号哈希表为空，那么将新哈希表设置为 0 号哈希表
 * 2) 如果字典的 0 号哈希表非空，那么将新哈希表设置为 1 号哈希表，
 *    并打开字典的 rehash 标识，使得程序可以开始对字典进行 rehash
 *
 * size 参数不够大，或者 rehash 已经在进行时，返回 DICT_ERR 。
 *
 * 成功创建 0 号哈希表，或者 1 号哈希表时，返回 DICT_OK 。
 *
 * T = O(N)
 */
int dictExpand(dict *d, unsigned long size)
{
    // 新哈希表
    dictht n; /* the new hash table */

    // 根据 size 参数，计算哈希表的大小
    // T = O(1)
    unsigned long realsize = _dictNextPower(size);

    /* the size is invalid if it is smaller than the number of
     * elements already inside the hash table */
    // 不能在字典正在 rehash 时进行
    // size 的值也不能小于 0 号哈希表的当前已使用节点
    if (dictIsRehashing(d) || d->ht[0].used > size)
        return DICT_ERR;

    /* Allocate the new hash table and initialize all pointers to NULL */
    // 为哈希表分配空间，并将所有指针指向 NULL
    n.size = realsize;
    n.sizemask = realsize-1;
    // T = O(N)
    n.table = zcalloc( *sizeof(dictEntry*));
    n.used = 0;

    /* Is this the first initialization? If so it's not really a rehashing
     * we just set the first hash table so that it can accept keys. */
    // 如果 0 号哈希表为空，那么这是一次初始化：
    // 程序将新哈希表赋给 0 号哈希表的指针，然后字典就可以开始处理键值对了。
    if (d->ht[0].table == NULL) {
        d->ht[0] = n;
        return DICT_OK;
    }

    /* Prepare a second hash table for incremental rehashing */
    // 如果 0 号哈希表非空，那么这是一次 rehash ：
    // 程序将新哈希表设置为 1 号哈希表，
    // 并将字典的 rehash 标识打开，让程序可以开始对字典进行 rehash
    d->ht[1] = n;
    d->rehashidx = 0;
    return DICT_OK;
}
```

### 2.4 查找key可以插入的索引位置

```c
/* Returns the index of a free slot that can be populated with
 * a hash entry for the given 'key'.
 * If the key already exists, -1 is returned.
 *
 * 返回可以将 key 插入到哈希表的索引位置
 * 如果 key 已经存在于哈希表，那么返回 -1
 *
 * Note that if we are in the process of rehashing the hash table, the
 * index is always returned in the context of the second (new) hash table. 
 *
 * 注意，如果字典正在进行 rehash ，那么总是返回 1 号哈希表的索引。
 * 因为在字典进行 rehash 时，新节点总是插入到 1 号哈希表。
 *
 * T = O(N)
 */
static int _dictKeyIndex(dict *d, const void *key)
{
    unsigned int h, idx, table;
    dictEntry *he;

    /* Expand the hash table if needed */
    // 单步 rehash
    // T = O(N)
    if (_dictExpandIfNeeded(d) == DICT_ERR)
        return -1;

    /* Compute the key hash value */
    // 计算 key 的哈希值
    h = dictHashKey(d, key);
    // T = O(1)
    for (table = 0; table <= 1; table++) {

        // 计算索引值
        idx = h & d->ht[table].sizemask;

        /* Search if this slot does not already contain the given key */
        // 查找 key 是否存在
        // T = O(1)
        he = d->ht[table].table[idx];
        while(he) {
            if (dictCompareKeys(d, key, he->key))
                return -1;
            he = he->next;
        }

        // 如果运行到这里时，说明 0 号哈希表中所有节点都不包含 key
        // 如果这时 rehahs 正在进行，那么继续对 1 号哈希表进行 rehash
        if (!dictIsRehashing(d)) break;
    }

    // 返回索引值
    return idx;
}
```

```c
static int _dictExpandIfNeeded(dict *d)
{
    /* Incremental rehashing already in progress. Return. */
    // 渐进式 rehash 已经在进行了，直接返回
    if (dictIsRehashing(d)) return DICT_OK;

    /* If the hash table is empty expand it to the initial size. */
    // 如果字典（的 0 号哈希表）为空，那么创建并返回初始化大小(4)的0号哈希表
    // T = O(1)
    if (d->ht[0].size == 0) return dictExpand(d, DICT_HT_INITIAL_SIZE);

    /* If we reached the 1:1 ratio, and we are allowed to resize the hash
     * table (global setting) or we should avoid it but the ratio between
     * elements/buckets is over the "safe" threshold, we resize doubling
     * the number of buckets. */
    // 一下两个条件之一为真时，对字典进行扩展
    // 1）字典已使用节点数和字典大小之间的比率接近 1：1
    //    并且 dict_can_resize 为真
    // 2）已使用节点数和字典大小之间的比率超过 dict_force_resize_ratio
    if (d->ht[0].used >= d->ht[0].size &&
        (dict_can_resize ||
         d->ht[0].used/d->ht[0].size > dict_force_resize_ratio))
    {
        // 新哈希表的大小至少是目前已使用节点数的两倍
        // T = O(N)
        return dictExpand(d, d->ht[0].used*2);
    }

    return DICT_OK;
}
```

### 2.5 添加键值对

```c
/* Add an element to the target hash table */
/*
 * 尝试将给定键值对添加到字典中
 * 只有给定键 key 不存在于字典时，添加操作才会成功
 * 添加成功返回 DICT_OK ，失败返回 DICT_ERR
 * 最坏 T = O(N) ，平摊 O(1) 
 */
int dictAdd(dict *d, void *key, void *val)
{
    // 尝试添加键到字典，并返回包含了这个键的新哈希节点
    // T = O(N)
    dictEntry *entry = dictAddRaw(d,key);

    // 键已存在，添加失败
    if (!entry) return DICT_ERR;

    // 键不存在，设置节点的值
    // T = O(1)
    dictSetVal(d, entry, val);

    // 添加成功
    return DICT_OK;
}

/* Low level add. This function adds the entry but instead of setting
 * a value returns the dictEntry structure to the user, that will make
 * sure to fill the value field as he wishes.
 *
 * This function is also directly exposed to user API to be called
 * mainly in order to store non-pointers inside the hash value, example:
 *
 * entry = dictAddRaw(dict,mykey);
 * if (entry != NULL) dictSetSignedIntegerVal(entry,1000);
 *
 * Return values:
 *
 * If key already exists NULL is returned.
 * If key was added, the hash entry is returned to be manipulated by the caller.
 */
/*
 * 尝试将键插入到字典中
 *
 * 如果键已经在字典存在，那么返回 NULL
 *
 * 如果键不存在，那么程序创建新的哈希节点，
 * 将节点和键关联，并插入到字典，然后返回节点本身。
 *
 * T = O(N)
 */
dictEntry *dictAddRaw(dict *d, void *key)
{
    int index;
    dictEntry *entry;
    dictht *ht;

    // 如果条件允许的话，进行单步 rehash
    // T = O(1)
    if (dictIsRehashing(d)) _dictRehashStep(d);

    /* Get the index of the new element, or -1 if
     * the element already exists. */
    // 计算键在哈希表中的索引值
    // 如果值为 -1 ，那么表示键已经存在
    // T = O(N)
    if ((index = _dictKeyIndex(d, key)) == -1)
        return NULL;

    // T = O(1)
    /* Allocate the memory and store the new entry */
    // 如果字典正在 rehash ，那么将新键添加到 1 号哈希表
    // 否则，将新键添加到 0 号哈希表
    ht = dictIsRehashing(d) ? &d->ht[1] : &d->ht[0];
    // 为新节点分配空间
    entry = zmalloc(sizeof(*entry));
    // 将新节点插入到链表表头
    entry->next = ht->table[index];
    ht->table[index] = entry;
    // 更新哈希表已使用节点数量
    ht->used++;

    /* Set the hash entry fields. */
    // 设置新节点的键
    // T = O(1)
    dictSetKey(d, entry, key);

    return entry;
}
```

### 2.6 替换键对应的值

```c
int dictReplace(dict *d, void *key, void *val)
{
    dictEntry *entry, auxentry;

    // 尝试直接将键值对添加到字典, 如果键 key 不存在的话，添加会成功
    // T = O(N)
    if (dictAdd(d, key, val) == DICT_OK)
        return 1;
  
    // 键key已经存在，那么找出包含这个 key 的节点
    // T = O(1)
    entry = dictFind(d, key);
    // 先保存原有的值的指针
    auxentry = *entry;
    // 然后设置新的值
    // T = O(1)
    dictSetVal(d, entry, val);
    // 然后释放旧值
    // T = O(1)
    dictFreeVal(d, &auxentry);

    return 0;
}
```

### 2.7 查找键值对

```c
dictEntry *dictFind(dict *d, const void *key)
{
    dictEntry *he;
    unsigned int h, idx, table;
    // 字典为空，返回NULL
    if (d->ht[0].used + d->ht[1].used == 0) return NULL; 
    // 如果正在进行rehash，则执行rehash操作
    if (dictIsRehashing(d)) _dictRehashStep(d);
    // 计算哈希值
    h = dictHashKey(d, key);
    // 在两个表中查找对应的键值对
    for (table = 0; table <= 1; table++) {
        // 根据掩码来计算索引值
        idx = h & d->ht[table].sizemask;
        // 得到该索引值下的存放的键值对链表
        he = d->ht[table].table[idx];
        while(he) {
            // 如果找到该key直接返回
            if (key==he->key || dictCompareKeys(d, key, he->key))
                return he;
            // 找下一个
            he = he->next;
        }
        // 如果没有进行rehash，则直接返回
        if (!dictIsRehashing(d)) return NULL;
    }
    return NULL;
}
```

### 2.8 删除键值对

```c
/*
 * 从字典中删除包含给定键的节点
 * 并且调用键值的释放函数来删除键值
 * 找到并成功删除返回 DICT_OK ，没找到则返回 DICT_ERR
 * T = O(1)
 */
int dictDelete(dict *ht, const void *key) {
    return dictGenericDelete(ht,key,0);
}

/*
 * 从字典中删除包含给定键的节点
 * 但不调用键值的释放函数来删除键值，键值可能在其他地方用到
 * 找到并成功删除返回 DICT_OK ，没找到则返回 DICT_ERR
 * T = O(1)
 */
int dictDeleteNoFree(dict *ht, const void *key) {
    return dictGenericDelete(ht,key,1);
}

/* Search and remove an element */
/*
 * 查找并删除包含给定键的节点
 *
 * 参数 nofree 决定是否调用键和值的释放函数
 * 0 表示调用，1 表示不调用
 * 找到并成功删除返回 DICT_OK ，没找到则返回 DICT_ERR
 *
 * T = O(1)
 */
static int dictGenericDelete(dict *d, const void *key, int nofree)
{
    unsigned int h, idx;
    dictEntry *he, *prevHe;
    int table;

    // 字典（的哈希表）为空
    if (d->ht[0].size == 0) return DICT_ERR; /* d->ht[0].table is NULL */

    // 进行单步 rehash ，T = O(1)
    if (dictIsRehashing(d)) _dictRehashStep(d);

    // 计算哈希值
    h = dictHashKey(d, key);

    // 遍历哈希表
    // T = O(1)
    for (table = 0; table <= 1; table++) {

        // 计算索引值 
        idx = h & d->ht[table].sizemask;
        // 指向该索引上的链表
        he = d->ht[table].table[idx];
        prevHe = NULL;
        // 遍历链表上的所有节点
        // T = O(1)
        while(he) {
        
            if (dictCompareKeys(d, key, he->key)) {
                // 超找目标节点

                /* Unlink the element from the list */
                // 从链表中删除
                if (prevHe)
                    prevHe->next = he->next;
                else
                    d->ht[table].table[idx] = he->next;

                // 释放调用键和值的释放函数？
                if (!nofree) {
                    dictFreeKey(d, he);
                    dictFreeVal(d, he);
                }
                // 释放节点本身
                zfree(he);
                // 更新已使用节点数量
                d->ht[table].used--;
                // 返回已找到信号
                return DICT_OK;
            }

            prevHe = he;
            he = he->next;
        }

        //0号哈希表中找不到给定键
        //那么根据字典是否正在进行rehash ，决定要不要查找1号哈希表
        if (!dictIsRehashing(d)) break;
    }

    // 没找到
    return DICT_ERR; /* not found */
}
```

### 2.9 Dict迭代

在 RDB 和 AOF 持久化操作中，都需要迭代哈希表。哈希表的遍历本身难度不大，但因为每个数据库都有两个哈希表，所以遍历的时候也需要注意遍历两个哈希表：第一个哈希表遍历完毕的时候，如果发现rehash尚未结束，则需要继续遍历第二个哈希表。

#### 2.9.1 迭代器定义

```c
/* If safe is set to 1 this is a safe iterator, that means, you can call
 * dictAdd, dictFind, and other functions against the dictionary even while
 * iterating. Otherwise it is a non safe iterator, and only dictNext()
 * should be called while iterating. */
/*
 * 字典迭代器
 *
 * 如果 safe 属性的值为 1 ，那么在迭代进行的过程中，
 * 程序仍然可以执行 dictAdd 、 dictFind 和其他函数，对字典进行修改。
 *
 * 如果 safe 不为 1 ，那么程序只会调用 dictNext 对字典进行迭代，
 * 而不对字典进行修改。
 */
typedef struct dictIterator {
        
    // 被迭代的字典
    dict *d;

    // table ：正在被迭代的哈希表号码，值可以是 0 或 1 。
    // index ：迭代器当前所指向的哈希表索引位置。
    // safe ：标识这个迭代器是否安全
    int table, index, safe;

    // entry ：当前迭代到的节点的指针
    // nextEntry ：当前迭代节点的下一个节点
    //因为在安全迭代器运作时， entry 所指向的节点可能会被修改，所以需要一个额外的指针来保存下一节点的位置，从而防止指针丢失
    dictEntry *entry, *nextEntry;

    long long fingerprint; /* unsafe iterator fingerprint for misuse detection */
} dictIterator;
```

#### 2.9.2 创建迭代器

```c
/*
 * 创建并返回给定字典的不安全迭代器
 * T = O(1)
 */
dictIterator *dictGetIterator(dict *d)
{
    dictIterator *iter = zmalloc(sizeof(*iter));

    iter->d = d;
    iter->table = 0;
    iter->index = -1;
    iter->safe = 0;
    iter->entry = NULL;
    iter->nextEntry = NULL;

    return iter;
}

/*
 * 创建并返回给定节点的安全迭代器
 *
 * T = O(1)
 */
dictIterator *dictGetSafeIterator(dict *d) {
    dictIterator *i = dictGetIterator(d);

    // 设置安全迭代器标识
    i->safe = 1;

    return i;
}

/*
 * 返回迭代器指向的当前节点
 *
 * 字典迭代完毕时，返回 NULL
 *
 * T = O(1)
 */
dictEntry *dictNext(dictIterator *iter)
{
    while (1) {
        // 进入这个循环有两种可能：
        // 1) 这是迭代器第一次运行
        // 2) 当前索引链表中的节点已经迭代完（NULL 为链表的表尾）
        if (iter->entry == NULL) {

            // 指向被迭代的哈希表
            dictht *ht = &iter->d->ht[iter->table];

            // 初次迭代时执行
            if (iter->index == -1 && iter->table == 0) {
                // 如果是安全迭代器，那么更新安全迭代器计数器
                if (iter->safe)
                    iter->d->iterators++;
                // 如果是不安全迭代器，那么计算指纹
                else
                    iter->fingerprint = dictFingerprint(iter->d);
            }
            // 更新索引
            iter->index++;

            // 如果迭代器的当前索引大于当前被迭代的哈希表的大小
            // 那么说明这个哈希表已经迭代完毕
            if (iter->index >= (signed) ht->size) {
                // 如果正在 rehash 的话，那么说明 1 号哈希表也正在使用中
                // 那么继续对 1 号哈希表进行迭代
                if (dictIsRehashing(iter->d) && iter->table == 0) {
                    iter->table++;
                    iter->index = 0;
                    ht = &iter->d->ht[1];
                // 如果没有 rehash ，那么说明迭代已经完成
                } else {
                    break;
                }
            }

            // 如果进行到这里，说明这个哈希表并未迭代完
            // 更新节点指针，指向下个索引链表的表头节点
            iter->entry = ht->table[iter->index];
        } else {
            // 执行到这里，说明程序正在迭代某个链表
            // 将节点指针指向链表的下个节点
            iter->entry = iter->nextEntry;
        }

        // 如果当前节点不为空，那么也记录下该节点的下个节点
        // 因为安全迭代器有可能会将迭代器返回的当前节点删除
        if (iter->entry) {
            /* We need to save the 'next' here, the iterator user
             * may delete the entry we are returning. */
            iter->nextEntry = iter->entry->next;
            return iter->entry;
        }
    }

    // 迭代完毕
    return NULL;
}

```

## 3. 总结

- Dict的查找效率是T(1)，但对键值对进行增加、修改时可能会存在扩容，此时的效率为T(N)，因此Redis注重高读性能，低写性能，适合于读多写少场景。
- Redis的每个Dict保存了两张Hash表，可以在不中断服务的情况下扩展hash表