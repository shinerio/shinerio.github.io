---
title: linux命令之route
date: 2021-10-24
categories:
- 计算机网络
tags:
- 计算机网络
- network
- linux
---

计算机或网络设置使用路由表用来计算数据包的下一跳。 route命令用来显示并设置Linux内核中的网络路由表，route命令设置的路由主要是静态路由。要实现两个不同的子网之间的通信，需要一台连接两个网络的路由器，或者同时位于两个网络的网关来实现。

<!--more-->

## 1. 查看路由表

```shell
netstat -n -r 
# 或
route -n
```

![](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635056397569.png)

> windows使用route print

## 2. 字段解释

|  列名 |  作用  |
|-- | -- |
| Destination | 目的地址 |
| Gateway | 网关地址，如果未设置则为* |
| Genmask | 目的地址子网掩码，0.0.0.0为default |
| Flags | 标记 |
| Metric  | 路由距离(一般是到下一跳的跳数)，是大型局域网和广域网设置所必需的(linux内核不使用) |
| Ref | 路由项引用次数(linux内核不使用) |
| Use | 路由表被查找的次数 |
| Iface | 数据包将被发往的网口 |

**flags可选项**

- U  路由启动
- H  目标是个主机
- G  需要经过网关
- R  恢复动态路由产生的表象
- D  由路由的后台程序动态安装
- M  由路由的后台程序修改
- ！ 拒绝路由

## 3. 路由分类
 
 ### 3.1 主机路由

到达单个ip或主机的路由，主机路由可以动态决定每个网络地址的路由，可以用来自动以控制或者调优特定类型的网络流量
 
### 3.2 网络路由

到达特定network ID的路由

### 3.3 默认路由

当目的地址在路由表中没有被匹配时，将匹配默认路由

## 4. route命令详解

route命令的格式如下：
```shell
route [-Options] [Command [Destination] [mask Netmask] [Gateway] [metric Metric]] [if Interface]] 
```

**Options**
- -c 显示更多信息
- -n 不解析名字
- -v 显示详细的处理信息
- -F 显示发送信息
- -C 显示路由缓存
- -f 清除所有网关入口的路由表。 

**Command**
- add  添加一条新路由
- del 删除一条路由

### 4.1 增加一条主机路由

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635058414021.png)

### 4.2 增加一条网络路由

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635058504391.png)

### 4.3 添加或删除默认网关

```shell
route del default gw 64.64.236.1
route add default gw 64.64.236.1
```

### 4.4 添加直连地址 

网关是0.0.0.0，表示目的网段不需要经过路由，是一个直连地址

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635058773611.png)

### 4.4 屏蔽地址

屏蔽到10网段的数据包

![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635058907250.png)

### 4.5 删除路由

```shell
route del -net 10.0.0.0 netmask 255.0.0.0 reject  # 删除屏蔽路由
route del -net 64.64.236.100 netmask 255.255.255.255 # 删除主机路由
route del -net 64.64.236.128 netmask 255.255.255.192 # 删除网络路由
 route del -net 192.168.0.0 netmask 255.255.0.0 # 删除直连地址
 route -n
```

![](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1635056397569.png)


## 5. 持久化路由

使用route添加的路由并不会永久生效，在主机重启后就会丢失。可以利用/etc/rc.local文件，linux会在开机之后自动source执行/etc/rc.local，达到永久保存路由的效果