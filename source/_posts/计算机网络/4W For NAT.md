---
title: 4W For NAT
date: 2022-05-04
categories:
- 计算机网络
tags:
- NAT
---

# 1. What is NAT?

NAT（Network address translation）即网络地址转换，工作在OSI模型的四层，用于修改数据包的IP地址和端口。当在专用网内部的一些主机本来已经分配到了local ip地址，但又想和Internet的主机通信时，可使用NAT方法。

从NAT的映射方式来看，NAT可以分为Basic NAT和PNAT：

- Basic NAT只转化IP，不映射端口。

- PNAT除了转化IP，还做端口映射，可以用于多个内部地址映射到少量（甚至一个）外部地址。

从NAT规则的生命周期来看，可以分为静态NAT和动态NAT：

- 静态NAT，将内部网络中的每个主机都永久映射成外部网络中的某个地址。

- 动态NAT，在外部网络中定义了一个或多个合法地址池，采用动态分配的方法将内部网络映射为外网网络。
  
>其中Basic NAT是公网ip和私网ip的1:1绑定，在云上属于EIP的功能，因此本文主要针对的是PNAT场景。

![enter description here](./images/1651666796441.png)
# 2. Why we need NAT?

- 多个内网主机共享公网IP，节省IP资源
- 隐藏内网主机真实地址，避免直接暴露，可以抵挡portscan之类的攻击
- 作为内网流量统一出口，共享带宽
- 工作在NAT模式下的lvs四层负载均衡

# 3. How to NAT in Linux?

在物理网络中，NAT功能一般由路由器或防火墙之类的设备来承载，而`Iptables`则是linux提供的用户态命令行工具，可以通过在nat表中增加规则，实现在`PREROUTING`和`POSTROUTING`链上的`DNAT`和`SNAT`功能。要使用Linux提供的nat功能，首先需要确认主机支持转发，可通过以下方式确认:

```shell
cat /proc/sys/net/ipv4/ip_forward
```
回显结果：1为开启，0为关闭，默认为0。

> 如未打开，可通过修改`/etc/sysctl.conf`文件，配置`net.ipv4.ip_forward = 1`后执行`sysctl -p /etc/sysctl.conf`启用转发功能。


## 3.1 SNAT

SNAT是为了让内网主机访问外网主机，将出方向报文的源地址进行替换，因此可以在`POSTROUTING`链上添加如下规则。

```shell
# 将192.168.1.0/24网段的源地址替换为100.32.1.100
iptables -t nat -A POSTROUTING -o eth0 -s 192.168.1.0/24 -j SNAT --to 100.32.1.100
```

## 3.2 DNAT

DNAT是为了让外网主机访问内网主机，将入方向报文的目的地址进行替换，因此可以在`PREROUTING`链上添加如下规则。

```shell
# 全端口映射
iptables -t nat -A PREROUTING -i eth0 -d 100.32.1.101 -j DNAT --to 192.168.1.101
# 单端口映射
iptables -t nat -A PREROUTING -i eth0 -p tcp -d 100.32.1.101 --dport 80 -j DNAT --to 192.168.1.101:80
# 范围端口映射
iptables -t nat -A PREROUTING -i eth0 -p tcp -d 100.32.1.101 --dport 10000:20000 -j DNAT --to 192.168.1.101:30000-40000
```

> iptables提供的NAT功能并不会对范围大小、端口冲突功能进行检查。iptables的工作原理为在一条链上从前到后匹配，前面的规则会覆盖后面的规则。 

## 3.3 Conntrack

上面我们提到了使用`iptables`实现SNAT功能，而SNAT存在多个内网主机通过分配端口复用同一个公网IP的情况，因此需要有个状态保持机制来记录这个会话，这个功能模块就是`Conntrack`。


