---
title: 计算机网络-应用层（三）-DHCP
date: 2020-04-25
categories:
- 计算机网络
tags:
- 计算机网络
---

DHCP（Dynamic Host Configuration Protocol）动态主机配置协议是一个局域网的网络协议。DHCP协议采用C/S模型，服务器控制一段ip地址，客户机向服务器请求，获得服务器分配的ip地址、子网掩码、网关地址、DNS服务器地址等信息。

<!--more-->

## 1. DHCP的分配机制

- 【自动分配】DHCP服务器为主机制定一个永久性的ip地址，一旦DHCP客户端第一次成功从DHCP服务器端租用到IP地址后，就可以永久性的使用该地址。
- 【动态分配】DHCP服务器给主机制定一个具有时间限制的IP地址，时间到期或主机明确表示放弃该地址时，该地址可以被其他主机使用。
- 【手工分配】客户端的IP地址由网络管理员指定的，DHCP服务器只是将指定的IP地址告诉客户端主机。

> 这三种分配方式中，只有动态分配可以重复使用客户端不再需要的IP地址

## 2. DHCP报文

DHCP基于UDP传输，DHCP服务器使用端口号67，DHCP 客户端使用端口号68。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200425144347.png)

【Op】：报文类型，Request（1），Reply(2)

【HW Type】：硬件类型，一般是以外网（1）

【HW Len】：硬件地址长度，单位字节。对应以太网mac地址为6字节

【Transcation ID】DHCP Request 时产生的数值，以作 Reply 时的依据

【Secs】：距离第一次发送IP请求或Renew请求过去的秒数

【Flags】：从 0 到 15 共 16 bits ，最左一 bit 为 1 时表示 server 将以广播方式传送给 client ，其余尚未使用

【Client IP Address】：要是 client 端想继续使用之前取得之 IP 地址，则列于这里。

【Your IP Address】：服务器端给客户端分配的IP地址

【(Next) Server IP Address】：若 client 需要透过网络开机，从 server 送出之 DHCP OFFER、DHCPACK、DHCPNACK封包中，此栏填写开机程序代码所在 server 之地址。

【Gateway (Relay) IP Address】：若需跨网域进行 DHCP 发放，此栏为 relay agent 的地址，否则为 0。

【Server Name】：Server名字，一般不适用，填充为0

【Boot File name】：boot file的路径，一般不使用，填充为0

【Option】：选项，不定长度

## 3. DHCP报文之Option

　DHCP从Bootp拓展而来，DHCP报文也是有Bootp报文发展而来。但是DHCP在Bootp之上添加了许多功能，其报文也需要有一定的拓展。如果Bootp报文不能满足的内容，就以Option的形式存在于DHCP报文中。DHCP协议其实就是携带许多Option的Bootp。

　DHCP有许多类型的Option，长度不一（但都是整数字节）。Option遵循以下格式:
+ 如果Option没有值，则只有标志位之类的内容，则以一个字节表示
+ 如果Opiton有值，即Opiton是以下name-value对，则Opiton需要多个字节表示，其中第一个字节表示 option的名字，第二字节表示value的长度，第三个字节开始表示value。

| Option | 名称 | 描述 |
| ------ | ---- | ---- |
| 0	| Pad |	填充位 |
| 1	| Subnet Mask	| 子网掩码 |
| 3	| Router Address	| 路由器地址 |
| 6	| DNS	| DNS server |
| 15	| DN	| 域名 |
| 50	| Requested IP Address	| 请求的IP地址 |
| 51 | Address Lease Time	| 地址租约时间 |
| 53	| DHCP Message Type | 	DHCP 消息类型，如Discover、Request、Offer、ACK等 |
| 54	| Server Identifier	| 服务器标识 |
| 55	| Parameter Request List	| 参数请求列表 |
| 56	| DHCP Error Message	| DHCP错误消息 |
| 58	| Lease Renewal Time	| 租约续期时间 |
| 61	| Client Identifier	| 客户标识 |
| 119	| Domain Search List	| 域名查找列表 |
| 255 |	End	| 结束 |

以上是常用的Option，DHCP报文以Option 255标志报文结束

### 3.1 DHCP Message Type

