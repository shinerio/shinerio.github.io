---
title: iptables
date: 2021-10-017
categories:
- 计算机网络
tags:
- 计算机网络
- network
---

iptables 是 Linux 防火墙工作在用户空间的管理工具，是 netfilter/iptablesIP 数据包过滤系统是一部分，用来设置、维护和检查 Linux 内核的 IP 数据包过滤规则。

<!--more-->

## 1. 四表五链


数据包在经过每个的时候会按照每个链对应的表依次进行查询匹配执行的操作，如PREROUTING链对应的就是(raw->mangle->nat)，每个表按照优先级顺序进行连接，每个表中还可能有多个规则，最终形成一条处理链。iptables的表中存储的就是对应的规则和需要执行的操作。

![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](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1634463829447.png)

### 1.1 四表

1. raw
   主要用来决定是否对数据包进行状态跟踪，对应的内核模块为iptable_raw。raw表只使用在PREROUTING链和OUTPUT链上，因为优先级最高，从而可以对收到的数据包在系统进行ip_conntrack（连接跟踪）前进行处理。一旦用户使用了raw表，在某个链上，raw表处理完后，将跳过NAT表和ip_conntrack处理，即不再做地址转换和数据包的链接跟踪处理了。RAW表可以应用在那些不需要做nat的情况下，以提高性能。
2. mangle
   主要用来修改数据包的服务类型，生存周期，为数据包设置标记，实现流量整形、策略路由等，对应内核模块miptable_mangle
3. nat
    主要用来进行网络地址转换，修改数据包的 IP 地址、端口号信息，对应内核模块iptable_nat。
4. filter
   用来对数据包进行过滤，具体的规则要求决定如何处理一个数据包，对应内核模块iptable_filter

> 表的处理优先级：raw>mangle>nat>filter

### 1.2  五链

1. PREROUTING
   在对数据包做路由选择之前，将应用此链中的规则
2. INPUT
   当收目的地址为本机的数据包时，将应用此链中的规则；
3. FORWARD
   当收到目的地址非本机的数据包时，将应用此链中的规则。Forward转发需要开启Linux内核中的ip_forward功能。
4. OUTPUT
   当本机向外发送数据包时，将应用此链中的规则
5. POSTROUTING
   在对数据包做路由选择之后，将应用此链中的规则

> cat /proc/sys/net/ipv4/ip_forward查看是否开启ip_forward功能。0表示没有启动，1表示已经启动

## 2. iptables使用


### 2.1 命令

iptables的基本语法如下：

```shell
iptables [-t 表名] 管理选项 [链名] [匹配条件] [-j 控制类型]
```

- 表名
  raw/mangle/nat/filter，默认为filter
- 管理选项
  -  -A:在指定链的末尾添加一条新的规则
  -  -D:删除指定链中的某一条规则，可删除指定序号或具体内容
  -  -I:在指定链中插入一条新规则，未指定序号时默认作为第一条规则
  -  -R:修改、替换指定链中的某一条规则，可指定规则序号或具体内容
  -  -L:列出指定链中所有的规则，未指定链名，则列出表中的所有链
  -  -F:清空指定链中所有的规则，未指定链名，则清空表中的所有链
  -  -P:设置指定链的默认策略
  -  -n:使用数字形式显示输出结果
  -  -v:查看规则列表时显示详细的信息
  -  -h:查看命令帮助信息
  -  --line-numbers:查看规则列表时，同时显示规则在链中的顺序号
- 链名
  RREROUTING/INPUT/FORWARD/OUTPUT/POSTROUTING
- 匹配条件
  - -s 指定源地址或网段，逗号隔开
  - -d 指定目的地址或网段，逗号隔开
  - ! 取反，如! -s 192.168.0.200，表示源地址不是192.168.0.200的都匹配。取反操作是-s和-d选项不能同时指定多个
  - -p协议。tcp, udp, udplite, icmp, icmpv6,esp, ah, sctp, mh或all
  - -i，指定流入数据包网卡，-i eth0，匹配从eth0流入的数据包，只能用于PREROUTING/INPUT/FORWARD
  - -o，指定流出数据包网卡，-i eth0，匹配从eth0流出的数据包，只能用于FORWARD/OUTPUT/POSTROUTING
  - --sport，指定源端口，支持范围。如--sport 10000:20000
  - --dport，指定目的端口，支持范围。如--port 10000:20000
  - --m multiport，支持指定多个端口。如 --m multiport --sports 22,10000:20000
- 控制类型
  - 接收accept
  - 拒绝reject
  - 丢弃drop
  - 日志LOG

> reject和drop的区别。
> reject动作会返回一个拒绝(终止)数据包(TCP FIN或UDP-ICMP-PORT-UNREACHABLE)，明确的拒绝对方的连接动作。连接马上断开，Client会认为访问的主机不存在。
> drop动作只是简单的直接丢弃数据，并不反馈任何回应。需要Client等待超时，Client容易发现自己被防火墙所阻挡。

**示例**
1. 丢且来自x.x.x.x的数据包

```shell
BLOCK_THIS_IP="x.x.x.x"
iptables -A INPUT -s "$BLOCK_THIS_IP" -j DROP
```
2. 阻止来自IP地址x.x.x.x eth0 tcp的包

```shell
BLOCK_THIS_IP="x.x.x.x"
iptables -A INPUT -i eth0 -p tcp -s "$BLOCK_THIS_IP" -j DROP
```

3. 允许来自eth0的所有SSH的连接请求，并且目标端口为22的数据包

```shell
iptables -A INPUT -i eth0 -p tcp --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -o eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
```

4.  不允许外部主机ping内部主机

```shell
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
iptables -A OUTPUT -p icmp --icmp-type echo-reply -j DROP
```

4.  允许内部主机ping外部主机

```shell
iptables -A OUTPUT -p icmp --icmp-type echo-request -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-reply -j ACCEPT
```

### 2.2 日志