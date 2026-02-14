
# 1. 主机应用通过绑定独立路由表或vrf的方式通过隧道访问对端

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162021224.png)
> 图为网图，本文配置vtep地址换成了10.0.0.250和10.0.0.251

250主机配置
```shell
# 配置vxlan隧道
ip link add vxlan0 type vxlan \
id 40 \
dstport 4789 \
remote 10.0.0.251 \
local 10.0.0.250 \
dev eth0
# 创建了一个名为vrf0的虚拟路由和转发（VRF）实例，并指定其路由表为10。VRF允许在同一物理设备上创建多个逻辑上独立的路由和转发域。
ip link add vrf0 type vrf table 10 
ip link set vrf0 up
# 将名为vxlan0的网络接口设置为vrf0的从属接口，意味着vxlan0接口的流量将在vrf0所定义的路由和转发规则下进行处理。
ip link set vxlan0 master vrf0 
# 给vxlan0口配置ip并启用
ip addr add 172.18.1.2/24 dev vxlan0  
ip link set vxlan0 up
```

查看当前系统信息
```
root@iZbp1apxihjwrp6fggnpqqZ:~# ip vrf show 
Name Table ----------------------- 
vrf0 10
root@iZbp1apxihjwrp6fggnpqqZ:~# ip route show vrf vrf0 
172.18.1.0/24 dev vxlan0 proto kernel scope link src 172.18.1.2
```

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162020855.png)

> 虽然从概念上讲，VRF 主要用于实现逻辑上的路由隔离，但在系统的网络配置和管理中，它被呈现为一个类似普通网络接口的实体，您可以为其分配 IP 地址、设置状态（如启用或禁用）等，这就是为什么使用 `ip a` 命令能够看到 `vrf0` 。

251上配置
```shell
ip link add vxlan0 type vxlan \
id 40 \
dstport 4789 \
remote 10.0.0.250 \
local 10.0.0.251 \
dev eth0
ip link add vrf0 type vrf table 10
ip link set vrf0 up
ip link set vxlan0 master vrf0
ip addr add 172.18.1.3/24 dev vxlan0
ip link set vxlan0 up
```

10.0.0.250节点上ping测试
```shell
root@iZbp1apxihjwrp6fggnpqqZ:~# ping 172.18.1.3 -I vxlan0 
PING 172.18.1.3 (172.18.1.3) from 172.18.1.2 vxlan0: 56(84) bytes of data. 
64 bytes from 172.18.1.3: icmp_seq=1 ttl=64 time=0.270 ms 
64 bytes from 172.18.1.3: icmp_seq=2 ttl=64 time=0.217 ms 
64 bytes from 172.18.1.3: icmp_seq=3 ttl=64 time=0.240 ms
```

10.0.0.250 eth0口抓包
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162026826.png)
10.0.0.250 vxlan0口抓包
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162030967.png)
10.0.0.251 eth0抓包
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162028704.png)
10.0.0.251 vxlan0口抓包
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162031675.png)

现代很多网卡支持硬件卸载能力，tcp/udp校验和的计算可以交给网卡硬件去算，减轻CPU负担。所以抓包位置在网卡完成硬件卸载之前可能会看到bad udp cksum。
## 1.1. 通过路由配置三层转发
10.0.0.251主机添加
```
ip addr add 192.168.0.10/24 dev vxlan0
```

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162100163.png)

10.0.0.250主机只需要添加路由即可
```shell
ip route add default dev vxlan0 table 10 vrf vrf0
```
查看路由表
```shell
root@iZbp1apxihjwrp6fggnpqqZ:~# ip route show table 10 
default dev vxlan0 scope link
172.18.1.0/24 dev vxlan0 proto kernel scope link src 
172.18.1.2 local 172.18.1.2 dev vxlan0 proto kernel scope host src 172.18.1.2 
broadcast 172.18.1.255 dev vxlan0 proto kernel scope link src 172.18.1.2
```

可以看到我们实现了在10.0.0.250主机中通过vxlan隧道访问三层任意目的ip
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162103945.png)

有趣的是，我们甚至在10.0.0.251主机上的vxlan0口添加10.0.0.253
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411162114869.png)

# 2. docker在独立name space中访问对端
在10.0.0.250上配置隧道
```shell
docker run -itd --name container-client ubuntu
apt update
apt install net-tools -y
apt install iputils-ping -y
apt install iproute2 -y

# 首先，查看容器主进程的 PID，然后将其保存到$pid变量中
docker inspect --format '{{.State.Pid}}' container-client
pid=$(docker inspect --format '{{.State.Pid}}' container-client)

# 将该pid链接至/var/run/netns 中，以便ip netns命令可以访问到它
sudo mkdir -p /var/run/netns
sudo ln -s /proc/$pid/ns/net /var/run/netns/$pid

# 创建并启用vxlan隧道，并将隧道放到容器ns中
ip link add vxlan0 type vxlan \
id 40 \
dstport 4789 \
remote 10.0.0.251 \
local 10.0.0.250 \
dev eth0
ip link set vxlan0 up
sudo ip link set vxlan0 netns $pid
sudo ip netns exec $pid ip addr add 172.18.1.2/24 dev vxlan0

# 添加默认路由指向隧道口
sudo ip netns exec $pid route add default dev vxlan0
```

在 Docker的Bridge 模式下，`docker0` 网桥位于主机的默认网络命名空间中。在Docker中，当创建一个容器并使用默认的Bridge网络模式时，Docker会为容器创建一对虚拟网络接口（veth pair）。其中一端eth0(容器中的eth0，非宿主机中eth0)连接到容器内部，另一端连接到主机上的`docker0` 网桥。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171547181.png)
配置路由默认走vxlan口
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171548591.png)

这里我们10.0.0.251保持上节中的配置不变，当然你也可以用在10.0.0.251中配置相同的容器网络。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171550387.png)

## 2.1. 抓包分析
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171551304.png)

ping 172.18.1.3
1. vxlan0口（172.18.1.2）arp请求172.18.1.3
2. 封装vxlan隧道发送到对端
3. 对端解封装vxlan隧道并arp reply
4. 封装icmp request
5. 封装vxlan隧道发送到对端
6. 对端解封装vxlan隧道并icmp reply

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171600981.png)

# 3. 只走隧道网络的容器
容器默认会连接到docker0网桥上并分配ip，如果我们的容器仅需要通过vxlan与其他主机通信，可以只配置vxlan0口即可。

自定义Dockerfile
```dockerfile
FROM ubuntu:latest

RUN apt-get update && \
    apt-get install -y iproute2 iputils-ping net-tools curl traceroute telnet

CMD ["bash"]
```

```shell
docker build -t ubuntu-with-network-tools .
docker run -itd --network none --name container-client ubuntu-with-network-tools
```

容器中只有vxlan0口
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411171622801.png)




# 4. 参考文献
[VXLAN 基础教程：在 Linux 上配置 VXLAN 网络上篇文章结尾提到 Linux 是支持 VXLAN 的，我们 - 掘金 (juejin.cn)](https://juejin.cn/post/6844904133430870029)
[在容器中搭建简单的 Vxlan 隧道 | 政子的博客 (zhengzi.me)](https://blog.zhengzi.me/vxlan_tunnel_with_container/)