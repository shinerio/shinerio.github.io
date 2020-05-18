---
title: Redis源码解析——内存分配
date: 2020-05-17
categories:
- C/C++
tags:
- Redis
- C/C++

---

redis内存分配的主要方法是在zmalloc.h中定义、zmalloc.c中实现的，主要是对tcmalloc、jemalloc、macos系统的封装的。这些方法基本上实现了Redis内存申请、释放和统计的功能。

<!--more-->

jemalloc是freebsd操作系统自带的内存分配器，与其他内存分配器相比，其最大优势在于多线程情况下的高性能以及内存碎片较少，firefox以及facebook都在使用。

tcmalloc是Google开发的内存分配器，对小对象占用空间进行了优化，能够对抗内存碎片，chrome和golang都在使用。

## 1. zmalloc.h

首先看zmalloc.h中声明的函数。

```c
//申请大小为size的空间
void *zmalloc(size_t size);       
void *zcalloc(size_t size);     
//重新调整已申请的内存大小为size
void *zrealloc(void *ptr, size_t size); 
//释放内存空间
void zfree(void *ptr);    
//字符串复制
char *zstrdup(const char *s);  
//获取redis已经使用(分配)的内存大小
size_t zmalloc_used_memory(void); 
//控制是否开启线程安全
void zmalloc_enable_thread_safeness(void);
//自定义内存溢出时回调函数
void zmalloc_set_oom_handler(void (*oom_handler)(size_t));
//获取所给内存和已使用内存的大小之比
float zmalloc_get_fragmentation_ratio(size_t rss);
//获取RSS(常驻内存集)大小
size_t zmalloc_get_rss(void);
//获取进程私有的内容已经发生更改的内存大小
size_t zmalloc_get_private_dirty(void);
//直接调用系统free函数释放已分配内存
void zlibc_free(void *ptr);
```

!!! note "size_t"
    size_t是通过typedef定义的unsigned int 类型。用来表示参数/数组元素个数，sizeof 返回值，或 str相关函数返回的size或长度。sizeof 操作符的结果类型是size_t。

## 2. zmalloc.c

### 2.1 宏定义

#### 2.1.1 PREFIX_SIZE 

HAVE_MALOC_SIZE主要是用来确定系统是否提供查询malloc分配的内存大小的函数，如macOS中就提供了malloc_size函数，可以用来返回申请过的内存空间p的大小。对于不提供查询大小方法的系统，redis申请内存时会额外申请PREFIX_SIZE个字节的空间，用来存储malloc分配内存空间的大小。

```c
#ifdef HAVE_MALLOC_SIZE
#define PREFIX_SIZE (0)
#else
#if defined(__sun) || defined(__sparc) || defined(__sparc__)
#define PREFIX_SIZE (sizeof(long long))
#else
#define PREFIX_SIZE (sizeof(size_t))
#endif
#endif
```

<details>
<summary>HAVE_MALLOC_SIZE在src/zmalloc.h定义</summary>
<pre>
#if defined(USE_TCMALLOC)
#define ZMALLOC_LIB ("tcmalloc-" __xstr(TC_VERSION_MAJOR) "." __xstr(TC_VERSION_MINOR))
#include <google/tcmalloc.h>
#if (TC_VERSION_MAJOR == 1 && TC_VERSION_MINOR >= 6) || (TC_VERSION_MAJOR > 1)
#define HAVE_MALLOC_SIZE 1
#define zmalloc_size(p) tc_malloc_size(p)
#else
#error "Newer version of tcmalloc required"
#endif
#elif defined(USE_JEMALLOC)
#define ZMALLOC_LIB ("jemalloc-" __xstr(JEMALLOC_VERSION_MAJOR) "." __xstr(JEMALLOC_VERSION_MINOR) "." __xstr(JEMALLOC_VERSION_BUGFIX))
#include <jemalloc/jemalloc.h>
#if (JEMALLOC_VERSION_MAJOR == 2 && JEMALLOC_VERSION_MINOR >= 1) || (JEMALLOC_VERSION_MAJOR > 2)
#define HAVE_MALLOC_SIZE 1
#define zmalloc_size(p) je_malloc_usable_size(p)
#else
#error "Newer version of jemalloc required"
#endif
#elif defined(__APPLE__)
#include <malloc/malloc.h>
#define HAVE_MALLOC_SIZE 1
#define zmalloc_size(p) malloc_size(p)
#endif
</pre>
</details>

