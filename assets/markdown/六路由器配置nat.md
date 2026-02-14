本章节主要以cisco路由器配置为例，使用GNS3仿真平台搭建一个最简单的实验环境进行验证。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307110023052.png)

# 1. 常用命令（cisco）
首先介绍本实验可能用到的一些命令，先有个概念，后面再在实验中熟悉并掌握。
## 1.1. VPC
```shell
# 配置ip、掩码和网关
ip address/mask gateway
# show ip
查看ip
```
## 1.2. 路由器
```shell
# 进入全局模式
configure terminal
# 查看所有接口
do show interface
# 进入接口模式
interface g0/0
# 配置路由器接口ip和掩码
ip address 192.168.0.1 255.255.255.0
# 激活
no shut
# 退出
exit
# 查看路由
show ip route
# 指定NAT内部接口 在内网相应接口的接口配置模式下执行
ip nat inside 
# 指定NAT外部接口 在外网相应接口的接口配置模式下执行
ip nat outside
# 在内部地址与外部地址之间建立静态地址转换关系
ip nat inside source static [NAT前的内部地址] [NAT后的外部地址] 
# 在外部地址与内部地址之间建立静态地址转换关系
ip nat outside source static [NAT前的外部地址] [NAT后的内部地址] 
# 显示当前存在的NAT转换信息
show ip nat translations
# 查看NAT的统计信息
show ip nat statics
# 显示当前存在的NAT转换的详细信息
show ip nat translations verbose
# 跟踪NAT操作，显示出每个被转换的数据包
debug ip nat
# 删除静态NAT映射
no ip nat inside source static local-address global-address 
no ip nat outside source static local-address global-address 
# 删除动态NAT映射表中的所有内容
clear ip nat translations *
# pnat
ip nat inside source static {UDP|TCP} local-address port global-address port
ip nat outside source static {UDP|TCP} local-address port global-address port
# 定义一个标准的access-list规则，声明允许哪些内部本地地址可以进行动态地址转换，其中，access-list-number为1－99之间的一个任意整数，通配符为子网掩码的反掩码
access-list access-list-number permit 源地址 通配符 
# 定义内部全局地址池
ip nat pool 地址池名 起始IP地址 终止IP地址 netmask 子网掩码
# 定义符合先前定义的access-list规则的IP数据包与先前定义的地址池中的IP地址进行转换，只分配ip，不复用端口
ip nat inside source list access-list-number pool 内部全局地址池名
# 定义符合先前定义的access-list规则的IP数据包与先前定义的地址池中的IP地址进行复用地址转换，同ip复用端口
ip nat inside source list list-number pool 内部全局地址池名 overload
# 删除全局地址池 
no ip nat pool name 
# 删除访问列表
no access-list access-list-number  
# 删除动态源地址转换
no ip nat inside source list list-number pool 内部全局地址池名
no ip nat inside source list list-number pool 内部全局地址池名 overload
```
# 2. 环境
## 2.1. 配置PC
### 2.1.1. PC1
```shell
PC1> ip 192.168.0.2/24 192.168.0.1
Checking for duplicate address...
PC1 : 192.168.0.2 255.255.255.0 gateway 192.168.0.1
```
### 2.1.2. PC2
```shell
PC2> ip 30.0.0.2/24  30.0.0.1
Checking for duplicate address...
PC2 : 10.0.0.2 255.255.255.0 gateway 10.0.0.1
```
## 2.2. 配置路由器
### 2.2.1. R1
#### 2.2.1.1. g0/0
```shell
R1(config)#interface g0/0
R1(config-if)#ip address 192.168.0.1 255.255.255.0
R1(config-if)#no shut
R1(config-if)#
*Jul 10 14:48:52.979: %LINK-3-UPDOWN: Interface GigabitEthernet0/0, changed state to up
*Jul 10 14:48:53.979: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/0, changed state to up
```
#### 2.2.1.2. g1/0
```shell
R1(config)#interface g1/0
R1(config-if)#ip address 20.0.0.2 255.255.255.0
R1(config-if)#no shut
```
### 2.2.2. R2
#### 2.2.2.1. #### g0/0
```shell
R1(config)#interface g0/0
R1(config-if)#ip address 20.0.0.3 255.255.255.0
R1(config-if)#no shut
```
#### 2.2.2.2. g1/0
```shell
R1(config)#interface g1/0
R1(config-if)#ip address 30.0.0.1 255.255.255.0
R1(config-if)#no shut
```