| DHCP消息类型 |	对应的Option值 |
| --- | --- |
| DHCPDISCOVER |	1 |
| DHCPOFFER |	2 |
| DHCPREQUEST |	 3 |
| DHCPDECLINE |	4 |
| DHCPACK |	5 |
| DHCPNAK |	6 |
| DHCPRELEASE |	7 |
| DHCPINFORM |	8 |
| DHCPFORCERENEW |	9 |
| DHCPLEASEQUERY |	10 |
| DHCPLEASEUNASSIGNED |	11 |
| DHCPLEASEUNKNOWN |	12 |
| DHCPLEASEACTIVE |	13 |

### 3.2 DHCP抓包分析

- DHCP请求

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200425160708.png)

- DHCP响应

![image-20200425160919292](/Users/zhangrui/Library/Application Support/typora-user-images/image-20200425160919292.png)

## 4. DHCP工作流程

1. <font color=red>发现阶段</font>。 即DHCP客户机寻找DHCP服务器的阶段。DHCP客户机以广播方式（因为DHCP服务器的IP地址对于客户机来说是未知的）发送**DHCP discover**发现信息来寻找DHCP服务器，即向地址255.255.255.255发送特定的广播信息。网络上每一台安装了TCP/IP协议的主机都会接收到这种广播信息，但只有DHCP服务器才会做出响应。

2. <font color=red>提供阶段</font>。DHCP服务器提供IP地址的阶段。在网络中接收到DHCP discover发现信息的DHCP服务器都会做出响应，它从尚未出租的IP地址中挑选一个分配给DHCP客户机，向DHCP客户机发送一个包含出租的IP地址和其他设置的**DHCP offer**提供信息。

3. <font color=red>选择阶段</font>。DHCP客户机选择某台DHCP服务器提供的IP地址的阶段。如果有多台DHCP服务器向DHCP客户机发来的DHCP offer提供信息，则DHCP客户机只接受第一个收到的DHCP offer提供信息，然后它就以广播方式回答一个**DHCP request**请求信息，该信息中包含向它所选定的DHCP服务器请求IP地址的内容。之所以要以广播方式回答，是为了通知所有的DHCP服务器，他将选择某台DHCP服务器所提供的IP地址。

4. <font color=red>确认阶段</font>。DHCP服务器确认所提供的IP地址的阶段。当DHCP服务器收到DHCP客户机回答的DHCP request请求信息之后，它便向DHCP客户机发送一个包含它所提供的IP地址和其他设置的**DHCP ack**确认信息，告诉DHCP客户机可以使用它所提供的IP地址。然后DHCP客户机便将其TCP/IP协议与网卡绑定，另外，除DHCP客户机选中的服务器外，其他的DHCP服务器都将收回曾提供的IP地址。

    DHCP客户机收到ack报文后，会针对获得的IP地址发送ARP Request，进行IP地址冲突检测。

   1. 如果IP地址已经被其他主机使用，则Client放弃该IP地址，向Server发送DHCP DECLINE报文告诉Server该地址不能使用。然后一段时间后（一般10s）再此尝试获取该IP地址
   2. 如果Client仍然无法使用该IP地址，则发送DHCP RELEASE报文，放弃该地址。

5. <font color=red>重新登录</font>。以后DHCP客户机每次重新登录网络时，就不需要再发送DHCP discover发现信息了，而是直接发送包含前一次所分配的IP地址的DHCP request请求信息。当DHCP服务器收到这一信息后，它会尝试让DHCP客户机继续使用原来的IP地址，并回答一个DHCP ack确认信息。如果此IP地址已无法再分配给原来的DHCP客户机使用时（比如此IP地址已分配给其它DHCP客户机使用），则DHCP服务器给DHCP客户机回答一个DHCP nack否认信息。当原来的DHCP客户机收到此DHCP nack否认信息后，它就必须重新发送DHCP discover发现信息来请求新的IP地址。

6. <font color=red>更新租约</font>。DHCP服务器向DHCP客户机出租的IP地址一般都有一个租借期限，期满后DHCP服务器便会收回出租的IP地址。如果DHCP客户机要延长其IP租约，则必须更新其IP租约。DHCP客户机启动时和IP租约期限过一半时，DHCP客户机都会自动向DHCP服务器发送更新其IP租约的信息。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200425170404.png)