#### 2.1.2 update_zmalloc_stat_alloc

```c
#define update_zmalloc_stat_alloc(__n) do { \
    size_t _n = (__n);
    // _n&(sizeof(long)-1)等价于_n%(sizeof(long)-1)，与运算效率高于取余。将_n调整sizeof(long)的整数倍
    if (_n&(sizeof(long)-1)) _n += sizeof(long)-(_n&(sizeof(long)-1)); \
    //如果采用的线程安全模式，通过互斥锁used_memory_mutex更新已使用内存
    if (zmalloc_thread_safe) { \
        update_zmalloc_stat_add(_n); \
    } else { \
        //不考虑线程安全，直接更新
        used_memory += _n; \
    } \
} while(0)  //当成函数使用，只执行一遍
```

### 2.2 全局变量

```c
static size_t used_memory = 0;   //已使用内存大小
static int zmalloc_thread_safe = 0;  //是否启用内存安全模式
//静态初始化互斥锁，用来控制多线程同步
pthread_mutex_t used_memory_mutex = PTHREAD_MUTEX_INITIALIZER;
```

### 2.3 内存申请

##### 2.3.1 zmalloc

```c
void *zmalloc(size_t size) {    
		//没有提供查询malloc分配大小的函数的系统需要多申请PREFIX_SIZE个字节用来存储分配内存大小
    void *ptr = malloc(size+PREFIX_SIZE);
    //如果内存分配失败，则调用异常回调函数
    if (!ptr) zmalloc_oom_handler(size);
    //更新已使用内存大小
#ifdef HAVE_MALLOC_SIZE
    //提供查询malloc分配大小的函数的系统，直接调用zmalloc_size获取实际分配内存的大小
    update_zmalloc_stat_alloc(zmalloc_size(ptr));
    return ptr;
#else
    //对于没有提供查询malloc分配大小的函数的系统，将此次分配的实际可使用空间大小存入分配内存首部
    *((size_t*)ptr) = size;
    update_zmalloc_stat_alloc(size+PREFIX_SIZE);
		//将指针指向实际可用空间首地址，想要获取该空间大小时只需要将指针前移PREFIX_SIZE大小即可
    return (char*)ptr+PREFIX_SIZE;
#endif
}
```

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200517214418.png)

异常处理函数通过函数指针定义

```c
static void zmalloc_default_oom(size_t size) {
    //打印日志
    fprintf(stderr, "zmalloc: Out of memory trying to allocate %zu bytes\n",
        size);
    // 中断退出
    fflush(stderr);
    abort();
}
//redis也允许自定义异常处理函数
void zmalloc_set_oom_handler(void (*oom_handler)(size_t)) {
    zmalloc_oom_handler = oom_handler; // 绑定自定义的异常处理函数
}
static void (*zmalloc_oom_handler)(size_t) = zmalloc_default_oom;
```

update_zmalloc_stat_alloc通过宏定义给出

```c
#define update_zmalloc_stat_alloc(__n) do { \
    size_t _n = (__n); \
    if (_n&(sizeof(long)-1)) _n += sizeof(long)-(_n&(sizeof(long)-1)); \
    atomicIncr(used_memory,__n); \
} while(0)
```

##### 2.3.2 zcalloc

与zmalloc相似，通过calloc分配内存

```c
void *zcalloc(size_t size) {
    void *ptr = calloc(1, size+PREFIX_SIZE);

    if (!ptr) zmalloc_oom_handler(size);
#ifdef HAVE_MALLOC_SIZE
    update_zmalloc_stat_alloc(zmalloc_size(ptr));
    return ptr;
#else
    *((size_t*)ptr) = size;
    update_zmalloc_stat_alloc(size+PREFIX_SIZE);
    return (char*)ptr+PREFIX_SIZE;
#endif
}
```

##### 2.3.3 zrecalloc

调用系统recalloc函数