### 2.2.3. 查看路由
#### 2.2.3.1. R1
```shell
R1(config-if)#do show ip route
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area 
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2
       ia - IS-IS inter area, * - candidate default, U - per-user static route
       o - ODR, P - periodic downloaded static route

Gateway of last resort is not set

     20.0.0.0/24 is subnetted, 1 subnets
C       20.0.0.0 is directly connected, GigabitEthernet1/0
C    192.168.0.0/24 is directly connected, GigabitEthernet0/0
```
存在两条直连路由
#### 2.2.3.2. R2
```shell
R2(config)#do show ip route
Codes: C - connected, S - static, R - RIP, M - mobile, B - BGP
       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area 
       N1 - OSPF NSSA external type 1, N2 - OSPF NSSA external type 2
       E1 - OSPF external type 1, E2 - OSPF external type 2
       i - IS-IS, su - IS-IS summary, L1 - IS-IS level-1, L2 - IS-IS level-2
       ia - IS-IS inter area, * - candidate default, U - per-user static route
       o - ODR, P - periodic downloaded static route

Gateway of last resort is not set

     20.0.0.0/24 is subnetted, 1 subnets
C       20.0.0.0 is directly connected, GigabitEthernet0/0
     30.0.0.0/24 is subnetted, 1 subnets
C       30.0.0.0 is directly connected, GigabitEthernet1/0
```
存在两条直连路由

### 2.2.4. ping实验
此时两台路由器上并没有运行任何路由协议，都只存在直连路由，因此在pc1上很显然是ping不通pc2的，因为R1并不知道`30.0.0.0/24`网段下一跳应该送到何处。
```shell
[PC1> ping 30.0.0.2/24 
*192.168.0.1 icmp_seq=1 ttl=255 time=45.867 ms (ICMP type:3, code:1, Destination host unreachable)
	*192.168.0.1 icmp_seq=2 ttl=255 time=11.573 ms (ICMP type:3, code:1, Destination host unreachable)
*192.168.0.1 icmp_seq=3 ttl=255 time=8.511 ms (ICMP type:3, code:1, Destination host unreachable)](<PC1%3E ping 20.0.0.3                

84 bytes from 20.0.0.3 icmp_seq=1 ttl=255 time=11.490 ms
84 bytes from 20.0.0.3 icmp_seq=2 ttl=255 time=5.910 ms
84 bytes from 20.0.0.3 icmp_seq=3 ttl=255 time=5.994 ms

PC1> ping 30.0.0.2

*192.168.0.1 icmp_seq=1 ttl=255 time=11.198 ms (ICMP type:3, code:1, Destination host unreachable)
*192.168.0.1 icmp_seq=2 ttl=255 time=12.263 ms (ICMP type:3, code:1, Destination host unreachable)>)
```
## 2.3. 配置静态NAT
### 2.3.1. inside方式
```shell
R1(config)#ip nat inside source static 192.168.0.2 20.0.0.4
R1(config)#interface g0/0
R1(config-if)#ip nat inside

*Jul  6 16:20:25.563: %LINEPROTO-5-UPDOWN: Line protocol on Interface NVI0, changed state to up
R1(config)#interface g1/0
R1(config-if)#ip nat outside
R1(config)#do show ip nat translations
Pro Inside global      Inside local       Outside local      Outside global
--- 20.0.0.4           192.168.0.2        ---                ---

R1(config)#ip route 30.0.0.0 255.255.255.0 20.0.0.3
```

这里我们在R1上添加了30.0.0.0/24的路由，下一跳送给R2，但是R2上并没有添加指向192.168.0.0/24的路由。如果不对源地址进行NAT，R2路由器是不知道192.168.0.0/24网段下一跳应该送到哪里的，但是经过NAT后源地址已经变成了20.0.0.4，R2上有这条直连路由，流量经过NAT后可以通。

