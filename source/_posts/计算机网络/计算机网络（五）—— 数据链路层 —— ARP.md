---
title: 计算机网络（五）—— 数据链路层 —— ARP
date: 2020-04-24
categories:
- 计算机网络
tags:
- 计算机网络

---

ARP（Address Resolution Protocol，地址解析协议）主要完成由IP地址得到MAC地址的功能。网络层实现主机之间的通信，而链路层实现具体每段链路之间的通信。因此在通信过程中，IP 数据报的源地址和目的地址始终不变，而 MAC 地址随着链路的改变而改变。

<!--more-->

## 1. 交换机原理

交换机根据MAC地址表转发数据帧的。MAC地址表记录着局域网主机MAC地址与交换机端口的对应关系，交换机根据MAC地址表将数据帧转发到指定的端口。交换机在接收到数据帧以后，会将数据帧中的源MAC地址和端口绑定，记录到MAC地址表中。

## 2. ARP

ARP协议非常简单，采用“一问一答”模式。通常上层应用程序只关注IP和端口号，而数据链路层传输需要用到MAC地址。每台主机都会维护一个ARP缓存表，如果目标主要MAC地址不在主机ARP缓存表中，此时就需要ARP协议来获取MAC地址。

### 2.1 ARP包格式

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200428191255.png)

| 字段 | 长度(Byte) |  默认值  |   备注 |
| --- | --- | --- | --- |
| Hardware type |   2                    |    0x1        | 硬件类型，标识链路层协议，默认以太网 |
| Protocol type |  2                    |    0x0800      | 协议类型，标识网络层协议 |
| Hardware size | 1                   |     0x6     | 硬件地址大小，标识MAC地址长度 |
| Protocol size | 1                   |     0x4     | 协议地址大小，标识IP地址长度 |
| 操作码                 | 2                    |                | 操作代码，标识ARP数据包类型，0x1表示ARP请求包,0x2表示应答包 |
| Sender MAC address |  6       |  | 发送者MAC |
| Sender IP address | 4   | | 发送者IP |
| Target MAC address |  6      | | 目标MAC，全0表示在请求 |
| Target IP address | 4       |  | 目标IP |
| 填充数据              | 18              |            |    因为物理帧最小长度为64字节,前面的42字节再加上4个CRC校验字节,还差18个字节 |

### 2.2 wireshark抓包分析

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200428192859.png)

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200428192823.png)

ARP协议采用以太网的广播功能，目标MAC地址为FF:FF:FF:FF:FF:FF，交换机收到广播包时，记录下源MAC地址与端口号的映射，然后会将此数据包发送给同一局域网的其他所有主机。目标主机收到数据包后，发现请求包中的目标IP地址是自己，会返回ARP响应包，而由于请求中携带了源目标地址的MAC地址，此时ARP响应就可以通过单播的方式进行，交换机收到单播包，记录下目标地址的MAC地址和端口号映射关系。此时交换机就可以通过MAC地址表知道如何将源目标数据发送到目标主机。

### 2.3 ARP代理

ARP通过广播包的方式获取MAC地址，而广播包只能工作在同一个网段下的广播域，对于另一个网段下的主机，则需要通过ARP代理完成。在ARP协议中，我们发往其他网段的请求主机物理地址会由路由器回答，得到的就是路由器的物理地址，发送方就根据这个物理地址把数据报发送到路由器，由路由器转发，再下面的事情由路由器完成。

### 2.4 ARP欺骗

ARP欺骗的主要原理是攻击者发送大量加的ARP数据包到网络上，尤其是网关。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200428195143.png)

假如攻击者为PC2，攻击者大量在网上发送ARP请求包，告诉其他设备我的IP是192.168.0.01，我的MAC地址时AA:BB:CC:DD:EE:FF，此时交换机和PC1的ARP表都会受到毒害，原来应该发往网关的数据，现在都被引流到PC2。PC2知道网关的真正MAC地址，其可以对PC1的数据进行监听、篡改（转发至网关）、甚至直接丢弃。