![enter description here](https://raw.githubusercontent.com/shinerio/shinerio.github.io/blog-images/小书匠/1651666903738.png)
连接跟踪（Conntrack），顾名思义，就是跟踪（并记录）连接的状态。例如，上图是一台IP地址为`10.1.1.2`的Linux机器，我们能看到这台机器上有三条连接：

- 机器访问外部HTTP服务的连接（目的端口 80）
- 外部访问机器内FTP服务的连接（目的端口 21）
- 机器访问外部DNS 服务的连接（目的端口 53）
 
连接跟踪所做的事情就是发现并跟踪这些连接的状态，具体包括：

- 从数据包中提取元组（tuple）信息，辨别数据流（flow）和对应的连接（connection）
- 为所有连接维护一个状态数据库（conntrack table），例如连接的创建时间、发送包数、发送字节数等等
- 回收过期的连接（GC）
- 为更上层的功能（例如 NAT）提供服务

`Conntrack`在Linux中是通过`NetFilter`实现，`Netfilter` 是Linux内核中一个对数据包进行控制、修改和过滤（manipulation and filtering）的框架。它在内核协议栈中设置了若干hook点，以此对数据包进行拦截、过滤或其他处理。说地更直白一些，hook机制就是在数据包的必经之路上设置若干检测点，所有到达这些检测点的包都必须接受检测，根据检测的结果决定：

- 放行：不对包进行任何修改，退出检测逻辑，继续后面正常的包处理
- 修改：修改IP地址或端口进行NAT，然后将包放回正常的包处理逻辑
- 丢弃：安全策略或防火墙功能
 
>连接跟踪模块只是完成连接信息的采集和录入功能，并不会修改或丢弃数据包，后者是其他模块（例如 NAT）基于`Netfilter hook`完成的。

# 4. How to NAT in cloud？

“NAT网关”作为云服务的一种，面向overlay网络提供服务，其一般基于通用服务器（一般为Linux服务器）实现。在How to NAT in Linux一节中，我们已经知道，可以通过`netfilter`来实现，但这种方式只能靠单机工作，存在着**性能瓶颈**和**单点故障**的问题。为了提高性能和可靠性，我们可以从两方面入手，分别是`scale up`和`scale out`。同时，公有云服务面向了很多客户，因此云上NAT的功能对我们还有一个特殊的要求，实现多租户配置隔离。

## 4.1 Scale up

### 4.1.1 Better Hardware
Scale up最简单的方式就是增强硬件，这种方式只能在一定程度上提高性能，但受限于硬件能力，还是存在性能上限，且存在单点故障的缺陷。

- bigger cpu core
- greater bandwidth NIC

### 4.1.2 Architecture Refactor

Scale up的另外一种方式就是重构，通过这种方式我们可以提高硬件的利用效率，从而增强我们的转发性能。

网络设备（路由器、交换机等）需要在瞬间进行大量的报文收发，因此在传统的网络设备上，往往能够看到专门的NP（Network Process）处理器，有的用FPGA，有的用ASIC。这些专用器件通过内置的硬件电路（或通过编程形成的硬件电路）高效转发报文，只有需要对报文进行深度处理的时候才需要CPU干涉。

但在公有云、NFV等应用场景下，基础设施以CPU为运算核心，往往不具备专用的NP处理器，操作系统也以通用Linux为主，软件包的处理通常会经过用户态和内核态之间的切换。在虚拟化环境下，路径则会更长，需要分别经过HostOs和GuestOs两层用户态和内核态的切换。基于Linux服务器的报文转发，主要存在以下问题：

1. 传统的收发报文方式都必须采用硬中断来做通讯，每次硬中断大约消耗100微秒，这还不算因为终止上下文所带来的Cache Miss。
2. 数据必须从内核态用户态之间切换拷贝带来大量CPU消耗，全局锁竞争。
3. 收发包都有系统调用的开销。
4. 内核工作在多核上，为可全局一致，即使采用Lock Free，也避免不了锁总线、内存屏障带来的性能损耗。
5. 从网卡到业务进程，经过的路径太长，有些其实未必要的，例如netfilter框架，这些都带来一定的消耗，而且容易Cache Miss。

为了提升在通用服务器的数据包处理效能，Intel推出了服务于IA（Intel Architecture）系统的DPDK(Data Plane Development Kit)技术。DPDK应用程序运行在操作系统的User Space，利用自身提供的数据面库进行收发包处理，绕过了Linux内核态协议栈，以提升报文处理效率。

![enter description here](./images/1651668852031.png)

左边是原来的方式数据从 网卡 -> 驱动 -> 协议栈 -> Socket接口 -> 业务

右边是DPDK的方式，基于UIO（Userspace I/O）旁路数据。数据从 网卡 -> DPDK轮询模式-> DPDK基础库 -> 业务

用户态的好处是易用开发和维护，灵活性好。并且Crash也不影响内核运行，鲁棒性强。

## 4.2 Scale out

Scale up的本质还是在提高单机的性能，存在理论性能上限和单点故障问题。云计算的本质就是池化，实现网关的动态弹性扩容才是根本解决方案。通过Scale out的方式可以无限扩容，提高性能，且集群化后，可以避免单点故障，提高可靠性。

由于NAT网关是有状态的网关，因此无法直接横向扩容，每个节点不能单独管理会话，否则很容易出现冲突。因此Aws提出了一种三层架构形态的网络，即`HyperPlane`。`HyperPlane`将网络分为以下三种类型：

- TOP: 无状态的转发，一旦网络连接建立后，转发只会在TOP层完成，可以无限横向扩容。
- FLOW MASTER：用来记录网络连接信息，FLOW MASTER是无状态通用的。
- DECIDER：具体实现网络功能逻辑，不同网关实现不同。对于NAT来说，就是实现SNAT和DNAT规则的转换。

![enter description here](./images/1651669455296.png)

> 这里的每个节点都使用的是池化的ECS，具有很强的弹性扩缩能力。

- TOP节点成为了无状态的网关，可以理论无限扩容，大大提高了整个网关平台的转发能力
- Flow Master对于所有网关形态来说，不同的五元组都可以交由不同的Flow Master管理链接状态。FLow Master可以做到横向扩容，基于五元组hash，没有会话状态可以向Decider申请。
- Decider不同与Flow Master，对于有状态的网关，不同的实例可以由不同的Decider管理，但同一个实例必须由同一个Decider管理。Decider横向扩容需要考虑hash策略变化带来的会话同步问题。
- Flow Master和Decider存有会话信息，通过绕行两个节点形成主备，消除单点故障问题来说

## 4.3 Tenant isolation

这个就比较简单，云上数据包一般都会使用VXLAN协议进行过传递，通过对VXLAN报文中的VNI进行解析，将SNAT规则和DNAT规则与VNI进行绑定，即可实现不同租户之间的规则隔离。

# 5. Refrence
1. [连接跟踪（conntrack）：原理、应用及 Linux 内核实现](https://arthurchiao.art/blog/conntrack-design-and-implementation-zh/)
2. [一文看懂DPDK](https://cloud.tencent.com/developer/article/1198333)
3. [什么是DPDK？DPDK的原理及学习学习路线总结](https://zhuanlan.zhihu.com/p/397919872)
4. [AWS Hyperplane浅谈](https://zhuanlan.zhihu.com/p/188735635)