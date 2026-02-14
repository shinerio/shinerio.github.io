---
title: iptables
date: 2021-10-17
categories:
- 计算机网络
tags:
- 计算机网络
- network
---

iptables 是 Linux 防火墙工作在用户空间的管理工具，是 netfilter/iptablesIP 数据包过滤系统是一部分，用来设置、维护和检查 Linux 内核的 IP 数据包过滤规则。

<!--more-->

# 1. 四表五链
数据包在经过每个的时候会按照每个链对应的表依次进行查询匹配执行的操作，如PREROUTING链对应的就是(raw->mangle->nat)，每个表按照优先级顺序进行连接，每个表中还可能有多个规则，最终形成一条处理链。iptables的表中存储的就是对应的规则和需要执行的操作。

![iptables diagram](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1634463829447.png)

## 1.1. 四表
### 1.1.1. raw
主要用来决定是否对数据包进行状态跟踪，对应的内核模块为iptable_raw。raw表只使用在PREROUTING链和OUTPUT链上，因为优先级最高，从而可以对收到的数据包在系统进行ip_conntrack（连接跟踪）前进行处理。一旦用户使用了raw表，在某个链上，raw表处理完后，将跳过NAT表和ip_conntrack处理，即不再做地址转换和数据包的链接跟踪处理了。RAW表可以应用在那些不需要做nat的情况下，以提高性能。
### 1.1.2. mangle
主要用来修改数据包的服务类型，生存周期，为数据包设置标记，实现流量整形、策略路由等，对应内核模块miptable_mangle
### 1.1.3. nat
主要用来进行网络地址转换，修改数据包的 IP 地址、端口号信息，对应内核模块iptable_nat。
### 1.1.4. filter
用来对数据包进行过滤，具体的规则要求决定如何处理一个数据包，对应内核模块iptable_filter
> [!note]
> 表的处理优先级：raw>mangle>nat>filter

## 1.2. 五链
### 1.2.1. PREROUTING
在对数据包做路由选择之前，将应用此链中的规则
### 1.2.2. INPUT
当收目的地址为本机的数据包时，将应用此链中的规则；
### 1.2.3. FORWARD
当收到目的地址非本机的数据包时，将应用此链中的规则。Forward转发需要开启Linux内核中的ip_forward功能。
### 1.2.4. OUTPUT
当本机向外发送数据包时，将应用此链中的规则
### 1.2.5. POSTROUTING
在对数据包做路由选择之后，将应用此链中的规则

> [!note]
> cat /proc/sys/net/ipv4/ip_forward查看是否开启ip_forward功能。0表示没有启动，1表示已经启动
# 2. iptables使用
## 2.1. 命令
iptables的基本语法如下：
```shell
iptables [-t 表名] 管理选项 [链名] [匹配条件] [-j 控制类型]
```
### 2.1.1. 表名
raw/mangle/nat/filter，默认为filter
### 2.1.2. 管理选项
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
### 2.1.3. 链名
  RREROUTING/INPUT/FORWARD/OUTPUT/POSTROUTING
### 2.1.4. 匹配条件
  - -s 指定源地址或网段，逗号隔开
  - -d 指定目的地址或网段，逗号隔开
  - ! 取反，如! -s 192.168.0.200，表示源地址不是192.168.0.200的都匹配。取反操作是-s和-d选项不能同时指定多个
  - -p协议。tcp, udp, udplite, icmp, icmpv6,esp, ah, sctp, mh或all
  - -i，指定流入数据包网卡，-i eth0，匹配从eth0流入的数据包，只能用于PREROUTING/INPUT/FORWARD
  - -o，指定流出数据包网卡，-i eth0，匹配从eth0流出的数据包，只能用于FORWARD/OUTPUT/POSTROUTING
  - --sport，指定源端口，支持范围。如--sport 10000:20000
  - --dport，指定目的端口，支持范围。如--port 10000:20000
  - -m，选项用于指定要使用的匹配模块（match module），基于不同的标准（如数据包的状态、协议类型、端口范围等）来筛选数据包
