---
title: 计算机网络（十三）—— web访问全过程
date: 2020-04-28
categories:
- 计算机网络
tags:
- 计算机网络
---

本文以校园网内一台服务器访问互联网web站点为例，对计算机网络的课程进行总结。

<!--more-->

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200428214215.png)

## 1. 网络初始化

- 广域网采用PPP建立数据链路，进入“网络协议状态”，局域网通过CSMA/CD协商信道使用。
- school network采用RIP生成内部路由信息
- AS1, AS2,As3使用OSPF生成路由信息
- 不同AS之间通过BGP协议交换路由信息。

## 2. DHCP

PC1通过DHCP或静态指定的方式获取网络配置信息（ip地址、子网掩码、DNS等）

!!! note
    PC1通过广播的形式发送DHCP请求包，交换机在MAC表中记录PC1的MAC地址和端口对应关系，DHCP服务器从DHCP请求包中直接拿到PC1的MAC地址，想PC1发送DHCP响应。交换机也能从DHCP响应报文中学习到DHCP服务器的MAC地址，全程不需要ARP协议参与。

## 3. ARP

PC1请求www.shinerio.cc，向本地DNS服务器器请求域名解析。PC1拿着从DHCP得到的本地DNS服务器的IP发起ARP请求。DNS服务器收到ARP请求，发现以太网帧目的IP地址与自己相同，于是发送ARP响应告知PC1自己的MAC地址。同时，交换机更新本地DNS服务器的MAC地址。

## 4. DNS

PC1得到本地DNS服务器MAC地址，向本地DNS服务器发起域名解析请求，本地DNS服务器未找到www.shinerio.cc的解析信息，于是向根DNS发起域名解析请求。本地DNS服务器请求scool network网关转发，网关将请求包路由至ISP服务商，然后到根域名服务器。根域名服务器逐级向下查找，得到www.shinerio.cc对应的ip地址，发送响应给本地DNS服务器，本地DNS服务器告知PC1 web服务器ip地址。

## 5. TCP

主机拿到web服务器地址，与web服务器80端口通过TCP三次握手建立会话。

主机发送http request请求消息，web服务器通过http response响应对应信息。浏览器收到响应后，抽取web页面内容，进行渲染，显示界面。





