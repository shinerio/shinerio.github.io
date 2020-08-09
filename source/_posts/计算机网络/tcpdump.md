---
title: tcpdump
date: 2020-08-09
categories:
- 计算机网络
tags:
- 计算机网络
- network
---

tcpdump是一个优秀的网络分析工具，提供了强大且简单的接口。

## 1. options

- **-i any** 监听所有的网卡接口，用来查看是否有网络流量
- **-i eth0** 只监听eth0网卡接口
- **-D** 显示可用的接口列表
- **-n** 不要解析主机名
- **-nn** 不要解析主机名或者端口名
- **-q** 显示更少的输出(更加quiet)
- **-t** 输出可读的时间戳
- **-tttt** 输出最大程度可读的时间戳
- **-X** 以hex和ASCII两种形式显示包的内容
- **-XX** 与**-X**类似，增加以太网header的显示
- **-v, -vv, -vvv** 显示更加多的包信息
- **-c** 只读取x个包，然后停止
- **-s** 指定每一个包捕获的长度，单位是byte，使用`-s0`可以捕获整个包的内容
- **-S** 输出绝对的序列号
- **-e** 获取以太网header
- **-E** 使用提供的秘钥解密IPSEC流量

## 2. Example

### 2.1 监听所有网卡接口

```shell
tcpdump -i any
```

### 2.2 监听制定网卡接口

```bash
tcpdump -i eth0
```

### 2.3 显示可用接口列表

```bash
tcpdump -D
```

### 2.4 指定ip

```bash
tcpdump host 8.8.8.8
```

08:12:42.050004 IP 64.64.238.73.16clouds.com > dns.google: ICMP echo request, id 27320, seq 1, length 64
08:12:42.059723 IP dns.google > 64.64.238.73.16clouds.com: ICMP echo reply, id 27320, seq 1, length 64
08:12:43.050762 IP 64.64.238.73.16clouds.com > dns.google: ICMP echo request, id 27320, seq 2, length 64
08:12:43.051410 IP dns.google > 64.64.238.73.16clouds.com: ICMP echo reply, id 27320, seq 2, length 64
08:12:44.058965 IP 64.64.238.73.16clouds.com > dns.google: ICMP echo request, id 27320, seq 3, length 64
08:12:44.059281 IP dns.google > 64.64.238.73.16clouds.com: ICMP echo reply, id 27320, seq 3, length 64

### 2.5 显示绝对序列号

```bash
tcpdump -S host google.com
```

08:39:14.977056 IP 64.64.238.73.16clouds.com.56270 > lax31s12-in-f14.1e100.net.https: Flags [P.], seq 1389390438:1389390527, ack 2289481827, win 292, options [nop,nop,TS val 2079502004 ecr 4062705777], length 89
08:39:14.977429 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [P.], seq 2289481827:2289481858, ack 1389390527, win 240, options [nop,nop,TS val 4062731918 ecr 2079502004], length 31
08:39:14.977457 IP 64.64.238.73.16clouds.com.56270 > lax31s12-in-f14.1e100.net.https: Flags [P.], seq 1389390527:1389390822, ack 2289481858, win 292, options [nop,nop,TS val 2079502005 ecr 4062731918], length 295
08:39:14.982669 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [.], ack 1389390822, win 244, options [nop,nop,TS val 4062731923 ecr 2079502005], length 0
08:39:15.016514 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [P.], seq 2289481858:2289482742, ack 1389390822, win 244, options [nop,nop,TS val 4062731957 ecr 2079502005], length 884
08:39:15.016558 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [P.], seq 2289482742:2289484160, ack 1389390822, win 244, options [nop,nop,TS val 4062731957 ecr 2079502005], length 1418
08:39:15.016578 IP 64.64.238.73.16clouds.com.56270 > lax31s12-in-f14.1e100.net.https: Flags [.], ack 2289484160, win 337, options [nop,nop,TS val 2079502044 ecr 4062731957], length 0
08:39:15.016593 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [P.], seq 2289484160:2289484819, ack 1389390822, win 244, options [nop,nop,TS val 4062731957 ecr 2079502005], length 659
08:39:15.016603 IP lax31s12-in-f14.1e100.net.https > 64.64.238.73.16clouds.com.56270: Flags [P.], seq 2289484819:2289486237, ack 1389390822, win 244, options [nop,nop,TS val 4062731957 ecr 2079502005], length 1418
08:39:15.016608 IP 64.64.238.73.16clouds.com.56270 > lax31s12-in-f14.1e100.net.https: Flags [.], ack 2289486237, win 382, options [nop,nop,TS val 2079502044 ecr 4062731957], length 0

