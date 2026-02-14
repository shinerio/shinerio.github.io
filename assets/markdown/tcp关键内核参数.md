# 1. tcp_syn_retries
这个参数值设置的是client发送SYN如果server端不回复的话，<font color="#ff0000">重传SYN的次数</font>。对我们的直接影响就是connet建立连接时的超时时间。当然Java通过一些C原生系统调用的组合使得我们可以进行超时时间的设置。在Linux里面默认设置是5，下面给出建议值3和默认值5之间的超时时间。

|tcp_syn_retries|timeout|
|---|---|
|1|min(so_sndtimeo,3s)|
|2|min(so_sndtimeo,7s)|
|3|min(so_sndtimeo,15s)|
|4|min(so_sndtimeo,31s)|
|5|min(so_sndtimeo,63s)|
![[Pasted image 20250323171012.png]]
```bash
sysctl net.ipv4.tcp_syn_retries
net.ipv4.tcp_syn_retries = 1
```

>[!note]
>如果我们在应用中忘记了设置[[数据库关键配置#2. connectTimeout|connectTimeout]]，同时tcp_syn_retries如果设置为5，就会需要1分钟才会超时断连。
# 2. trp_retries2
![[Tcp重传#1.4. 重传机制]]
# 3. tcp_tw_reuse和tcp_tw_recycle
## 3.1. tcp timewait
TIME_WAIT 是主动断开连接的一方会出现的，客户端，服务器都有可能出现。当客户端主动断开连接时，发出最后一个ACK后就会处于 TIME_WAIT状态。当服务器主动断开连接时，发出最后一个ACK后就会处于 TIME_WAIT状态

目的：
1. 为了可靠地关闭TCP连接，能够在对端没有收到ACK，从而发生FIN重传情况下有机会重新发送ACK
2.  防止上一次连接中的包，迷路后重新出现，影响新连接

TIME_WAIT状态持续2MSL时间，MSL就是maximum segment lifetime(最大报文段的生命期），这是一个IP数据包能在互联网上生存的最长时间，超过这个时间将在网络中消失（被丢弃）。RFC 793中规定MSL为2分钟，实际应用中，可能为30S，1分钟，2分钟。

ubuntu系统，输入如下命令后可以看到，时间为60秒
```shell
root@vultr:~# sysctl net.ipv4.tcp_fin_timeout
net.ipv4.tcp_fin_timeout = 30
```
## 3.2. timestamp
PAWS（Protection Against Wrapped Sequences，防绕回序列号）功能基于TCP的Timestamps选项实现，用于拒绝接收到的过期的重复报文。PAWS假设每个报文都携带有TSopt选项数据，其中的时间戳TSval保持单调递增，所有，当接收到一个报文其TSval值小于之前在此连接中接收到的时间戳（ts_recent），即认定此报文为<font color="#ff0000">过期报文，将其丢弃</font>。

时间戳（Timestamp）是基于<font color="#ff0000">IP粒度</font>的，这意味着如果存在一个时间戳比较晚的连接，那么所有比这个时间戳早的tcp连接都无法成功建立。

默认情况下内核是开启timestamps选项的。可通过PROC文件tcp_timestamps控制选项行为：
- 值为0时，表示关闭timestamps选项
- 值为1时，表示使能RFC1323（最新-RFC7323）中定义的timestamps选项，并且使用随机偏移值与timesstamp叠加，以抵御攻击
- 值为2时，仅开启timestamps选项，不使用偏移值。
## 3.3. tcp_tw_recycle
开启 (`1`) 该参数后，系统会加快回收 TIME-WAIT状态的TCP连接，减少 TIME-WAIT 连接占用的资源（如端口和内存）。   
```c
=====linux-2.6.37 net/ipv4/tcp.c 126================
#define TCP_RTO_MAX ((unsigned)(120*HZ))
#define TCP_RTO_MIN ((unsigned)(HZ/5))
==========================================
```
这里的HZ是1s，因此可以得出RTO最大是120s，最小是200ms，对于局域网的机器来说，正常情况下RTO基本上就是200ms，因[3.5 RTO就是700ms](https://zhuanlan.zhihu.com/p/567088021)。也就是说，快速回收是TIME_WAIT的状态持续700ms，而不是正常的2MSL。因此我们很难在开启后看到TIME_WAIT状态，我们不停通过命令的查看TIME_WAIT状态的连接，偶尔才能看到1个。
### 3.3.1. 基于时间戳 (TCP Timestamp) 机制
`tcp_tw_recycle` 依赖 TCP 时间戳选项（`tcp_timestamps` 需要开启）。它通过检查 TCP 时间戳来判断是否可以安全地回收 TIME-WAIT 连接。

如果TIME_WAIT期间，其远程主机向当前主机发起tcp连接，则其timestamp必须存在且严格递增，否则丢弃请求。  对于TIME_WAIT结束后的连接请求，则不再校验其timestamp。
### 3.3.2. 存在的问题
如果`tcp_tw_recycle=1`，对同一个IP的连接会存在限制，后建立的连接的时间戳必须要**大于**之前建立连接的最后时间戳。如果同时满足了以下条件，就会导致后面的连接无法成功建立。
- 不同的机器使用同一个NAT的IP
- 时间不同步，且后建立连接的的主机时间落后
- 前面的连接还处于`timewait`状态

下图就是一个常见问题
- 内网 `nginx1 (10.1.1.10)` 和 `nginx2 (10.1.1.20)` 复用防火墙（NAT）同一个`IP(20.1.1.1)`访问外部 `appserver (30.1.1.1)`。
- `nginx1` 连接成功后，`外部 appserver` 记录 `nginx1` 的时间戳。
- `nginx2` 再次发起连接时，如果它的时间戳比 `nginx1` 小，`外部 appserver` 直接丢弃请求。`nginx2`基本永远没有机会连接到`appserver`。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250321215215207.png)
原理如下：

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250321213244504.png)
> [!warning]
由于这个参数导致的问题，高版本内核已经去掉了这个参数，也强烈建议<font color="#ff0000">不要</font>打开这个参数。Linux 内核从**[4.12 版本](https://web.git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=4396e46187ca5070219b81773c4e65088dac50cc)**开始**移除了 `tcp_tw_recycle`**
## 3.4. tcp_tw_reuse
如果开启该选项的话，客户端在调用connect()函数时，**内核会随机找一个TIME_WAIT状态超过1秒的连接给新的连接复用**。这其实就是相当于缩短了TIME_WAIT状态的持续时间。
> [!note]
`tcp_tw_reuse`主要针对客户端，在客户端主动关闭连接的情况下，可以快速复用time_wait状态连接。这种情况下，服务端属于被动关闭，在收到最后一个ack的时候就已经关闭了连接了。同时，客户端复用连接，能够保证不出现时间倒退的情况，因此是相对安全的。

在不同的 Linux 内核版本中，`tcp_tw_reuse`的默认值有所不同：
- **旧内核版本**：在早期的 Linux 内核里，`tcp_tw_reuse`默认是关闭的，其值为0
- **较新内核版本**：从 Linux 内核 3.7 开始，`tcp_tw_reuse`默认是开启的，值为1
这里既然我们缩短了TIME_WAIT状态的时间，使其不是2MSL，那么因为引入TIME_WAIT解决的问题就再次出现了，所以tcp_tw_reuse也需要解决这两个问题：
1. 防止历史连接中的数据，被后面相同四元组的连接错误的接收
2. 保证被动关闭连接的一方能够正确的关闭
### 3.4.1. 问题一
因为如果在历史连接上建立了新的连接，而网络中此时还有历史连接残留的数据包存活，那么它们有可能在新连接建立之后到达，那么就会导致接收到错误的数据。TIME_WAIT的解决方法就是等待2MSL之后才进入CLOSED，也就是说耗死了网络中残留的数据包，保证新连接建立时历史数据包全都死亡了。

防回绕序列号算法要求连接双方维护最近一次收到的数据包的时间戳（Recent TSval），每收到一个新数据包都会读取数据包中的时间戳值跟 Recent TSval 值做比较，**如果发现收到的数据包中时间戳不是递增的，则表示该数据包是过期的，就会直接丢弃这个数据包**。历史数据包显然时间戳必然是早于新连接建立后保存的时间戳的，所以就避免了接收旧连接残留数据的问题。

序列号本来也是递增的，正常来说延迟的数据包重新到达时序号是对不上的，因为这期间有其他新的数据包到达，会改变期待的序列号。而如果在延迟期间序列号兜了一圈又回到了原本的位置，那么延迟的数据包正好就能被正确的读取，这会导致数据错误，而时间戳保存了最近一次收到数据包的时间，所以就避免了这种情况。
> [!note]
序列号会回绕，所以无法根据序列号来判断当前数据包是不是旧的数据包。

所以显然使用tcp_tw_reuse需要打开 TCP 时间戳选项，即`net.ipv4.tcp_timestamps=1`（默认即为 1）。

但是其实tcp_tw_reuse还是存在风险：因为PAWS算法不会防止过期的RST，所以如果前面有残留的RST报文，在新连接建立之后到达，那么就会导致新连接被这个历史的RST包中断。如果此时不跳过TIME_WAIT状态，而是停留2MSL时长，那么这个RST报文就不会出现下一个新的连接。
### 3.4.2. 问题二
tcp_tw_reuse并没办法解决，如果第四次挥手的ACK报文丢失了，而此时这个端口已经被另一个连接使用了，那么原服务端重发的FIN就会发送失败，从而接收到RST报文而异常关闭。所以说tcp_tw_reuse还是存在风险的。
# 4. ref
[Linux上TCP的几个内核参数调优](https://www.cnblogs.com/alchemystar/p/13175276.html)
https://xiaolincoding.com/network/3_tcp/tcp_tw_reuse_close.html#tcp-tw-reuse-%E6%98%AF%E4%BB%80%E4%B9%88