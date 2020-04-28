---
title: 计算机网络（七）—— 网络层 —— ICMP
date: 2020-04-25
categories:
- 计算机网络
tags:
- 计算机网络

---

互联网控制消息协议（Internet Control Message Protocol，ICMP）是TCP/IP协议族的核心协议之一，用于IP协议中发送控制消息，提供可能发生在通信环境中的各种问题反馈。通过这些消息，使管理者可以对所发生的的问题作出诊断，然后采取适当的措施解决。ICMP可以简单认为是网络环境的DEBUG工具。

<!--more-->

## 1. ICMP报文格式

ICMP是基于IP协议工作的，是网络层协议。ICMP报文包含在IP数据报中，IP报头在ICMP报文的最前面。一个ICMP报文包括IP报头（至少20字节）、ICMP报头（至少八字节）和ICMP报文（属于ICMP报文的数据部分）。当IP报头中的协议字段值为1时，就说明这是一个ICMP报文。ICMP报头从IP报头的第160位开始（IP首部20字节，IP报头使用了可选字段除外）。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200426202102.png)

- <font color=red>Type</font>：ICMP类型
- <font color=red>Code</font>：进一步划分ICMP类型，用来查找产生错误的原因
- <font color=red>校验码</font>：通过ICMP报头和数据部分计算得来
- <font color=red>ID</font>：这个字段包含了ID值，在Echo Reply类型的消息中要返回这个字段。
- <font color=red>序号</font>：这个字段包含一个序号，同样要在Echo Reply类型的消息中要返回这个字段。

