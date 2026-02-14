# 1. geneve协议格式
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250106234908676.png)
GENEVE与VXLAN类似，仍然是Ethernet over UDP，也就是用UDP封装Ethernet。VXLAN header是固定长度的（8个字节，其中包含24bit VNI），与VXLAN不同的是，GENEVE header中增加了TLV（Type-Length-Value），由8个字节的固定长度和0~252个字节变长的TLV组成。GENEVE header中的TLV代表了可扩展的元数据。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250107000425787.png)
- Version（2bit）：目前是0
- Opt Len（6bit）：以4字节为单位，表明Variable Length Options的长度。因为只有6bit，所以Variable Length Options最多是252（63*4）字节。
- O（1bit）：表明这是一个OAM包，包含了控制信息，而非数据。Endpoint可以根据这个bit来优先处理这个包。
- C（1bit）：表明在Variable Length Options里面，存在一个或者多个Critical的option。当C被置位时，Variable Length Options必须被解析，如果当前Endpoint不支持GENEVE解析，那么应该丢弃数据包。如果C没有被置位，那么Endpoint可以根据Opt Len直接丢弃所有的Variable Length Options。
- Rsvd.（6bit）：保留字段。
- Protocol Type（16bit）：被封装的协议类型，例如Ethernet就是0x6558。这个字段的存在，使得GENEVE封装其他的二层协议成为可能。
- VNI（24bit）：VNI。
- Reserved（8bit）：保留字段。
- pVariable Length Options：由TLV构成，包含了可扩展的元数据。
# 2. 基础实验
宿主机添加geneve口，配置路由下一跳指向geneve口
```shell
# host a with ip 192.168.0.251
sudo ip link add name geneve0 type geneve id 1000 remote 10.0.0.250
sudo ip link set geneve0 up
sudo ip addr add 11.200.1.1/32 dev geneve0
sudo ip route add 11.200.2.1/32 dev geneve0

# host b with ip 192.168.0.250
sudo ip link add name geneve0 type geneve id 1000 remote 10.0.0.251
sudo ip link set geneve0 up
sudo ip addr add 11.200.2.1/32 dev geneve0
sudo ip route add 11.200.1.1/32 dev geneve0
```
host a抓包
```shell
root@iZbp13m4rux6j370521ygbZ:~# tcpdump udp port 6081 -nne -vvvv
tcpdump: listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
22:47:57.358107 ee:ff:ff:ff:ff:ff > 00:16:3e:13:d7:e3, ethertype IPv4 (0x0800), length 148: (tos 0x0, ttl 64, id 32272, offset 0, flags [none], proto UDP (17), length 134)
    10.0.0.250.13206 > 10.0.0.251.6081: [no cksum] Geneve, Flags [none], vni 0x3e8, proto TEB (0x6558)
	f6:ed:db:8e:76:6e > 76:4d:d9:e8:20:34, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 53977, offset 0, flags [DF], proto ICMP (1), length 84)
    11.200.2.1 > 11.200.1.1: ICMP echo request, id 4534, seq 45, length 64
22:47:57.358154 00:16:3e:13:d7:e3 > ee:ff:ff:ff:ff:ff, ethertype IPv4 (0x0800), length 148: (tos 0x0, ttl 64, id 15677, offset 0, flags [none], proto UDP (17), length 134)
    10.0.0.251.50482 > 10.0.0.250.6081: [no cksum] Geneve, Flags [none], vni 0x3e8, proto TEB (0x6558)
	76:4d:d9:e8:20:34 > f6:ed:db:8e:76:6e, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 18896, offset 0, flags [none], proto ICMP (1), length 84)
    11.200.1.1 > 11.200.2.1: ICMP echo reply, id 4534, seq 45, length 64
22:47:58.382102 ee:ff:ff:ff:ff:ff > 00:16:3e:13:d7:e3, ethertype IPv4 (0x0800), length 148: (tos 0x0, ttl 64, id 32583, offset 0, flags [none], proto UDP (17), length 134)
    10.0.0.250.13206 > 10.0.0.251.6081: [no cksum] Geneve, Flags [none], vni 0x3e8, proto TEB (0x6558)
	f6:ed:db:8e:76:6e > 76:4d:d9:e8:20:34, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 54651, offset 0, flags [DF], proto ICMP (1), length 84)
    11.200.2.1 > 11.200.1.1: ICMP echo request, id 4534, seq 46, length 64
22:47:58.382151 00:16:3e:13:d7:e3 > ee:ff:ff:ff:ff:ff, ethertype IPv4 (0x0800), length 148: (tos 0x0, ttl 64, id 16143, offset 0, flags [none], proto UDP (17), length 134)
    10.0.0.251.50482 > 10.0.0.250.6081: [no cksum] Geneve, Flags [none], vni 0x3e8, proto TEB (0x6558)
	76:4d:d9:e8:20:34 > f6:ed:db:8e:76:6e, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 19382, offset 0, flags [none], proto ICMP (1), length 84)
    11.200.1.1 > 11.200.2.1: ICMP echo reply, id 4534, seq 46, length 64
```
# 3. geneve口放置到自定义网桥中
将geneve口放到网桥上，路由下一跳指向br0
```shell
# host a with ip 192.168.0.251
brctl addbr br0
ip address add 12.200.1.1/24 dev br0
ip link set br0 up
ip link add name geneve1 type geneve vni 1000 remote 10.0.0.250 dstport 6082
ip link set geneve1 up
brctl addif br0 geneve1

# host a with ip 192.168.0.250
brctl addbr br0
ip address add 12.200.1.2/24 dev br0
ip link set br0 up
ip link add name geneve1 type geneve vni 1000 remote 10.0.0.251 dstport 6082
ip link set geneve1 up
brctl addif br0 geneve1
```
抓包如下
![[6082.pcap]]
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250102231759112.png)
br0口始发，通过geneve隧道发起arp request。arp报文是通过geneve1口学习到的，所以br0会把发往对端的流量送到geneve1口。
> 注意：主机和br0网桥各有一张mac表
```shell
root@iZbp1b28f6ecl05u00dl9lZ:~# arp -n
Address                  HWtype  HWaddress           Flags Mask            Iface
169.254.67.1                     (incomplete)                              veth-host
169.254.67.1             ether   ce:97:8e:75:90:df   C                     br0
10.0.0.253               ether   ee:ff:ff:ff:ff:ff   C                     eth0
12.200.1.2               ether   8a:8f:4c:0a:71:c1   C                     br0
10.0.0.250               ether   ee:ff:ff:ff:ff:ff   C                     eth0
root@iZbp1b28f6ecl05u00dl9lZ:~# brctl showmacs br0
port no	mac addr		is local?	ageing timer
  2	76:7c:8c:b6:9e:01	yes		   0.00
  2	76:7c:8c:b6:9e:01	yes		   0.00
  1	8a:8f:4c:0a:71:c1	no		   3.02
  1	ba:04:f4:74:9d:8f	yes		   0.00
  1	ba:04:f4:74:9d:8f	yes		   0.00
root@iZbp1b28f6ecl05u00dl9lZ:~# brctl show br0
bridge name	bridge id		STP enabled	interfaces
br0		8000.6e25202550d3	no		    geneve1
							            veth-host
```
# 4. 容器使用geneve隧道
## 4.1. 将geneve隧道直接移到容器命名空间
host a
```shell
docker run -itd --privileged --network=none --name client1 myubuntu bash
# 查找容器的进程ID 
PID=$(docker inspect -f '{{.State.Pid }}' client1)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID

ip link add name geneve1 type geneve vni 1000 remote 10.0.0.250 dstport 6082
ip link set geneve1 netns $PID
ip netns exec $PID ip link set geneve1 up
ip netns exec $PID ip addr add 169.254.67.1/32 dev geneve1
ip netns exec $PID ip route add default dev geneve1
```
host b
```shell
brctl addbr br0
ip address add 12.200.1.2/24 dev br0
ip link set br0 up
ip link add name geneve1 type geneve vni 1000 remote 10.0.0.251 dstport 6082
ip link set geneve1 up
brctl addif br0 geneve1
ip route add 169.254.67.1/32 dev br0
```
### 4.1.1. 抓包分析
在host a容器中执行`ping 12.200.1.2`

