# 1. 基本概念
- Socket: 指的是主板上用于安装物理CPU芯片的接口。每一个这样的接口能够插入一个物理的CPU处理器，一台计算机可以配备多个这样的插槽，进而安装多个物理CPU，以增强系统的计算能力和性能。一个物理CPU可以有多个物理CPU核。
- 物理核(`physical core/processor`): 可以看的到的，真实的cpu核，有独立的电路元件以及L1,L2缓存，可以独立地执行指令。
- 逻辑核( `logical core/processor`，LCPU): 在同一个物理核内，逻辑层面的核。（比喻，像动画片一样，我们看到的“动画”，其实是一帧一帧静态的画面，24帧/s连起来就骗过了人类的眼睛，看起来像动起来一样。逻辑核也一样，物理核通过高速运算，让应用程序以为有两个cpu在运算）。
- 超线程( `Hyper-threading`， HT)：超线程可以在一个逻辑核等待指令执行的间隔(等待从cache或内存中获取下一条指令)，把时间片分配到另一个逻辑核。高速在这两个逻辑核之间切换，让应用程序感知不到这个间隔，误认为自己是独占了一个核。

> [!tip]
> 一个CPU可以有多个物理核。如果开启了超线程，一个物理核可以分成n个逻辑核，n为超线程的数量。

下图中有两个物理核，每个核有两个超线程（逻辑核），其中0-3为物理核，而8-11是物理核通过超线程技术模拟出来的逻辑核心。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202503202314672.png)

# 2. lscpu命令
```shell
lscpu
```
- `CPU(s)`：表示逻辑CPU的总数。
- `Core(s) per socket`：每个 CPU 插槽的物理核心数。
- `Socket(s)`：CPU 插槽的数量。
- `Thread(s) per core`：每个物理核心的线程数。
物理核心数 = `Core(s) per socket` × `Socket(s)`，下图为2 × 1 = 2
逻辑核心数 = 物理核心数 × Thread(s) per coce，下图为2 x 2 = 4

示例：
```
CPU(s):                          32
Core(s) per socket:              8
Socket(s):                       2
Thread(s) per core:              2
```
- `Socket(s): 2`：表明主板上有2个CPU插槽，并且每个插槽都安装了物理CPU。
- `Core(s) per socket: 8`：意味着每个物理CPU含8个物理核心。
- 综合这两个信息，我们可以算出系统中物理核心的总数为 16（8 核心/插槽 × 2 插槽）。
- `Thread(s) per core: 2` 表示每个物理核心有2个线程，结合前面的物理核心总数，可知逻辑 CPU 的总数为 32（16 物理核心 × 2 线程/核心），这与 `CPU(s): 32 相吻合。
# 3. /proc/cpuinfo文件
```shell
grep 'physical id' /proc/cpuinfo | sort -u | wc -l # 物理CPU个数
grep 'core id' /proc/cpuinfo | sort -u | wc -l # 物理核心数
grep 'processor' /proc/cpuinfo | wc -l # 逻辑核心数
```
