---
title: NAT之ICMP
date: 2023-02-19
categories:
- network
tags:
- network
- nat
---

`PING`报文没有类似于`TCP`或`UDP`的端口信息，而正常NAT为了内网的安全性和IP地址的高利用率，一般都使用了五元组来匹配NAT会话。为了对ICMP的请求报文进行NAT映射，又要确保网络的安全性，只允许合法的ICMP响应报文进入内网，就必须对其进行特殊的处理。
<!--more-->

# 1. ICMP请求和应答报文
ICMP的request和reply报文中包含两字节的ID，用于区分不同的ICMP进程。对于unix以及类unix系统来说，就是ping进程号。ID仅适用于回显请求和应答ICMP报文，对于目标不可达ICMP报文和超时ICMP报文等，该字段的值为0。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200426202102.png)

根据[[(二)NAT会话]]一文我们可以知道，`TCP`或`UDP`通过五元组`(srcIp,srcPort,dstIp,dstPort,protocol)`来表示一条唯一的流，而对于ICMP报文来说，一条流的唯一性可以由`(srcIp,dstIp,ID)`确认。我们可以为ICMP报文生成特殊的会话格式和会话管理，但显然一个更简单的办法是沿用`TCP`或`UDP`的会话管理模式。`ICMP`协议和`TCP`以及`UDP`协议主要区别在于少了源端口和目的端口。观察到ICMP协议中ID是用来参与标识一条流的，我们很容易想到可以将ID当做是其中一个端口处理，比如源端口（当然目的端口也是可以的，这里只是为了方便会话标记，本身并没有任何协议上的意义）。此外，我们可以将ICMP当成是一种特殊的"服务"，监听在服务器的某个特殊端口，比如端口0，当然我们也可以认为是1或10000或任意的一个数，这个数并不重要，只是用来补齐icmp协议中的目的端口。这样，ICMP便也有了五元组信息，可以像`TCP`和`UDP`一样来进行会话管理。记：
```c
upKey=(internalIp,icmp_id,externalIp,0,protocol_icmp)
downKey=(externalIp,0,transitIp,icmp_id,protocol)
```

# 2. 差错报文

内网主机通过TFTP协议从外网的主机下载文件，但是外网主机并没有开启TFTP服务，这时外网主机会向内网回应ICMP端口不可达的差错报文。对于源地址转换的NAT来说，外网的报文要想顺利进入内网，就必须五元组匹配设备上的NAT会话表项，内网访问外网时使用的是UDP协议，而ICMP差错报文是ICMP协议，这并不符合NAT设备的映射规则。同时ICMP差错报文也并没有像请求和应答报文一样的ID号可供区分。通过抓包可知，icmp差错报文是根据icmp差错报文数据段中的原始IP数据包进行NAT转换的。

内网主机访问外网主机时，设备上会生成一个会话表项，内网主机使用的是UDP协议，源IP和源端口为192.168.200.2/2428，目的IP和目的端口为218.197.70.2/69，NAT设备进行NAT转换后的源IP和源端口为218.197.70.12/1048。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/icmp%E6%9F%A5%E9%94%99%E6%8A%A5%E6%96%87%E5%8E%9F%E5%A7%8B%E6%8A%A5%E6%96%87.png)

外网发到内网的icmp差错报文（NAT前），可以看到原始的UDP报文（经过NAT后的）被封装在了ICMP差错报文的载荷部分。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/icmp%E6%9F%A5%E9%94%99%E6%8A%A5%E6%96%87_NAT%E5%89%8D.jpg)

外网发到内网的icmp差错错报（NAT后），根据内层的UDP报文匹配会话信息，进行NAT转换：
1. 替换外层的目的ip为内网主机的内网地址
2. 替换icmp内层ip报文，源地址替换为原始报文ip，源端口替换为原始报文端口。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/icmp%E5%B7%AE%E9%94%99%E6%8A%A5%E6%96%87_NAT%E5%90%8E.jpg)

同时收到ICMP差错报文后可以对NAT会话进行加速老化，节省NAT设备的资源。