```c
void *zrealloc(void *ptr, size_t size) {
#ifndef HAVE_MALLOC_SIZE
    void *realptr;
#endif
    size_t oldsize;
    void *newptr;

    if (ptr == NULL) return zmalloc(size);
#ifdef HAVE_MALLOC_SIZE
    oldsize = zmalloc_size(ptr);
    newptr = realloc(ptr,size);
    if (!newptr) zmalloc_oom_handler(size);
    //更新已使用内存
    update_zmalloc_stat_free(oldsize);
    update_zmalloc_stat_alloc(zmalloc_size(newptr));
    return newptr;
#else
    //指针前移PREFIX_SIZE，得到原来分配内存的大小
    realptr = (char*)ptr-PREFIX_SIZE;
    oldsize = *((size_t*)realptr);
    //调用系统realloc函数重新分配内存
    newptr = realloc(realptr,size+PREFIX_SIZE);
    if (!newptr) zmalloc_oom_handler(size);

    *((size_t*)newptr) = size;
    update_zmalloc_stat_free(oldsize);
    update_zmalloc_stat_alloc(size);
    return (char*)newptr+PREFIX_SIZE;
#endif
}
```

update_zmalloc_stat_free更新已使用内存

```c
#define update_zmalloc_stat_free(__n) do { \
    size_t _n = (__n); \
    if (_n&(sizeof(long)-1)) _n += sizeof(long)-(_n&(sizeof(long)-1)); \
    if (zmalloc_thread_safe) { \
        update_zmalloc_stat_sub(_n); \
    } else { \
        used_memory -= _n; \
    } \
} while(0)
```

### 2.4 内存释放

与内存申请类似，redis通过调用系统free函数来释放内存

```c
void zfree(void *ptr) {
#ifndef HAVE_MALLOC_SIZE
    void *realptr;
    size_t oldsize;
#endif
    //为空直接返回
    if (ptr == NULL) return;
#ifdef HAVE_MALLOC_SIZE
    //更新已使用内存
    update_zmalloc_stat_free(zmalloc_size(ptr));
    //释放内存
    free(ptr);
#else
    //指针前移，指向申请时实际申请内存大小空间
    realptr = (char*)ptr-PREFIX_SIZE;
    oldsize = *((size_t*)realptr);
    //更新已使用内存
    update_zmalloc_stat_free(oldsize+PREFIX_SIZE);
    free(realptr);
#endif
}
```

### 2.5 其他函数

#### 2.5.1 zstrdup

```c
char *zstrdup(const char *s) {
    //c中字符串以\0结尾，strlen只统计字符串字符数，实际需要多占用一个字节存放\0
    size_t l = strlen(s)+1;
    //分配内存
    char *p = zmalloc(l);
    //拷贝字符串
    memcpy(p,s,l);
    return p;
}
```

#### 2.5.2 zmalloc_used_memory

获取redis已经使用（申请）的内存大小

```c
size_t zmalloc_used_memory(void) {
    size_t um;
    //线程安全模式，加互斥锁访问used_memory，防止zmalloc或zfree等对值的影响
    if (zmalloc_thread_safe) {
#ifdef HAVE_ATOMIC
        um = __sync_add_and_fetch(&used_memory, 0);
#else
        pthread_mutex_lock(&used_memory_mutex);
        um = used_memory;
        pthread_mutex_unlock(&used_memory_mutex);
#endif
    }
    else {
        //非线程安全模式，直接返回
        um = used_memory;
    }

    return um;
}
```

#### 2.5.3 zmalloc_get_rss

```c
#if defined(HAVE_PROC_STAT)
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

size_t zmalloc_get_rss(void) {
    //获取内存页大小
    int page = sysconf(_SC_PAGESIZE);
    size_t rss;
    char buf[4096];
    char filename[256];
    int fd, count;
    char *p, *x;

    snprintf(filename,256,"/proc/%d/stat",getpid());
    if ((fd = open(filename,O_RDONLY)) == -1) return 0;
    if (read(fd,buf,4096) <= 0) {
        close(fd);
        return 0;
    }
    close(fd);

    p = buf;
    count = 23; /* RSS is the 24th field in /proc/<pid>/stat */
    while(p && count--) {
        p = strchr(p,' ');
        if (p) p++;
    }
    if (!p) return 0;
    x = strchr(p,' ');
    if (!x) return 0;
    *x = '\0';

    rss = strtoll(p,NULL,10);
    //一个进程占占用的实际内存等于一页大小乘以实际页个数
    rss *= page;
    return rss;
}
#elif defined(HAVE_TASKINFO)
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/types.h>
#include <sys/sysctl.h>
#include <mach/task.h>
#include <mach/mach_init.h>

size_t zmalloc_get_rss(void) {
    task_t task = MACH_PORT_NULL;
    struct task_basic_info t_info;
    mach_msg_type_number_t t_info_count = TASK_BASIC_INFO_COUNT;

    if (task_for_pid(current_task(), getpid(), &task) != KERN_SUCCESS)
        return 0;
    task_info(task, TASK_BASIC_INFO, (task_info_t)&t_info, &t_info_count);

    return t_info.resident_size;
}
#else
size_t zmalloc_get_rss(void) {
    /* If we can't get the RSS in an OS-specific way for this system just
     * return the memory usage we estimated in zmalloc()..
     *
     * Fragmentation will appear to be always 1 (no fragmentation)
     * of course... */
    return zmalloc_used_memory();
}
#endif
```