- seq为tcp报文的序列号，按包内数据字节长度加上，如包内数据是21字节，而当前IP1发到IP2的包的seq是10的话，那下个IP1发到IP2的包的seq就是10+21=31
- ack为已经收到的报文的序列号，告诉对方下次从seq=ack处继续发报文
- win是剩余窗口大小，如win=0，表示窗口已满，告知对方暂停发包

### 2.6 不解析ip和端口号

```bash
tcpdump -nn host 8.8.8.8
```

08:46:48.586465 IP 64.64.238.73 > 8.8.8.8: ICMP echo request, id 27537, seq 1, length 64
08:46:48.586921 IP 8.8.8.8 > 64.64.238.73: ICMP echo reply, id 27537, seq 1, length 64
08:46:49.594835 IP 64.64.238.73 > 8.8.8.8: ICMP echo request, id 27537, seq 2, length 64
08:46:49.596609 IP 8.8.8.8 > 64.64.238.73: ICMP echo reply, id 27537, seq 2, length 64
08:46:50.594823 IP 64.64.238.73 > 8.8.8.8: ICMP echo request, id 27537, seq 3, length 64
08:46:50.595311 IP 8.8.8.8 > 64.64.238.73: ICMP echo reply, id 27537, seq 3, length 64

### 2.7 指定协议

```bash
tcpdump icmp
```

### 2.8 指定源或目的地址

```bash
tcpdump src 64.64.238.73
tcpdump dst 8.8.8.8
```

### 2.9 指定子网

```bash
tcpdump net 192.168.0.0/16
```

### 2.10 指定端口范围

```bash
tcpdump portrange 0-5000
```

### 2.11基于包的大小过滤流量

```bash
tcpdump less 32
tcpdump greater 64
tcpdump <=128
```

### 2.12 读取指定数量的包

```bash
tcpdump -c 10
```

### 3. 导入/导出

可以使用-w导出成PCAP，使用wireshark等可视化工具打开，或使用-r导入

```bash
tcpdump -c 10 -w test.pcap
tcpdump -r test.pcap
```

## 4. 组合

- AND: **and** or **&&**
- OR: **or** or **||**
- EXCEPT: **not** or !

```bash
tcpdump -nnvvS src 10.5.2.3 and dst port 3389
tcpdump -nvX src net 192.168.0.0/16 and dst net 10.0.0.0/8 or 172.16.0.0/16
tcpdump dst 192.168.0.2 and src net and not icmp
tcpdump 'src 10.0.2.3 and (dst port 3389 or 22)'
```

## 5. 指定的TCP标识

### 5.1 显示所有的URGENT (URG)包

```
tcpdump 'tcp[13] & 32!=0'
```

### 5.2 显示所有的ACKNOWLEDGE (ACK)包

```
tcpdump 'tcp[13] & 16!=0'
```

#### 5.3 显示所有的PUSH(PSH)包

```
tcpdump 'tcp[13] & 8!=0'
```

### 5.4 显示所有的RESET(RST)包

```
tcpdump 'tcp[13] & 4!=0'
```

### 5.5 显示所有的SYNCHRONIZE (SYN) 包

```
tcpdump 'tcp[13] & 2!=0'
```

### 5.6 显示所有的FINISH(FIN)包

```
tcpdump 'tcp[13] & 1!=0'
```

### 5.7 显示所有的SYNCHRONIZE/ACKNOWLEDGE (SYNACK)包

```
tcpdump 'tcp[13]=18'
```

## 6. 参考链接

[tcpdump简明教程](https://github.com/mylxsw/growing-up/blob/master/doc/tcpdump简明教程.md)