#### 2.1.4.1. -m模块示例
##### 2.1.4.1.1. multiport模块
支持指定多个端口。如`-m multiport --sports 22,10000:20000`
##### 2.1.4.1.2. state模块
可依据数据包的连接状态
来匹配，常见的连接状态有 `NEW`（新连接）、`ESTABLISHED`（已建立的连接）、`RELATED`（相关连接）和 `INVALID`（无效连接）。
```shell
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
```
只允许已建立和相关的连接进入
##### 2.1.4.1.3. iprange
模块可用于匹配指定范围内的 IP 地址。
```shell
iptables -A INPUT -m iprange --src-range 192.168.1.100-192.168.1.200 -j ACCEPT
```
允许来自特定 IP 范围（如 192.168.1.100 - 192.168.1.200）的数据包进入
##### 2.1.4.1.4. limit匹配模块
```shell
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m limit --limit 10/min -j ACCEPT
```
限制每分钟最多 10 个新的 SSH 连接请求
### 2.1.5. 控制类型
  - 接收ACCEPT
  - 拒绝REJECT
  - 丢弃DROP
  - 日志LOG
> [!note]
> REJECT和DROP的区别。
> REJECT动作会返回一个拒绝(终止)数据包(TCP FIN或UDP-ICMP-PORT-UNREACHABLE)，明确的拒绝对方的连接动作。连接马上断开，Client会认为访问的主机不存在。
> DROP动作只是简单的直接丢弃数据，并不反馈任何回应。需要Client等待超时，Client容易发现自己被防火墙所阻挡。
## 2.2. 示例
### 2.2.1. 丢且来自x.x.x.x的数据包
```shell
BLOCK_THIS_IP="x.x.x.x"
iptables -A INPUT -s "$BLOCK_THIS_IP" -j DROP
```
### 2.2.2. 阻止来自IP地址x.x.x.x 且入接口为eth0，协议为tcp的包
```shell
BLOCK_THIS_IP="x.x.x.x"
iptables -A INPUT -i eth0 -p tcp -s "$BLOCK_THIS_IP" -j DROP
```
### 2.2.3. 丢弃已建链的数据包
```shell
iptables -A OUTPUT -d 192.168.1.100 -p tcp --dport 5432 -m state --state ESTABLISHED -j DROP
iptables -A INPUT -s 192.168.1.100 -p tcp --sport 5432 -m state --state ESTABLISHED -j DROP
```
### 2.2.4. 允许来自eth0的所有SSH的连接请求，目标端口为22的数据包
```shell
iptables -A INPUT -i eth0 -p tcp --dport 22 -m state --state NEW,ESTABLISHED -j ACCEPT
iptables -A OUTPUT -o eth0 -p tcp --sport 22 -m state --state ESTABLISHED -j ACCEPT
```
### 2.2.5. 不允许外部主机ping内部主机
```shell
iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
iptables -A OUTPUT -p icmp --icmp-type echo-reply -j DROP
```
### 2.2.6. 允许内部主机ping外部主机
```shell
iptables -A OUTPUT -p icmp --icmp-type echo-request -j ACCEPT
iptables -A INPUT -p icmp --icmp-type echo-reply -j ACCEPT
```
### 2.2.7. 日志
对于INPUT链中的所有操作都记录到日志中，添加日志前缀“*** INPUT *** ”并设定日志级别为debug
```shell
iptables -A INPUT -j LOG --log-prefix "*** INPUT ***" --log-level debug
```
### 2.2.8. 自定义链
通过-N参数创建自定义链，将BLOCK链作为控制目标，如：
```shell
iptables -N BLOCK
iptables -A BLOCK -p tcp -s 10.1.1.92/32 --dport 80 -j DROP
iptables -I INPUT 1 -p tcp --dport 80 -j BLOCK
```
INPUT链中匹配规则1的包都会转入BLOCK链中，若到达了BLOCK链的结尾（即未被链中的规则匹配），则会回到INPUT链的下一条规则。如果在子链中匹配了，则就相当于在父链中匹配了，那么它不会再经过父链中的其他规则。
> [!note]
>  iptables -X BLOCK，删除自定义链，iptable -E BLOCK BLOCK_NEW重命名