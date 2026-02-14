`NUMA（Non-Uniform Memory Access，非一致性内存访问）`是一种多处理器架构，它将系统中的内存分成多个节点，并将每个节点分配给不同的处理器。在 NUMA 架构中，每个处理器可以访问本地节点的内存，但访问远程节点的内存速度较慢。因此，NUMA 架构可以提高多处理器系统的性能和可扩展性。

下图为英特尔S2600系列服务器主板
- 两个CPU插槽，CPU插槽之间有明确的物理间隔，形成两个独立的NUMA节点
- 每个CPU插槽上下两侧各2个内存插槽，每个NUMA四个个内存插槽，共计8个插槽
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250226232655713.png)
通过`lscpu`命令可以查看cpu核心的numa分布
```shell
# 2. #lscpu
Architecture:                    x86_64
CPU op-mode(s):                  32-bit, 64-bit
Byte Order:                      Little Endian
Address sizes:                   46 bits physical, 48 bits virtual
CPU(s):                          104
On-line CPU(s) list:             0-103
Thread(s) per core:              2
Core(s) per socket:              26
Socket(s):                       2
NUMA node(s):                    2
Vendor ID:                       GenuineIntel
CPU family:                      6
Model:                           85
Model name:                      Intel(R) Xeon(R) Gold 6278C CPU @ 2.60GHz
Stepping:                        7
CPU MHz:                         3299.567
CPU max MHz:                     3500.0000
CPU min MHz:                     1000.0000
BogoMIPS:                        5200.00
Virtualization:                  VT-x
L1d cache:                       1.6 MiB
L1i cache:                       1.6 MiB
L2 cache:                        52 MiB
L3 cache:                        71.5 MiB
NUMA node0 CPU(s):               0-25,52-77
NUMA node1 CPU(s):               26-51,78-103
```
- **L1d cache**（L1 数据缓存）：L1数据缓存是最接近CPU核心（物理核）的缓存，存储最近使用的数据。每个CPU核心通常都有独立的 L1 数据缓存。
- **L1i cache**（L1 指令缓存）：L1指令缓存与L1数据缓存类似，但它存储的是指令。每个CPU核心（物理核）通常也有独立的L1指令缓存。
- **L2 cache**（L2 缓存）：L2缓存位于L1缓存之后，容量更大，速度略慢。通常，多个 CPU核心共享一个L2缓存。
- **L3 cache**（L3 缓存）：L3 缓存是所有核心共享的缓存，它的容量更大，但访问速度相对较慢。L3 缓存用于存储更少使用但仍然频繁访问的数据。L3缓存通常是跨NUMA节点共享的
# 1. 背景
现在的计算机系统通常包含多个CPU和多个内存块。以前，我们通常将所有内存看作是一块共享内存，所有处理器对共享内存的访问方式都是相同的，这就是之前普遍使用的SMP模型。但是随着处理器数量的增加，共享内存可能会导致内存访问冲突变得更加严重，并且当内存访问达到瓶颈时，性能将无法继续提高。为了解决这个问题，引入了NUMA（非一致性内存访问）模型。

在NUMA模型中，系统内存被分成多个节点，每个节点被分配给不同的处理器。例如，如果一个系统有2个处理器和8个内存模块，我们将其中一个处理器和四个内存块组合成一个NUMA节点，这样系统就有两个NUMA节点。在物理分布上，同NUAM节点内处理器和内存模块的物理距离更近，因此访问速度更快。