host b的br0网桥抓包
```shell
tcpdump: listening on br0, link-type EN10MB (Ethernet), capture size 262144 bytes
17:31:59.955468 ae:3d:e0:0c:58:73 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806), length 42: Ethernet (len 6), IPv4 (len 4), Request who-has 12.200.1.2 tell 169.254.67.1, length 28
17:31:59.955508 5a:d5:32:45:37:9e > ae:3d:e0:0c:58:73, ethertype ARP (0x0806), length 42: Ethernet (len 6), IPv4 (len 4), Reply 12.200.1.2 is-at 5a:d5:32:45:37:9e, length 28
17:31:59.956375 ae:3d:e0:0c:58:73 > 5a:d5:32:45:37:9e, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 7972, offset 0, flags [DF], proto ICMP (1), length 84)
    169.254.67.1 > 12.200.1.2: ICMP echo request, id 83, seq 1, length 64
17:31:59.956419 5a:d5:32:45:37:9e > ae:3d:e0:0c:58:73, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 11877, offset 0, flags [none], proto ICMP (1), length 84)
    12.200.1.2 > 169.254.67.1: ICMP echo reply, id 83, seq 1, length 64
```
host b的geneve1口抓包
```shell
tcpdump: listening on geneve1, link-type EN10MB (Ethernet), capture size 262144 bytes
17:31:59.955468 ae:3d:e0:0c:58:73 > ff:ff:ff:ff:ff:ff, ethertype ARP (0x0806), length 42: Ethernet (len 6), IPv4 (len 4), Request who-has 12.200.1.2 tell 169.254.67.1, length 28
17:31:59.955512 5a:d5:32:45:37:9e > ae:3d:e0:0c:58:73, ethertype ARP (0x0806), length 42: Ethernet (len 6), IPv4 (len 4), Reply 12.200.1.2 is-at 5a:d5:32:45:37:9e, length 28
17:31:59.956375 ae:3d:e0:0c:58:73 > 5a:d5:32:45:37:9e, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 7972, offset 0, flags [DF], proto ICMP (1), length 84)
    169.254.67.1 > 12.200.1.2: ICMP echo request, id 83, seq 1, length 64
17:31:59.956422 5a:d5:32:45:37:9e > ae:3d:e0:0c:58:73, ethertype IPv4 (0x0800), length 98: (tos 0x0, ttl 64, id 11877, offset 0, flags [none], proto ICMP (1), length 84)
    12.200.1.2 > 169.254.67.1: ICMP echo reply, id 83, seq 1, length 64
```
host b上接口信息
```shell
15: br0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 5a:d5:32:45:37:9e brd ff:ff:ff:ff:ff:ff
    inet 12.200.1.2/24 scope global br0
       valid_lft forever preferred_lft forever
    inet6 fe80::504c:edff:fe1f:9a5d/64 scope link 
       valid_lft forever preferred_lft forever
16: geneve1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br0 state UNKNOWN group default qlen 1000
    link/ether 5a:d5:32:45:37:9e brd ff:ff:ff:ff:ff:ff
    inet 12.200.1.3/24 scope global geneve1
       valid_lft forever preferred_lft forever
    inet6 fe80::58d5:32ff:fe45:379e/64 scope link 
       valid_lft forever preferred_lft forever
```
host a上容器中的arp表
```shell
~# ip netns exec $PID arp -n         
Address                  HWtype  HWaddress           Flags Mask            Iface
12.200.1.2               ether   5a:d5:32:45:37:9e   C                     geneve1
```
host b上arp表以及br0网桥的mac表
```shell
~# arp -n
Address                  HWtype  HWaddress           Flags Mask            Iface
169.254.67.1             ether   ae:3d:e0:0c:58:73   C                     br0
192.168.1.1              ether   fa:16:3e:17:96:ac   C                     eth0
192.168.1.53             ether   fa:16:3e:ac:87:86   C                     eth0
192.168.1.254            ether   fa:fa:fa:fa:fa:01   C                     eth0
~# brctl showmacs br0
port no	mac addr		is local?	ageing timer
  1	5a:d5:32:45:37:9e	yes		   0.00
  1	5a:d5:32:45:37:9e	yes		   0.00
  1	ae:3d:e0:0c:58:73	no		   0.25
~# brctl show br0 
bridge name	bridge id		STP enabled	interfaces
br0		8000.5ad53245379e	no		geneve1           
# geneve1代表网桥上的Port no为1的口，5a:d5:32:45:37:9e就是geneve1口的mac，loca:yes代表直连；ae:3d:e0:0c:58:73是host a中容器的源mac，local:no代表学习到的
```

