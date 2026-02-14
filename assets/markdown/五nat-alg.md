 ---
title: NAT ALG
date: 2023-02-01
categories:
- network
tags:
- network
- nat
---

`NAT ALG`能够对特定的应用层协议进行转换，在对这些特定的应用层协议进行`NAT`转换过程中，通过`NAT`的会话信息来改变封装在`IP`报文载荷中的`IP`和端口信息，最终实现`NAT`下应用层协议的正常通信。在第四章中我们介绍的ICMP差错报文也可以算是NAT ALG的一种应用，本文将以`DNS`和`FTP`协议为例，详细阐述一下`NAT ALG`的工作原理。

# 1. DNS
[[应用层DNS协议解析|DNS]]是一个应用层协议，可以根据域名获取对应的`IP`地址。这个`IP`地址是放在DNS响应报文的`Answers`字段中，而整个DNS协议报文都位于四层协议头的`payload`中，普通的NAT并不会识别并替换这个地址。
![|375](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424155506.png)

`NAT ALG`服务于DNS主要有以下两种场景：
1. 私网的客户端访问公网上的DNS服务器进行A查询，根据域名获得私网服务器的私网IP地址。由于公网的DNS服务器解析的是公网地址，因此需要通过`NAT ALG`将DNS响应报文中的`Answers`字段中的公网地址替换为内网主机可以访问的私网IP。
2. 公网的客户端访问私网上的DNS服务器进行A查询，根据域名获得内网服务器的公网IP地址。由于私网的DNS服务器解析的是私网地址，因此需要通过`NAT ALG`将DNS响应报文中的`Answers`字段中的私网地址替换为公网主机可以访问的公网IP。
# 2. FTP
FTP有两种不同工作模式：PORT（主动模式）与PASV（被动模式）。两种模式都需要用到两个连接：控制连接与数据连接，控制连接专门用于FTP控制命令及命令执行信息传输，数据连接专门用于传输数据。
## 2.1. 主动模式
未经过NAT设备的通信过程如下：
1. 客户端用端口N与FTP服务器的21端口建立一个控制通道，发送一条命令告诉FTP服务端（即通常说的PORT命令），我的数据通道的通信地址是IP1，数据通道的端口N+1，服务端收到请求后回复ACK确认。
2. 服务端确认后，用源端口20主动与客户端IP1:N+1建立连接，进行数据通信。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307052323754.png)

主动模式下，客户端的ip和端口放在了载荷中，因此这里我们假设客户端在NAT设备环境下（内网），服务端在外网，经过支持NAT ALG设备后的通信过程如下：
1. 客户端用端口internalPort与FTP服务器的21端口建立一个控制通道，发送一条命令告诉FTP服务端（即通常说的PORT命令），我的数据通道的通信地址是internalPort，数据通道的端口internalPort+1。
2. 报文到达NAT设备，NAT设备识别是FTP协议后，将IP报文的源IP替换为transitIp，源端口替换为transitPort_N，将载荷部分的数据通道通信地址IP1也替换为transitIp，数据通道的端口替换为transitPort_M。此时NAT设备需要生成两个会话，分别用于控制信道和数据信道。
3. 服务端确认后，用源端口20主动与客户端transitIp:transitPort_M建立连接，进行数据通信。
4. 报文到达NAT设备，NAT设备根据数据信道会话将目的ip和端口替换为internalIp和internalPort+1，发送到内网。
## 2.2. 被动模式
未经过NAT设备的通信过程如下：
1. 客户端使用ip1和端口N与FTP服务端(ip2，端口21)建立一个控制通道，发送一条命令告诉服务端（即通常说的PASV命令），我将使用被动模式与你通信。服务端收请求后，会告知客户端我的IP是ip2和监听端口M，你可以和我的这个IP和端口通信。
2. 客户端收到信息后，使用源端口N+1，与服务端ip2:M建立连接，进行数据通信。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307052345354.png)


被动模式下服务端的ip和端口被放在了报文载荷中，因此这里我们假设服务端在NAT设备环境下（内网），客户端在外网，经过支持NAT ALG设备后的通信过程如下：
1. 客户端使用externalIp和端口externalPort与FTP服务端(ip为transitIp，端口transitPort_N)建立一个控制通道，发送一条命令告诉服务端（即通常说的PASV命令），我将使用被动模式与你通信。
2. 【配置DNAT】报文到达NAT设备后，将目的ip替换为internalIp，目的端口替换为internalPort（通常为21）。
3. 服务端收请求后，会告知客户端我的IP是internalIp和监听端口internalPort，你可以和我的这个IP和端口通信。
4. 【配置SNAT】报文到达NAT设备后，NAT设备识别是FTP协议后，将源IP替换为transitIp，源端口替换为transitPort_N，同时将载荷部署的数据通道通信地址替换为transitIp，端口替换为transitPort_M，并生成会话。
5. 客户端收到信息后，使用源端口externalPort+1，与服务端transitIp:transitPort_M建立连接，进行数据通信。
6. 报文到达NAT设备后，匹配已生成会话，将数据报文目的IP替换为internalIp，目的端口替换为internalPort。
# 3. 多通道协议与动态会话
传统的NAT会话都是由内网主机发起的某条流触发生成的，会话也只对这条流生效，根据ip报文的五元组进行匹配和转换。为了适应某些多通道协议，NAT ALG除了根据ip头的五元组生成会话外，还需要根据ip报文载荷中可能包含的ip和端口信息生成额外的会话以支撑其他通道的正常流量转发。

# 4. 参考链接
1. [防火墙ALG技术之DNS协议穿墙术](https://www.ctfiot.com/6506.html)
2. [NAT ALG原理与应用-新华三集团-H3C](http://www.h3c.com/cn/d_201206/922132_30005_0.htm)