#### 2.3.1.1. pc1 ping 30.0.0.2
pc1抓包，NAT前
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307102331836.png)
pc2抓包，NAT后
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307102332512.png)
去程流量从inside口入，匹配nat规则，源地址替换为20.0.0.4；
回程流量匹配会话，目的地址由20.0.0.4替换为192.168.0.2

#### 2.3.1.2. pc2 ping 192.168.0.2
配置路由
```shell
R2(config)#ip route 192.168.0.0 255.255.255.0 20.0.0.2
```
抓包如下：
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307110013686.png)
去程从outside口入，不进行NAT地址替换，pc1看到的源地址就是30.0.0.2；
回程从inside口入，进行NAT地址替换，源地址替换为20.0.0.4；
pc2访问的目的是192.168.0.2，reply报文源地址是20.0.0.4，地址不匹配，流量不通。
#### 2.3.1.3. pc2 ping 20.0.0.4
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307110016948.png)
去程从outside口入，不进行NAT地址替换，30.0.0.2 -> 20.0.0.4；
回程从inside口入，进行NAT地址替换，192.168.0.2 -> 30.0.0.2变为20.0.0.4 -> 30.0.0.2;
流量正常。

### 2.3.2. outside方式
```shell
R1(config)#ip nat outside source static 30.0.0.2 20.0.0.4
R1(config)#interface g0/0
R1(config-if)#ip nat inside

*Jul  6 16:20:25.563: %LINEPROTO-5-UPDOWN: Line protocol on Interface NVI0, changed state to up
R1(config)#interface g1/0
R1(config-if)#ip nat outside
R1(config)#do show ip nat translations
Pro Inside global      Inside local       Outside local      Outside global
--- ---                ---                20.0.0.4           30.0.0.2

R1(config)#ip route 30.0.0.0 255.255.255.0 20.0.0.3

R2(config)#ip route 192.168.0.0 255.255.255.0 20.0.0.2
```

#### 2.3.2.1. p2 ping 192.168.0.2
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307102344888.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307102344140.png)
去程从R1的outside口进，匹配nat规则，源地址替换为20.0.0.4;
返程根据会话将目的地址20.0.0.4替换为30.0.0.2;
流量正常

#### 2.3.2.2. p1 ping 30.0.0.2
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307102350377.png)
由于是在outside配置的nat规则，因此去程从inside口进，并不会进行nat，pc2收到的源地址就是192.168.0.2；
返程从outside口进时匹配到了nat规则，将源地址30.0.0.2替换为20.0.0.4；
对于pc1来说，看到的源地址20.0.0.4和发出的报文目的地址30.0.0.2不匹配，流量不通。

#### 2.3.2.3. pc1 ping 20.0.0.4
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307110001925.png)
由于是在outside配置的nat规则，因此去程并不会进行nat，pc2收到的源地址就是192.168.0.2，而返程在outside口进时匹配到了nat规则，将源地址30.0.0.2替换为20.0.0.4，对于pc1来说就是看到的与20.0.0.4这个地址在通信。

### 2.3.3. 总结
1. inside规则匹配从inside口流入的流量并替换**源地址**；outside规则匹配从outside口流入的流量并替换**源地址**。两个规则是相对的，inside配置的规则，对于内网主机来说看到的外网地址是真实地址，对于外网主机来说看到的是NAT后的内网主机地址；而对于outside规则来说，对于内网主机看到的外网地址是NAT后的地址，对于外网主机来说看到的地址是真实的内网地址。
2. inside的规则是给内网主机做nat的，outside的规则是给外网主机做nat的，其实我们可以发现inside和outside是对等的。
3. 静态规则即可以正向内网主动访问外网，也可以反向外网主动访问内网。

