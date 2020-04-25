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

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200425144347.png)

