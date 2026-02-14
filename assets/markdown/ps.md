`ps`命令是process status的简称，用于显示当前运行的进程的信息。在不使用任何标识的情况下，`ps`会显示所有当前用户启动的进程，比如：
```shell
$ ps
  PID TTY          TIME CMD
 9961 pts/0    00:00:00 bash
 9981 pts/0    00:00:00 ps
```
- PID: 进程的ID号
- TTY: 终端名称缩写
- TIME: CPU时间，即进程使用CPU的总时间
- CMD: 所执行的命令名称。
# 1. 参数
`ps`命令支持的参数很多，这里我们只列出常用的一些。
- `a`显示当前终端所有进程
- `-A`显示系统所有进程
- `e`显示每个进程使用的环境变量
- `-e`显示所有进程，等价于`-A`
- `-f`显示进程之间关系
- `-H`显示树桩结构
- `u`显示进程的归属用户及内存的使用情况
- `x`显示没有控制终端的进程
# 2. 常见使用方式
## 2.1. ps -ef
显示所有进程的pid、启动命令和父进程pid，常配合管道符`|`和`grep`来查找某个特定进程。
```shell
  UID   PID  PPID   C STIME   TTY           TIME CMD
    0     1     0   0 11:36AM ??         1:18.88 /sbin/launchd
    0    85     1   0 11:36AM ??         1:16.91 /usr/libexec/logd
    0    86     1   0 11:36AM ??         0:06.62 /usr/libexec/UserEventAgent (System)
    0    89     1   0 11:36AM ??         0:01.04 /System/Library/PrivateFrameworks/Uninstall.framework/Resources/uninstalld
```
-   UID：启动用户ID
-   PID：进程ID
-   PPID：父进程 ID
-   C：CPU用于计算执行优先级的因子。数值越大，表明进程是CPU密集型运算，执行优先级会降低；数值越小，表明进程是I/O密集型运算，执行优先级会提高。
-   STIME：进程启动的时间
-   TTY：终端名称缩写
-   TIME：CPU时间，即进程使用CPU的总时间
-   CMD：启动进程所用的命令和参数
## 2.2. ps –aux
适合于需要查看进程更多的详细信息，包括系统资源占用情况、进程状态等。
```shell
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.8  77664  8668 ?        Ss    2022   1:08 /sbin/init
root         2  0.0  0.0      0     0 ?        S     2022   0:05 [kthreadd]
root         4  0.0  0.0      0     0 ?        I<    2022   0:00 [kworker/0:0H]
root         6  0.0  0.0      0     0 ?        I<    2022   0:00 [mm_percpu_wq]
```
-   USER：用户名称
-   PID：进程号
-   %CPU：进程占用CPU的百分比
-   %MEM：进程占用物理内存的百分比
-   VSZ：进程占用的虚拟内存大小（单位：KB）
-   RSS：进程占用的物理内存大小（单位：KB）
-   TTY：终端名称缩写
-   STAT：进程状态，其中 `S（Sleep）可中断，`s-表示该进程是会话的先导进程。
-   STARTED：进程的启动时间
-   TIME：CPU时间，即进程使用CPU的总时间
-   COMMAND：启动进程所用的命令和参数，如果过长会被截断显示
## 2.3. ps -o
`ps -o` 是 `ps` 命令的一个强大用法，`ps` 命令用于显示当前系统的进程状态，而 `-o` 选项可以让你自定义要显示的进程信息列，从而满足不同的查看需求。
基本语法为：
```shell
ps -o 列名1,列名2,列名3...
```
- **`pid`**：进程的唯一标识符。
- **`user`**：启动该进程的用户。
- **`%cpu`**：进程占用 CPU 的百分比。
- **`%mem`**：进程占用内存的百分比。
- **`vsz`**：进程使用的虚拟内存大小（单位：KB）。
- **`rss`**：进程使用的物理内存大小（单位：KB）。
- **`tty`**：进程关联的终端设备。
- **`stat`**：进程的状态，如 `S`（睡眠）、`R`（运行）、`Z`（僵尸）等。
- **`start`**：进程启动的时间。
- **`time`**：进程占用 CPU 的总时间。
- **`cmd`**：启动进程的命令。
- **`psr`**：显示进程当前运行在哪个 CPU 核心上（CPU 编号）。
```shell
# ps ax -o pid,comm,%cpu,%mem,psr
    PID COMMAND         %CPU %MEM PSR
      1 systemd          0.0  1.0   0
      2 kthreadd         0.0  0.0   0
```
## 2.4. ps排序
使用`--sort`进行排序，格式如`--sort=[+|-] key`，+代表升序，-代表降序
```shell
# 按内存升序排列：
ps aux --sort=rss 
# 按CPU降序排列
ps aux --sort=-%cpu
```
# 3. 指标解释
## 3.1. CPU使用率
- **Elapsed CPU usage（累计 CPU 使用率）**：指的是从某个特定的起始时间点到当前时刻，进程或系统使用 CPU 的总时间占比。它反映了在一段<font color="#ff0000">较长时间内 CPU 资源的累计消耗情况</font>。例如，一个进程从启动到现在已经运行了 10 分钟，在这 10 分钟内它总共占用了 CPU 5 分钟的时间，那么它的 elapsed CPU usage 就是 50%。通过这个指标，可以了解一个进程或系统在一段时间内对 CPU 资源的整体占用程度，有助于分析长期的资源使用趋势和性能表现。
- **Recent CPU usage（最近 CPU 使用率）**：通常是指在最近的<font color="#ff0000">一个较短时间间隔内，进程或系统使用 CPU 的时间占比</font>。这个时间间隔可以是几秒钟、几分钟等，具体取决于测量的频率和设置。例如，测量最近 1 分钟内某个进程使用 CPU 的时间，如果在这 1 分钟内该进程占用了 CPU 30 秒，那么它的 recent CPU usage 就是 50%。该指标更侧重于反映当前或近期的CPU使用情况，能够及时捕捉到进程或系统对 CPU 资源需求的快速变化，对于实时监控和及时发现性能问题非常有帮助。例如，当系统出现卡顿或响应变慢时，查看 recent CPU usage 可以快速确定是否是由于某个进程在近期突然占用了大量的 CPU 资源导致的。
## 3.2. TTY
`TTY` 是 “TeleTYpewriter” 的缩写，它表示进程所关联的终端设备。具体含义如下：
- 如果显示为一个具体的终端设备名称，如 `pts/0`、`tty1` 等，说明该进程是通过这个终端启动的，或者与这个终端有交互。其中，`pts/` 表示伪终端，通常用于远程登录或通过终端模拟器启动的进程；`tty` 表示物理终端或虚拟控制台。
- 如果显示为 `?`，则表示该进程没有关联到任何终端设备，这类进程通常是作为后台服务或守护进程运行的，它们在系统启动时自动启动，不需要用户通过终端进行交互操作。
**作用**：通过 `TTY` 信息，可以了解进程与终端的关联情况，有助于判断进程的启动方式和运行环境。例如，当你看到一个进程的 `TTY` 是 `pts/0`，就知道它是通过某个远程连接或终端模拟器启动的，而 `TTY` 为 `?` 的进程通常是在后台默默运行，不依赖于用户的终端输入输出。
# 4. ref
1.  -A      Display information about other users' processes, including those without controlling terminals. 列出所有进程（包括其他用户或无控制终端的进程）
2. -e      Identical to -A.
3. -a      Display information about other users' processes as well as your own.  This will skip any processes which do not have a controlling terminal, unless the -x option is also specified. 列出所有进程（包括其他用户，但是不包含没有控制终端的进程）。`-ax`组合使用时等效于`-A`
4. -c      Change the “command” column output to just contain the executable name, rather than the full command line. COMMAND列仅包含可执行文件的名称，而不包含完整的命令行
5. -E      Display the environment as well.  This does not reflect changes in the environment after process launch. 显示进程的环境变量
6. -X      When displaying processes matched by other options, skip any processes which do not have a controlling terminal. 不显示没有控制终端的进程。
7. -x      When displaying processes matched by other options, include processes which do not have a controlling terminal.  This is the opposite of the -X option.  If both -X and -x are specified in the same command, then ps will use the one which was specified last. 和-X相反，显示包括没有控制终端的进程。-x和-X一起用时，以最后出现的那个选项为准.
## 4.1. 输出详细信息
1. -f      Display the uid, pid, parent pid, recent CPU usage, process start time, controlling tty, elapsed CPU usage, and the associated command.  If the -u option is also used, display the user name rather then the numeric uid.  When -o or -O is used to add to the display following -f, the command field is not truncated as severely as it is in other formats. 显示UID,PID,PPID,最近CPU使用率,进程启动时间,tty,累计CPU使用率以及关联的命令。
2. -v      Display information associated with the following keywords: pid, state, time, sl, re, pagein, vsz, rss, lim, tsiz, %cpu, %mem, and command.  The -v option implies the -m option. `-v`参数隐含了`-m`参数
3. -w      Use 132 columns to display information, instead of the default which is your window size.  If the -w option is specified more than once, ps will use as many columns as necessary without regard for your window size.  When output is not to a terminal, an unlimited number of columns are always used. 默认情况下，`ps`命令输出的每行内容宽度有限，当进程的命令行参数、环境变量等信息较长时，超出部分会被截断显示。使用`-w`参数后，可使输出的宽度增加，让更多信息完整呈现。多次使用`-ww`可以累加
4. -l      Display information associated with the following keywords: uid, pid, ppid, flags, cpu, pri, nice, vsz=SZ, rss, wchan, state=S, paddr=ADDR, tty, time, and command=CMD.
## 4.2. 指定用户或用户组
1. -U      Display the processes belonging to the specified real user IDs.
2. -u      Display the processes belonging to the specified usernames.
3. -G      Display information about processes which are running with the specified real group IDs.
4. -g      Display information about processes with the specified process group leaders.