1. host a：容器发起arp request广播消息
2. host a: 主机a的geneve1口为隧道口，将广播消息封装geneve隧道，匹配主机路由从主机a的eth口发出
3. host b: 主机b的eth口收到geneve报文，解封装外层隧道信息，从主机b的geneve1口发出广播
4. host b: 流量到达host b的br0网桥，网桥记录`ae:3d:e0:0c:58:73`对应端口为geneve1
5. host b: 网桥接口收到广播报文，发现目的IP是自己**且请求IP的网关**也是自己，于是便单播响应arp reply；
6. host b: 流量到达br0网桥，发现回程`ae:3d:e0:0c:58:73`对应的端口为geneve1，于是从geneve1口发出
7. host b: 封装geneve隧道，从主机b的eth口发出
8. host a: 主机a的eth口收到geneve报文，解封装外层隧道信息，送到主机a容器中的geneve1口，容器完成arp学习
9. host a: 容器icmp request单播消息，匹配默认路由下一跳送geneve1口
10. host a: 主机a的geneve1口为隧道口，收到广播消息后封装geneve隧道，从主机a的eth口发出
11. host b: 主机b的eth口收到geneve报文，解封装外层隧道信息，从geneve1口发出到达br0网桥
13. 流量到达br0网桥，查找mac表，发现IP是网桥接口，于是br0网桥接口响应ICMP reply，然后发出回到br0网桥
14. 网桥查找mac转发表，出接口是`ae:3d:e0:0c:58:73`，于是从geneve1口发出
15. host b: 流量封装geneve隧道，从主机b的eth口发出
16. host a: 主机a的eth口收到geneve报文，解封装外层隧道信息，发现目的是自己，通信结束