!!! note ""
    [Type和Code详细信息参阅Wikipedia](https://zh.wikipedia.org/wiki/互联网控制消息协议)

## 2. ping

我们用的ping操作中就包括了请求（类型字段值为8）和应答（类型字段值为0）ICMP报文。一台主机向一个节点发送一个类型字段值为8（请求）的ICMP报文，如果途中没有异常（没有被路由丢弃，目标不回应ICMP或者传输失败），则目标返回类型字段值为0（应答）的ICMP报文，说明这台主机存在。

### 2.1 ping响应类型

#### 2.1.1 正常

<details>
<summary>wireshark抓包示例：</summary>
<pre>
<font color=blue>请求1</font>
Internet Control Message Protocol
    Type: 8 (Echo (ping) request)
    Code: 0
    Checksum: 0x629d [correct]
    [Checksum Status: Good]
    Identifier (BE): 7509 (0x1d55)
    Identifier (LE): 21789 (0x551d)
    Sequence number (BE): 0 (0x0000)
    Sequence number (LE): 0 (0x0000)
    [Response frame: 34]
    Timestamp from icmp data: Apr 26, 2020 20:40:28.240933000 CST
    [Timestamp from icmp data (relative): 0.000056000 seconds]
    Data (48 bytes)
<font color=blue>响应1</font>
Internet Control Message Protocol
    Type: 0 (Echo (ping) reply)
    Code: 0
    Checksum: 0x6a9d [correct]
    [Checksum Status: Good]
    Identifier (BE): 7509 (0x1d55)
    Identifier (LE): 21789 (0x551d)
    Sequence number (BE): 0 (0x0000)
    Sequence number (LE): 0 (0x0000)
    [Request frame: 31]
    [Response time: 29.529 ms]
    Timestamp from icmp data: Apr 26, 2020 20:40:28.240933000 CST
    [Timestamp from icmp data (relative): 0.029585000 seconds]
    Data (48 bytes)
<font color=blue>请求2</font>
Internet Control Message Protocol
    Type: 8 (Echo (ping) request)
    Code: 0
    Checksum: 0x514a [correct]
    [Checksum Status: Good]
    Identifier (BE): 7509 (0x1d55)
    Identifier (LE): 21789 (0x551d)
    Sequence number (BE): 1 (0x0001)
    Sequence number (LE): 256 (0x0100)
    [Response frame: 50]
    Timestamp from icmp data: Apr 26, 2020 20:40:29.245366000 CST
    [Timestamp from icmp data (relative): 0.000148000 seconds]
    Data (48 bytes)
<font color=blue>响应2</font>
Internet Control Message Protocol
    Type: 0 (Echo (ping) reply)
    Code: 0
    Checksum: 0x594a [correct]
    [Checksum Status: Good]
    Identifier (BE): 7509 (0x1d55)
    Identifier (LE): 21789 (0x551d)
    Sequence number (BE): 1 (0x0001)
    Sequence number (LE): 256 (0x0100)
    [Request frame: 49]
    [Response time: 33.374 ms]
    Timestamp from icmp data: Apr 26, 2020 20:40:29.245366000 CST
    [Timestamp from icmp data (relative): 0.033522000 seconds]
    Data (48 bytes)
</pre>
</details>


#### 2.1.2 超时

```
Request timeout for icmp_seq 0
Request timeout for icmp_seq 1
```

- 对方已关机或ip地址根本不存在
- 对方与自己不在同一网段内，通过路由也无法找到对方
- 对方确实存在，但设置了ICMP数据包过滤

#### 2.1.3 Destination host Unreachable

- 对方与自己不在同一网段内，而自己又未设置默认的路由
- 网线出了故障

!!! note “destination host unreachable”和 “time out”的区别
    如果所经过的路由器的路由表中具有到达目标的路由，而目标因为其他原因不可到达，这时候会出现“time out”，如果路由表中连到达目标的路由都没有，那就会出现“destination host unreachable”。

#### 2.1.4 Bad IP address

这个信息表示可能没有连接到DNS服务器，所以无法解析这个IP地址，也可能是IP地址不存在。

#### 2.1.5 Source quench received

这个信息比较特殊，它出现的机率很少。它表示对方或中途的服务器繁忙无法回应。

#### 2.1.6 Unknown host

这种出错信息的意思是，该远程主机的名字不能被域名服务器（DNS）转换成IP地址。故障原因可能是域名服务器有故障，或者其名字不正确，或者网络管理员的系统与远程主机之间的通信线路有故障。

#### 2.1.7 No answer

种故障说明本地系统有一条通向中心主机的路由，但却接收不到它发给该中心主机的任何信息。故障原因可能是下列之一：中心主机没有工作；本地或中心主机网络配置不正确；本地或中心的路由器没有工作；通信线路有故障；中心主机存在路由选择问题。

#### 2.1.8 no rout to host

网卡工作不正常。

#### 2.1.9 transmit failed,error code:10043

网卡驱动不正常。

#### 2.1.10 unknown host name

DNS配置不正确。

!!! warning 不产生ICMP错误报文的情况
    1. 对ICMP差错报文，不再发送ICMP差错报告报文
    2. 对第一个分片的数据报片的所有后续数据报片，都不发送ICMP差错报告报文
    3. 对具有多播地址的数据报，都不发送ICMP差错报告报文
    4. 对具有特殊地址（如127.0.0.0或0.0.0.0）的数据报，不发送ICMP差错报告报文

### 2.2 IP记录路由

ping使用IP首部的选项字段来记录IP报文经过了哪些主机，IP首部中的选项字段最长40字节。使用`ping -R`选项开启记录。

## 3. traceroute

受ip头选项长度的限制，ping不能完全的记录下所经过的路由器，而traceroute是用来侦测主机到目的主机之间所经路由情况的重要工具。

traceroute的原理如下：

1. 首先给目的主机发送一个TTL=1的UDP数据包，而经过的第一个路由器收到这个数据包以后，就自动把TTL减1，而TTL变为0以后，路由器就把这个包给抛弃了，并同时产生 一个主机不可达的ICMP数据报给主机。
2. 主机收到这个数据报以后再发一个TTL=2的UDP数据报给目的主机，然后刺激第二个路由器给主机发ICMP数据报。
3. 如此往复直到到达目的主机。这样，traceroute就拿到了所有的路由器ip。从而避开了ip头只能记录有限路由IP的问题。

!!! note ""
    源主机如何知道UDP到没到达目的主机呢？这就涉及一个技巧的问题，普通的网络程序只监控少数的几个号码较小的端口，比如说80，23等等。而traceroute发送的是端口号>30000的UDP报，所以到达目的主机的时候，目的主机只能发送一个端口不可达的ICMP数据报给主机。由此，源主机就可以知道数据包到达了目标主机。

