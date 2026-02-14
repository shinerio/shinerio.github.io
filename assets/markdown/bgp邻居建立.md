![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202503192234972.png)
- 先启动BGP的一端先发起TCP连接，R1先启动BGP，R1使用随机端口号向R2的179端口发起TCP连接，完成TCP连接的建立。
- 三次握手建立完成之后，R1、R2之间相互发送Open报文，携带参数用于对等体建立
- 参数协商正常之后双方相互发送Keepalive报文，收到对端发送的Keepalive报文之后对等体建立成功，同时双方定期发送Keepalive报文用于保持连接。
# 1. TCP连接
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202503192241218.png)
- 缺省情况下，BGP使用报文出接口作为TCP连接的本地接口。
- 在部署IBGP对等体关系时，建议使用Loopback地址作为更新源地址。Loopback接口非常稳定，而且可以借助AS内的IGP和冗余拓扑来保证可靠性。
- 在部署EBGP对等体关系时，通常使用直连接口的IP地址作为源地址，如若使用Loopback接口建立EBGP对等体关系，则应注意EBGP多跳问题。
> [!note]
> Loopback地址和lo0(127.0.0.1，本地回环地址)是不一样的，路由器的Loopback地址是一个虚拟接口，通常配置为一个可路由的IP地址，例如10.0.12.1或192.168.0.1等等。除了Loopback接口外，路由器上还有很多连接到不同的网段的多个以太网接口，每个接口都有自己的IP地址。

故障隔离
> [!note]
> 一般而言在AS内部，网络具备一定的冗余性。在R1与R3之间，如果采用直连接口建IBGP邻居关系，那么一旦接口或者直连链路发生故障，BGP会话也就断了，但是事实上，由于冗余链路的存在，R1与R3之间的IP连通性其实并没有DOWN（仍然可以通过R4到达彼此）。**如果用 Loopback 建邻居：** 只要 A 和 B 之间还有**任何**一条物理路径能通，Loopback 的 IP 就能互相 Ping 通，BGP 会话就不会中断。
# 2. Open报文
主要包括
- My Autonomous System：自身AS号
- Hold Time：用于协商后续Keepalive报文发送时间
- BGP Identifier：自身Router ID
> [!tip]
> BGP建立对等体的对等体都会发起TCP三次握手，所以会建立两个TCP连接，但是实际BGP只会保留其中一个TCP连接，从Open报文中获取对端BGP Identifier之后BGP对等体会比较本端的Router ID和对端的Router ID大小，如果本端Router ID小于对端Router ID，则会关闭本地建立的TCP连接，使用由对端主动发起创建的TCP连接进行后续的BGP报文交互。

# 3. Update报文

[![image-20220928134909305](https://img2023.cnblogs.com/blog/1661734/202309/1661734-20230918095024034-1658400849.png)](https://img2023.cnblogs.com/blog/1661734/202309/1661734-20230918095024034-1658400849.png)

BGP对等体关系建立之后，BGP路由器发送BGP Update（更新）报文通告路由到对等体。路由通告包括可达路由和不可达路由。
# 4. Notification报文
Notification报文用于错误信息通告，然后断开BGP邻居
# 5. Route-Refresh报文
用于请求对等体重新发送路由信息
# 6. 实验
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202503192334970.png)

## 6.1. 配置端口
R1
```shell
AR2#configure terminal
AR2(config)#interface f0/0
AR2(config-if)#ip address 192.168.1.2 255.255.255.0
AR2(config-if)#no shutdown
AR2(config-if)#interface f1/0
AR2(config-if)#ip address 10.0.0.1 255.0.0.0
AR2(config-if)#no shutdown
AR2(config-if)#interface lo0
AR2(config-if)#ip address 2.2.2.2 255.255.255.255
```
R2
```shell
R2#configure terminal
Enter configuration commands, one per line.  End with CNTL/Z.
R2(config)#interface f1/0
R2(config-if)#ip address 192.168.1.1 255.255.255.0
R2(config-if)#no shutdown
R2(config-if)#interface
R2(config-if)#interface f0/0
R2(config-if)#ip address 192.168.2.1 255.255.255.0
R2(config-if)#no shutdown
R2(config-if)#interface lo0
R2(config-if)#ip address 1.1.1.1 255.255.255.255
```
PC2
```shell
PC2> ip 10.0.0.2 255.0.0.0 10.0.0.1
```
R3
```shell
R3#configure terminal
R3(config)#interface f0/0
R3(config-if)#ip address 192.168.3.1 255.255.255.0
R3(config-if)#no shutdown
R3(config-if)#interface f1/0
R3(config-if)#ip address 192.168.2.2 255.255.255.0
R3(config-if)#no shutdown
R3(config-if)#interface lo0
R3(config-if)#ip address 3.3.3.3 255.255.255.255
```
R4
```shell
R4#configure terminal
R4(config)#interface f1/0
R4(config-if)#ip address 192.168.3.2 255.255.255.0
R4(config-if)#no shutdown
R4(config-if)#interface f0/0
R4(config-if)#ip address 11.0.0.1 255.0.0.0
R4(config-if)#no shutdown
R4(config-if)#interface lo0
R4(config-if)#ip address 4.4.4.4 255.255.255.255
```
PC1
```shell
PC1> ip 11.0.0.2 255.0.0.0 11.0.0.1
```
## 6.2. R1和R2配置OSPF
R2
```shell
R2#configure terminal
R2(config)#router ospf 100
R2(config-router)#network 192.168.1.0 0.0.0.255 area 0
R2(config-router)#network 1.1.1.1 0.0.0.0 area 0
```
R1
```shell
R1#configure terminal
R1(config)#router ospf 100
R1(config-router)#network 10.0.0.0 0.255.255.255 area 0
R1(config-router)#network 2.2.2.2 0.0.0.0 area 0
```
## 6.3. R3和R4配置RIP

## 6.4. 配置BGP