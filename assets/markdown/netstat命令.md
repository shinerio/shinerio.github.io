---
title: netstat命令
date: 2023-01-24
categories:
- linux
tags:
- linux
---

`netstat`是基于Netstat这个命令行工具的指令，它可以用来查询系统上的网络套接字连接情况，包括`tcp`,`udp`以及`Unix套接字`。另外它还能列出路由表，接口状态和多播成员等信息。

<!--more-->

# 1. 参数选项

| 参数  | 作用                                                                  |     |
| --- | ------------------------------------------------------------------- | --- |
| -n  | 使用数字形式表示网络地址                                                        |     |
| -a  | 可以列出系统中所有的网络连接，包括正在建立的连接、已经建立的连接以及处于监听状态的端口，也包括time-wait状态和udp端口监听。 |     |
| -c  | 每隔一段时间自动执行netstat命令                                                 |     |
| -s  | 按照每隔协议来分类统计                                                         |     |
| -t  | 显示tcp相关选项                                                           |     |
| -u  | 显示udp相关选项                                                           |     |
| -e  | 显示额外信息                                                              |     |
| -p  | 显示与连接有关的程序名和进程                                                      |     |
| -r  | 显示路由信息，等效于`route -n`                                                |     |
| -l  | 显示监控中的服务器的Socket                                                    |     |


# 2. 常用命令
## 2.1. 查看udp端口使用情况
netstat -anpu 
## 2.2. 查看所有监听端口
netstat -lntp 
## 2.3. 查看所有已经建立的连接
netstat -antp
## 2.4. 查看网络统计信息
```shell
netstat -s
Ip:
  184695 total packets received
  0 forwarded
  0 incoming packets discarded
  184687 incoming packets delivered
  143917 requests sent out
  32 outgoing packets dropped
  30 dropped because of missing route
Icmp:
  676 ICMP messages received
  5 input ICMP message failed.
  ICMP input histogram:
    destination unreachable: 44
    echo requests: 287
    echo replies: 345
  304 ICMP messages sent
  0 ICMP messages failed
  ICMP output histogram:
    destination unreachable: 17
    echo replies: 287
Tcp:
  473 active connections openings
  28 passive connection openings
  4 failed connection attempts
  11 connection resets received
  1 connections established
  178253 segments received
  137936 segments send out
  29 segments retransmited
  0 bad segments received.
  336 resets sent
Udp:
  5714 packets received
  8 packets to unknown port received.
  0 packet receive errors
  5419 packets sent
TcpExt:
  1 resets received for embryonic SYN_RECV sockets
  ArpFilter: 0
  12 TCP sockets finished time wait in fast timer
  572 delayed acks sent
  3 delayed acks further delayed because of locked socket
  13766 packets directly queued to recvmsg prequeue.
  1101482 packets directly received from backlog
  19599861 packets directly received from prequeue
  46860 packets header predicted
  14541 packets header predicted and directly queued to user
  TCPPureAcks: 12259
  TCPHPAcks: 9119
  TCPRenoRecovery: 0
  TCPSackRecovery: 0
  TCPSACKReneging: 0
  TCPFACKReorder: 0
  TCPSACKReorder: 0
  TCPRenoReorder: 0
  TCPTSReorder: 0
  TCPFullUndo: 0
  TCPPartialUndo: 0
  TCPDSACKUndo: 0
  TCPLossUndo: 0
  TCPLoss: 0
  TCPLostRetransmit: 0
  TCPRenoFailures: 0
  TCPSackFailures: 0
  TCPLossFailures: 0
  TCPFastRetrans: 0
  TCPForwardRetrans: 0
  TCPSlowStartRetrans: 0
  TCPTimeouts: 29
  TCPRenoRecoveryFail: 0
  TCPSackRecoveryFail: 0
  TCPSchedulerFailed: 0
  TCPRcvCollapsed: 0
  TCPDSACKOldSent: 0
  TCPDSACKOfoSent: 0
  TCPDSACKRecv: 0
  TCPDSACKOfoRecv: 0
  TCPAbortOnSyn: 0
  TCPAbortOnData: 1
  TCPAbortOnClose: 0
  TCPAbortOnMemory: 0
  TCPAbortOnTimeout: 3
  TCPAbortOnLinger: 0
  TCPAbortFailed: 3
  TCPMemoryPressures: 0
```