> 我们在主机b上添加了一条目的地址是主机容器地址，下一跳送br0网桥接口的路由。如果这条路由下一跳指向主机a的geneve1口会怎么样？arp请求到达主机b的geneve1口的时候，会发现网关是自己，自己应该代答，但是请求的IP却不是自己，这种情况下就会丢包了（网关不会代答二层，二层内的真实主机应该回答） [[ARP#1. arp响应的条件]]]
## 4.2. 容器通过veth连接宿主机网桥上geneve口
host a配置
```shell
ip link add name geneve1 type geneve vni 1000 remote 10.0.0.250 dstport 6082
ip link set geneve1 up
brctl addbr br0
ip link set br0 up
brctl addif br0 geneve1

docker run -itd --privileged --network=none --name client1 myubuntu bash
PID=$(docker inspect -f '{{.State.Pid }}' client1)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID
ip link add veth-host type veth peer name veth-client1
ip link set veth-host up
brctl addif br0 veth-host
ip link set veth-client1 netns $PID
ip netns exec $PID ip addr add 169.254.67.1/16 dev veth-client1 
ip netns exec $PID ip link set veth-client1 up 
ip netns exec $PID ip route add default dev veth-client1
```
host b配置
```shell
brctl addbr br0
ip address add 12.200.1.2/24 dev br0
ip link set br0 up
ip link add name geneve1 type geneve vni 1000 remote 10.0.0.251 dstport 6082
ip link set geneve1 up
brctl addif br0 geneve1
route add 169.254.67.1/32 dev br0
```
iptables规则
```shell
# iptables -nvL FORWARD                                                        
Chain FORWARD (policy DROP 1246 packets, 105K bytes)
 pkts bytes target     prot opt in     out     source               destination         
 1246  105K DOCKER-ISOLATION  all  --  *      *       0.0.0.0/0            0.0.0.0/0           
    0     0 DOCKER     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0           
    0     0 ACCEPT     all  --  *      docker0  0.0.0.0/0            0.0.0.0/0            ctstate RELATED,ESTABLISHED
    0     0 ACCEPT     all  --  docker0 !docker0  0.0.0.0/0            0.0.0.0/0           
    0     0 ACCEPT     all  --  docker0 docker0  0.0.0.0/0            0.0.0.0/0
```
由于经过网桥的目的ip不是本机地址，因此会被[[bridge|iptables]]的forward链过滤，这里主机a上还需要执行以下命令：
```shell
iptables -I FORWARD -i br0 -o br0 -j ACCEPT
# 或者直接关闭forward
sysctl -w net.bridge.bridge-nf-call-iptables=0
```
为了避免arp学习，可以通过添加静态mac解决
```shell
# 配置一个假网关，给假网关配置静态mac，流量到达网桥由于网桥不知道mac对应port，因此会在所有非发送端口上泛洪，也包括geneve1口，但是如果想要对端回包，则这个mac必须和目的端mac匹配，否则对端会丢包，或者对端设备支持不校验目的mac
ip netns exec $PID ip route add default via 169.254.175.253 dev veth-client1
ip netns exec $PID arp -s 169.254.175.253 52:7d:b1:92:5a:0f
```
## 4.3. 同一宿主机上不同容器使用相同VNI不同DstPORT
host a配置两个容器的源IP一样，使用不同目的port区分隧道
```shell
docker run -itd --privileged --network=none --name client1 myubuntu bash
# 查找容器的进程ID 
PID=$(docker inspect -f '{{.State.Pid }}' client1)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID

ip link add name geneve1 type geneve vni 1000 remote 10.0.0.250 dstport 6081
	ip link set geneve1 netns $PID
ip netns exec $PID ip link set geneve1 up
ip netns exec $PID ip addr add 169.254.175.252/32 dev geneve1
ip netns exec $PID ip route add default dev geneve1


docker run -itd --privileged --network=none --name client2 myubuntu bash
# 查找容器的进程ID 
PID=$(docker inspect -f '{{.State.Pid }}' client2)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID

ip link add name geneve1 type geneve vni 1000 remote 10.0.0.250 dstport 6082
ip link set geneve1 netns $PID
ip netns exec $PID ip link set geneve1 up
ip netns exec $PID ip addr add 169.254.176.252/32 dev geneve1
ip netns exec $PID ip route add default dev geneve1
```
host b相同配置
```shell
docker run -itd --privileged --network=none --name client1 myubuntu bash
# 查找容器的进程ID 
PID=$(docker inspect -f '{{.State.Pid }}' client1)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID

ip link add name geneve1 type geneve vni 1000 remote 10.0.0.251 dstport 6081
ip link set geneve1 netns $PID
ip netns exec $PID ip link set geneve1 up
ip netns exec $PID ip addr add 169.254.177.252/32 dev geneve1
ip netns exec $PID ip route add default dev geneve1


docker run -itd --privileged --network=none --name client2 myubuntu bash
# 查找容器的进程ID 
PID=$(docker inspect -f '{{.State.Pid }}' client2)
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$PID/ns/net /var/run/netns/$PID

ip link add name geneve1 type geneve vni 1000 remote 10.0.0.251 dstport 6082
ip link set geneve1 netns $PID
ip netns exec $PID ip link set geneve1 up
ip netns exec $PID ip addr add 169.254.178.252/32 dev geneve1
ip netns exec $PID ip route add default dev geneve1
```
此时两个主机上的两个容器可以通过两个仅目的端口不一样的隧道同时互通
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250106233311014.png)
### 4.3.1. Extension
为了避免arp学习，可以在容器内配置静态arp，以一个容器举例
```shell
# 修改geneve1口网段为31位，配置网关为169.254.175.253，这样所有流量都会从geneve1口出，同时可以添加静态arp，避免arp学习不到网关mac
ip addr add 169.254.175.252/31 dev geneve1
ip route add default via 169.254.175.253 dev geneve1
arp -s 169.254.175.253 1e:53:8a:c3:1a:be
```
> 这里静态mac地址是添加的对端容器169.254.177.252的真实mac，否则对端会由于mac不对而直接丢包。这种静态配置的方式只适合通信对端只有一个地址且mac固定的情况。否则需要对端对目的mac不校验。
# 5. 注意点
1. 要配置好回程路由，否则会认为回程不可达，不会发送arp响应