!!! note rss
    RSS是常驻内存集（Resident Set Size），表示该进程分配的内存大小。RSS包括共享库占用的内存，所有分配的栈内存和堆内存，不包括进入交换分区的内存。/proc/pid/stat包含了进程的状态信息。

#### 2.5.4 zlibc_free

```
void zlibc_free(void *ptr) {
    free(ptr);
}
```

#### 2.5.5 zmalloc_get_private_dirty

**private_clean与private_dirty**

private指的是当前进程私有的（rss包括一些线程共享的内存空间，主要是一些lib库）。clean指的是从磁盘加载或者零填充的未修改过的页面。因此，如果需要释放这些页面来为其他进程提供内存页面，就可以直接丢弃，在需要的时候可以重新加载或填充。dirty指的是这块空间内容已经更改过了，如果需要释放这块空间，需要将内容写到交换区，以便将来需要的时候可以重新恢复。

```c
#if defined(HAVE_PROC_SMAPS)
size_t zmalloc_get_private_dirty(void) {
    char line[1024];
    size_t pd = 0;
    FILE *fp = fopen("/proc/self/smaps","r");

    if (!fp) return 0;
    while(fgets(line,sizeof(line),fp) != NULL) {
        if (strncmp(line,"Private_Dirty:",14) == 0) {
            char *p = strchr(line,'k');
            if (p) {
                *p = '\0';
                pd += strtol(line+14,NULL,10) * 1024;
            }
        }
    }
    fclose(fp);
    return pd;
}
#else
size_t zmalloc_get_private_dirty(void) {
    return 0;
}
#endif
```

!!! note "/proc/pid/maps"
   /proc/self是一个链接，当进程访问此链接时，就会访问这个进程本身的/proc/pid目录。/proc/pid/smaps显示了每个进程映射的内存消耗，Private_Dirty为Rss中已改写的私有页面。[详情点击](http://liutaihua.github.io/2013/04/25/process-smaps-analysis.html)

操作系统为每一个进程维护了一个虚拟地址空间，虚拟地址空间对应着物理地址空间，在虚拟地址空间上的连续并不代表物理地址空间上的连续。在 linux 编程中，进程调用 fork() 函数后会产生子进程。之前的做法是，将父进程的物理空间为子进程拷贝一份。出于效率的考虑，可以只在父子进程出现写内存操作（内存页为dirty）的时候，才为子进程拷贝一份。如此不仅节省了内存空间，且提高了 fork() 的效率。在持久化过程中，父进程继续提供服务，子进程进行持久化。持久化完毕后，会调用 zmalloc_get_private_dirty() 获取写时拷贝的内存大小，此值实际为子进程在持久化操作过程中所消耗的内存。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200518213220.png)

#### 2.5.6 zmalloc_get_fragmentation_ratio

获取rss与已经使用的内存大小之比，比值越小说明内存负载压力越大。正常情况下数据存储在内存中，但当内存不足时，系统就会创建虚拟内存， 把不常用的内存放到磁盘上， 需要的时候再加载到内存中。如果存在从磁盘上加载数据， 性能必然就会低下了。

```c
float zmalloc_get_fragmentation_ratio(size_t rss) {
    return (float)rss/zmalloc_used_memory();
}
```

## 3. 总结

redis对内存管理函数进行了封装，主要的目的可以分为以下几点

1. 可以统一对redis内存管理进行控制，方便修改。
2. 系统迁移性好，可以很方便地迁移到另一种内存管理库
3. 可以对redis使用的内存有整体的把握，控制内存的分配与回收