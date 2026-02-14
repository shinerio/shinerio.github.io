在[[NAT Overview]]一文中，我们介绍了在linux下通过iptables实现NAT功能的命令及原理。本文以容器为例，进行几个简单的实验来进一步了解linux下NAT的实现过程和应用。
# 1. nat在容器中的应用
## 1.1. SNAT
linux下一个最典型的NAT应用就是docker容器借助宿主机网络访问外网，执行`iptables -t nat -nvL`可以看到如下输出：
```text
Chain POSTROUTING (policy ACCEPT 33 packets, 2238 bytes)
 pkts bytes target     prot opt in     out     source               destination
    3   211 
	all  --  *      !docker0  172.17.0.0/16        0.0.0.0/0
```

> 任意网口进入，访问非docker0网桥的流量，并且源地址为172.17.0.0/16网段的，把它交给MASQUERADE处理。MASQUERADE作用是从当前出接口上自动获取当前ip地址来做NAT，这样就实现了容器实现宿主机网卡访问外部网络的目的。
### 1.1.1. 抓包结果
在容器中执行`ping 8.8.8.8`，在`docker0`网桥抓包如下：
```shell
[root@vultr ~]# tcpdump icmp -i docker0 -c 4 -nne
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on docker0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:51:54.443718 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 98: 172.17.0.2 > 8.8.8.8: ICMP echo request, id 28, seq 265, length 64
14:51:54.445275 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 98: 8.8.8.8 > 172.17.0.2: ICMP echo reply, id 28, seq 265, length 64
14:51:55.445564 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 98: 172.17.0.2 > 8.8.8.8: ICMP echo request, id 28, seq 266, length 64
14:51:55.446986 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 98: 8.8.8.8 > 172.17.0.2: ICMP echo reply, id 28, seq 266, length 64
```
主机eth0口抓包：
```shell
[root@vultr ~]# tcpdump icmp -i eth0 -c 4 -nne
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:52:36.512507 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 98: 45.77.200.180 > 8.8.8.8: ICMP echo request, id 28, seq 307, length 64
14:52:36.513878 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 98: 8.8.8.8 > 45.77.200.180: ICMP echo reply, id 28, seq 307, length 64
14:52:37.514124 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 98: 45.77.200.180 > 8.8.8.8: ICMP echo request, id 28, seq 308, length 64
14:52:37.515451 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 98: 8.8.8.8 > 45.77.200.180: ICMP echo reply, id 28, seq 308, length 64
```
## 1.2. dnat
容器支持通过`-p`参数将宿主机端口映射到容器端口，原理就是通过iptables实现的dnat。
```shell
[root@vultr ~]# docker run -it -p 10000:8000 centos/python-38-centos7 /bin/bash
(app-root) python -m http.server
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```
执行`iptables -t nat -nvL`可以看到如下规则，其中`ADDRTYPE match dst-type LOCAL`表达的意思是将目的地址类型是主机本地网络的数据包jump到一个名叫docker的链。从非`docker0`网桥上进入的流量，目的端口为10000的转发到容器`172.17.0.2`的8000端口。
```shell
Chain PREROUTING (policy ACCEPT 64 packets, 2997 bytes)
 pkts bytes target     prot opt in     out     source               destination
31428 1534K DOCKER     all  --  *      *       0.0.0.0/0            0.0.0.0/0            ADDRTYPE match dst-type LOCAL
Chain DOCKER (2 references)
 pkts bytes target     prot opt in     out     source               destination
    0     0 RETURN     all  --  docker0 *       0.0.0.0/0            0.0.0.0/0
    0     0 DNAT       tcp  --  !docker0 *       0.0.0.0/0            0.0.0.0/0            tcp dpt:10000 to:172.17.0.2:8000
```
### 1.2.1. 抓包
`eth0`口抓包
```shell
[root@vultr ~]# tcpdump tcp -i eth0 port 10000 -nne
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
15:22:06.799116 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 78: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [S], seq 2189230313, win 65535, options [mss 1440,nop,wscale 6,nop,nop,TS val 3976681198 ecr 0,sackOK,eol], length 0
15:22:06.800136 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 74: 45.77.200.180.10000 > 114.246.99.100.60677: Flags [S.], seq 3797373137, ack 2189230314, win 28960, options [mss 1460,sackOK,TS val 2686973908 ecr 3976681198,nop,wscale 10], length 0
15:22:07.066851 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [.], ack 1, win 2052, options [nop,nop,TS val 3976681467 ecr 2686973908], length 0
15:22:07.067613 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 149: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [P.], seq 1:84, ack 1, win 2052, options [nop,nop,TS val 3976681467 ecr 2686973908], length 83
15:22:07.067658 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 66: 45.77.200.180.10000 > 114.246.99.100.60677: Flags [.], ack 84, win 29, options [nop,nop,TS val 2686974176 ecr 3976681467], length 0
15:22:07.075909 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 220: 45.77.200.180.10000 > 114.246.99.100.60677: Flags [P.], seq 1:155, ack 84, win 29, options [nop,nop,TS val 2686974184 ecr 3976681467], length 154
15:22:07.076074 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 431: 45.77.200.180.10000 > 114.246.99.100.60677: Flags [FP.], seq 155:520, ack 84, win 29, options [nop,nop,TS val 2686974184 ecr 3976681467], length 365
15:22:07.373595 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [.], ack 155, win 2050, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.373655 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [.], ack 521, win 2044, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.374062 06:7c:16:88:fe:87 > 56:00:04:7c:7c:23, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 45.77.200.180.10000: Flags [F.], seq 84, ack 521, win 2048, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.374124 56:00:04:7c:7c:23 > 06:7c:16:88:fe:87, ethertype IPv4 (0x0800), length 66: 45.77.200.180.10000 > 114.246.99.100.60677: Flags [.], ack 85, win 29, options [nop,nop,TS val 2686974482 ecr 3976681774], length 0
```
`docker0`网桥抓包
```shell
[root@vultr ~]# tcpdump tcp -i docker0 port 8000 -nne
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on docker0, link-type EN10MB (Ethernet), capture size 262144 bytes
15:22:06.799241 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 78: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [S], seq 2189230313, win 65535, options [mss 1440,nop,wscale 6,nop,nop,TS val 3976681198 ecr 0,sackOK,eol], length 0
15:22:06.800061 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 74: 172.17.0.2.8000 > 114.246.99.100.60677: Flags [S.], seq 3797373137, ack 2189230314, win 28960, options [mss 1460,sackOK,TS val 2686973908 ecr 3976681198,nop,wscale 10], length 0
15:22:07.066898 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [.], ack 1, win 2052, options [nop,nop,TS val 3976681467 ecr 2686973908], length 0
15:22:07.067625 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 149: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [P.], seq 1:84, ack 1, win 2052, options [nop,nop,TS val 3976681467 ecr 2686973908], length 83
15:22:07.067645 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 66: 172.17.0.2.8000 > 114.246.99.100.60677: Flags [.], ack 84, win 29, options [nop,nop,TS val 2686974176 ecr 3976681467], length 0
15:22:07.075862 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 220: 172.17.0.2.8000 > 114.246.99.100.60677: Flags [P.], seq 1:155, ack 84, win 29, options [nop,nop,TS val 2686974184 ecr 3976681467], length 154
15:22:07.076061 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 431: 172.17.0.2.8000 > 114.246.99.100.60677: Flags [FP.], seq 155:520, ack 84, win 29, options [nop,nop,TS val 2686974184 ecr 3976681467], length 365
15:22:07.373634 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [.], ack 155, win 2050, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.373659 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [.], ack 521, win 2044, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.374070 02:42:d5:35:3a:3c > 02:42:ac:11:00:02, ethertype IPv4 (0x0800), length 66: 114.246.99.100.60677 > 172.17.0.2.8000: Flags [F.], seq 84, ack 521, win 2048, options [nop,nop,TS val 3976681774 ecr 2686974184], length 0
15:22:07.374090 02:42:ac:11:00:02 > 02:42:d5:35:3a:3c, ethertype IPv4 (0x0800), length 66: 172.17.0.2.8000 > 114.246.99.100.60677: Flags [.], ack 85, win 29, options [nop,nop,TS val 2686974482 ecr 3976681774], length 0
```