## 2.4. 配置静态PNAT
指定端口进行NAT
```shell
R1(config)#ip nat inside source static tcp 192.168.0.2  23 20.0.0.4 10000
```
pc2 通过tcp协议ping 20.0.0.4
```
PC2> ping ?
**ping** HOST [OPTION ...]
  Ping the network HOST. HOST can be an ip address or name
    Options:
     **-1**             ICMP mode, default
     **-2**             UDP mode
     **-3**             TCP mode
     **-c** count       Packet count, default 5
     **-D**             Set the Don't Fragment bit
     **-f** FLAG        Tcp header FLAG |**C**|**E**|**U**|**A**|**P**|**R**|**S**|**F**|
                               bits |7 6 5 4 3 2 1 0|
     **-i** ms          Wait ms milliseconds between sending each packet
     **-l** size        Data size
     **-P** protocol    Use IP protocol in ping packets
                      **1** - ICMP (default), **17** - UDP, **6** - TCP
     **-p** port        Destination port
     **-s** port        Source port
     **-T** ttl         Set ttl, default 64
     **-t**             Send packets until interrupted by Ctrl+C
     **-w** ms          Wait ms milliseconds to receive the response

  Notes: 1. Using names requires DNS to be set.
         2. Use Ctrl+C to stop the command.

PC2> ping 20.0.0.4 -P 6 -p 10000 -c 3
Connect   10000@20.0.0.4 seq=1 ttl=62 time=24.921 ms
SendData  10000@20.0.0.4 seq=1 ttl=62 time=33.232 ms
Close     10000@20.0.0.4 seq=1 ttl=62 time=34.103 ms
Connect   10000@20.0.0.4 seq=2 ttl=62 time=35.078 ms
SendData  10000@20.0.0.4 seq=2 ttl=62 time=36.881 ms
Close     10000@20.0.0.4 seq=2 ttl=62 time=25.813 ms
Connect   10000@20.0.0.4 seq=3 ttl=62 time=49.130 ms
SendData  10000@20.0.0.4 seq=3 ttl=62 time=40.901 ms
Close     10000@20.0.0.4 seq=3 ttl=62 time=41.091 ms
```
NAT前目的IP为20.0.0.4，目的端口为10000；NAT后目的ip为192.168.0.2，目的端口为23
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307112319770.png)

## 2.5. 配置动态NAT
在192.168.0.0/24网络环境中新增pc3，更新组网图如下：
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307120026316.png)
### 2.5.1. 配置源地址段为`192.168.0.0/24`的动态nat规则
```shell
R1(config)#ip nat pool mytest 20.0.0.10 20.0.0.20 netmask 255.255.255.0
!定义内部全局地址池
R1(config)#access-list 10 permit 192.168.0.0 0.0.0.255
!定义访问控制列表，内部本地地址范围
R1(config)#ip nat inside source list 10 pool mytest
!建立映射关系
```
#### 2.5.1.1. pc1 ping 30.0.0.2
源地址在192.168.0.0/24内，动态源地址替换为了20.0.0.10
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307112339759.png)
#### 2.5.1.2. pc3 ping 30.0.0.2
源地址在192.168.0.0/24内，动态替换源地址为20.0.0.11
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307112348596.png)

#### 2.5.1.3. 总结
一个ip只可以被一个内网主机使用，ip不会在主机间复用。

### 2.5.2. 配置源地址段为`192.168.0.2/32`的动态nat规则
```shell
R1(config)#ip nat pool mytest 20.0.0.10 20.0.0.20 netmask 255.255.255.0
!定义内部全局地址池
R1(config)#access-list 10 permit 192.168.0.2 0.0.0.0
!定义访问控制列表，内部本地地址范围
R1(config)#ip nat inside source list 10 pool mytest
!建立映射关系
```

#### 2.5.2.1. pc1 ping 30.0.0.2
源地址在192.168.0.2/32内，动态源地址替换为了20.0.0.12
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307112355238.png)

#### 2.5.2.2. pc3 ping 30.0.0.2
源地址不在192.168.0.2/32内，不替换源地址。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307112354696.png)

## 2.6. 配置动态PNAT
通过overload参数控制地址重复
```
R1(config)#ip nat pool mytest 20.0.0.10 20.0.0.20 netmask 255.255.255.0
!定义内部全局地址池
R1(config)#access-list 10 permit 192.168.0.0 0.0.0.255
!定义访问控制列表，内部本地地址范围
R1(config)#ip nat inside source list 10 pool mytest overload
!建立映射关系
```

使用pc1和pc3同时ping 30.0.0.2，可以发现复用了同一个20.0.0.12地址
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202307120013041.png)
