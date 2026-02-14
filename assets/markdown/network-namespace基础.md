```shell
ip netns add net0
```
可以创建**一个完全隔离的新网络环境**，这个环境包括一个独立的网卡空间，路由表，ARP表，ip地址表，iptables，ebtables等等。总之，与网络有关的组件都是独立的。

```shell
ip netns list
``` 
可以看到我们刚才创建的网络环境

进入虚拟网络环境，使用命令
```shell
ip netns exec net0 [command]
```
只能看到lo口
```text
[10.1.0.63_ ~]#ip netns exec net0 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
[10.1.0.63_ ~]#ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether fa:16:3e:c9:c8:07 brd ff:ff:ff:ff:ff:ff
    inet 10.1.0.63/24 brd 10.1.0.255 scope global noprefixroute dynamic eth0
       valid_lft 104615901sec preferred_lft 104615901sec
    inet6 fe80::38b7:34f8:3bde:5f99/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```

`ip netns exec net0 bash`这样我们可以在新的网络环境中打开一个shell。

连接两个网络环境

新的网络环境里面没有任何网络设备，并且也无法和外部通讯，就是一个孤岛，通过下面介绍的这个方法可以把两个网络环境连起来，简单的说，就是在两个网络环境之间拉一根网线

`ip netns add net1`，先创建另一个网络环境net1，我们的目标是把net0与net1连起来`ip link add type veth`

```shell
[10.1.0.63_ ~]#ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether fa:16:3e:c9:c8:07 brd ff:ff:ff:ff:ff:ff
    inet 10.1.0.63/24 brd 10.1.0.255 scope global noprefixroute dynamic eth0
       valid_lft 104615556sec preferred_lft 104615556sec
    inet6 fe80::38b7:34f8:3bde:5f99/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
3: veth0@veth1: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 3a:42:ef:dc:66:05 brd ff:ff:ff:ff:ff:ff
4: veth1@veth0: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether f6:25:ff:bf:8f:26 brd ff:ff:ff:ff:ff:ff
```

这里创建连一对veth虚拟网卡，类似pipe，发给veth0的数据包veth1那边会收到，发给veth1的数据包veth0会收到。就相当于给机器安装了两个网卡，并且之间用网线连接起来了

设置veth的两端分别连接net0和net1
```shell
ip link set veth0 netns net0
ip link set veth1 netns net1
```

这两条命令的意思就是把veth0移动到net0环境里面，把veth1移动到net1环境里面，我们看看结果
```shell
[10.1.0.63_ ~]#ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host 
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether fa:16:3e:c9:c8:07 brd ff:ff:ff:ff:ff:ff
    inet 10.1.0.63/24 brd 10.1.0.255 scope global noprefixroute dynamic eth0
       valid_lft 104615332sec preferred_lft 104615332sec
    inet6 fe80::38b7:34f8:3bde:5f99/64 scope link noprefixroute 
       valid_lft forever preferred_lft forever
```
veth0 veth1已经在我们的环境里面消失了，并且分别出现在net0与net1里面。
```shell
[10.1.0.63_ ~]#ip netns exec net0 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
3: veth0@if4: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 3a:42:ef:dc:66:05 brd ff:ff:ff:ff:ff:ff link-netnsid 1
[10.1.0.63_ ~]#ip netns exec net1 ip a
1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
4: veth1@if3: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether f6:25:ff:bf:8f:26 brd ff:ff:ff:ff:ff:ff link-netnsid 0
```

下面我们简单测试一下net0与net1的联通性
```shell
ip netns exec net0 ip link set veth0 up
ip netns exec net0 ip address add 10.0.1.1/24 dev veth0
ip netns exec net1 ip link set veth1 up
ip netns exec net1 ip address add 10.0.1.2/24 dev veth1
```

分别配置好两个设备，然后用ping测试一下联通性：
```text
[10.1.0.63_ ~]#ip netns exec net0 ping -c 3 10.0.1.2
PING 10.0.1.2 (10.0.1.2) 56(84) bytes of data.
64 bytes from 10.0.1.2: icmp_seq=1 ttl=64 time=0.024 ms
64 bytes from 10.0.1.2: icmp_seq=2 ttl=64 time=0.020 ms
64 bytes from 10.0.1.2: icmp_seq=3 ttl=64 time=0.021 ms

--- 10.0.1.2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 1999ms
rtt min/avg/max/mdev = 0.020/0.021/0.024/0.005 ms
```

**一个稍微复杂的网络环境**



创建虚拟网络环境并且连接网线
ip netns add net0  <br>ip netns add net1  <br>ip netns add bridge  <br>ip link add **type** veth  <br>ip link **set** dev veth0 name net0-bridge netns net0  <br>ip link **set** dev veth1 name bridge-net0 netns bridge  <br>ip link add **type** veth  <br>ip link **set** dev veth0 name net1-bridge netns net1  <br>ip link **set** dev veth1 name bridge-net1 netns bridge

在bridge中创建并且设置br设备
ip netns **exec** bridge brctl addbr br  <br>ip netns **exec** bridge ip link **set** dev br up  <br>ip netns **exec** bridge ip link **set** dev bridge-net0 up  <br>ip netns **exec** bridge ip link **set** dev bridge-net1 up  <br>ip netns **exec** bridge brctl addif br bridge-net0
ip netns **exec** bridge brctl addif br bridge-net1<br>
先在bridge的命名空间新建一个网桥，名字叫br，然后在bridge的空间新建两个dev：**bridge-net0**和**bridge-net1**，然后将两个dev添加到网桥br中。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250114221924595.png)


然后配置两个虚拟环境的网卡
ip netns **exec** net0 ip link **set** dev net0-bridge up  <br>ip netns **exec** net0 ip address add 10.0.1.1/24 dev net0-bridge
ip netns **exec** net1 ip link **set** dev net1-bridge up  <br>ip netns **exec** net1 ip address add 10.0.1.2/24 dev net1-bridge|

测试
ip netns **exec** net0 ping -c 3 10.0.1.2PING 10.0.1.2 (10.0.1.2) 56(84) bytes of data.  <br>64 bytes from 10.0.1.2: icmp_req=1 ttl=64 time=0.121 ms64 bytes from 10.0.1.2: icmp_req=2 ttl=64 time=0.072 ms64 bytes from 10.0.1.2: icmp_req=3 ttl=64 time=0.069 ms <br>--- 10.0.1.2 ping statistics ---3 packets transmitted, 3 received, 0% packet loss, time 1999ms  <br>rtt min/avg/max/mdev = 0.069/0.087/0.121/0.025 ms|