# 2. NUMA节点的物理内存地址规划
在NUMA系统中，物理内存的分布通常是由操作系统管理的。每个NUMA节点的物理内存地址范围通常是**独立**的。例如，如果系统有2个NUMA 节点，每个节点的内存会被分配到不同的物理地址区域，并且通过页表映射到虚拟地址空间。例如，第一个 NUMA 节点的内存地址范围可能是 0x00000000 到 0x10000000，第二个 NUMA 节点的地址范围可能是 0x10000000 到 0x20000000
# 3. 内存亲和性（Memory Affinity）
内存亲和性决定了进程访问本地节点还是远程节点的内存。操作系统会尽量让进程的内存访问本地节点，从而降低访问延迟，提高性能。一般来说，当一个进程被调度到某个节点上时，<span style="background:#fff88f">系统倾向于将该进程的内存分配到同一NUMA节点的内存上</span>，从而减少远程访问（跨节点内存访问）的延迟和带宽瓶颈。操作系统通过策略（如 `NUMA policy`）来决定进程的内存分配方式。例如，Linux 使用 `numactl` 等机制来指定进程在某些节点上分配内存，或者使进程使用本地节点的内存。
# 4. 内存访问
在 NUMA 架构下，物理内存被划分为多个 NUMA 节点（通常是 CPU 插槽或 CPU 内核组）。每个NUMA节点都有自己的本地内存，NUMA节点内的内存访问速度较快，访问其他节点的内存则可能会产生更高的延迟，称为“远程内存访问”。
- **本地内存（Local Memory）**：每个NUMA节点的物理内存与该节点的CPU直接连接，进程如果运行在本地CPU上，访问本地内存速度最快。
- **远程内存（Remote Memory）**：当一个进程在一个节点上运行，但它需要访问另一个节点的内存时，这种访问被称为远程内存访问，通常会比本地内存访问更慢。
```shell
# numastat
                           node0           node1
numa_hit           1793608274381    865106746276
numa_miss                1902135      1637176533
numa_foreign          1637176533         1902135
interleave_hit             19086           19313
local_node         1793595789836       432231689
other_node              14386680    866311691120
```
- **numa_hit**表示进程在本地NUMA节点（即当前 CPU 所在节点）<span style="background:#fff88f">访问本地内存</span>的次数。这个数值越大，表示该节点的 CPU 更多地在访问本地内存，说明该节点的内存访问效率较高。
- **numa_miss**表示进程在本地NUMA节点（当前 CPU 所在节点）<span style="background:#fff88f">访问其他NUMA</span>节点内存的次数，通常会带来较高的延迟。该值越大，说明该节点的 CPU 更多地在访问远程内存，性能上会受到影响，因为远程访问比本地访问更慢。
- **numa_foreign**表示远程NUMA节点访问本地内存的次数，通常是与**numa_miss**对称的。即，**numa_foreign** 是另一个节点的CPU访问当前节点的内存。
-  **interleave_hit**表示交错内存模式下的命中次数。在NUMA系统中，交错内存（Interleave）模式是指内存页面在多个节点间交替分布，以平衡负载。这个统计数值显示了在交错模式下访问内存时的命中次数。这个值的高低表明交错模式的内存访问效果，通常希望此值尽可能大。
# 5. numa内存距离
```shell
# numactl -H
available: 2 nodes (0-1)
node 0 cpus: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77
node 0 size: 191697 MB
node 0 free: 36826 MB
node 1 cpus: 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103
node 1 size: 192972 MB
node 1 free: 43222 MB
node distances:
node   0   1 
  0:  10  21 
  1:  21  10 
```
- `available: 2 nodes (0-1)`表示系统中有2个NUMA节点，编号分别为0和1，表示 NUMA 处于开启状态。若返回信息中 NUMA 节点数为1，即`available: 1 nodes (0)`，则 NUMA 处于关闭状态。
- `node 0 cpus`和`node 1 cpus`列出了每个节点上的CPU列表。每个CPU的编号表示该CPU在系统中的实际编号，CPU列表中的奇数编号表示该CPU所在的核心，偶数编号表示该核心上的线程。
- `node 0 size`和`node 1 size`列出了每个节点的内存总大小，单位为MB。
- `node 0 free`和`node 1 free`列出了每个节点的可用内存大小，单位为MB。
- `node distances`列出了节点之间的距离矩阵。例如，第一行表示节点0到节点0的距离为10，节点0到节点1的距离为21；第二行表示节点1到节点0的距离为21，节点1到节点1的距离为10。距离矩阵的值越小，表示两个节点之间的距离越近。