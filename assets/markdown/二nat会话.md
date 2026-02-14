---
title: NAT会话
date: 2023-02-10
categories:
- network
tags:
- nat
- network
---

我们知道传输层的任意一条流都是通过两个`socket`建立的，`socket`由`(ip,port,protocol)`组成，因此一条流可以用五元组`(srcIp,srcPort,dstIp,dstPort,protocol)`表示。这个五元组中的任意一个元素都不能改变，否则就是另外一条流了。对于服务端来说，`srcIp`和`srcPort`中任意一个变了，就意味着一个新的接入连接；而对于客户端来说，`dstIp`和`dstPort`中任意一个发生变化，访问的就是一个新的服务，比如通常`80`是一个`http server`服务，`5432`是一个`postgresql`数据库的服务端口。

`NAT`是用来做地址转换的，为了保证一条流五元组的一致性，我们需要保证`NAT`前和`NAT`后的IP、端口以及协议在一条流的整个生命周期都不变。为了保证这种不变性，我们需要维持一种`NAT`映射关系，我们把这个映射关系称之为`NAT`会话(session)。对于`SNAT`而言，`transtitIp`是被多个内网主机共享的，这个映射关系不能是永久的，否则就变成了内网`(internalIp,internalPort)`和`(transitIp,transitPort)`是`1:1`关系， `(transitIp,transitPort)`的组合关系很快便会出现耗尽的情况。因此对于`SNAT`而言，会话的另一个重要属性就是会话超时时间。而对于`DNAT`而言，由于内网是服务端，对外应该暴露固定的`transitIp`和`transitPort`，且需要被映射到内网特定的某个主机提供的某个特定服务，即一组固定的`internalIp`和`internalPort`。这个映射关系是不随着外网的`externalIp`和`externalPort`改变而改变的，因此这种会话一般是永久性的。`DNAT`的会话是固定映射的，很好理解，因此下文我们讨论的会话主要是针对`SNAT`而言。

<!--more-->

举个例子，假设有一条流：

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/SNAT%E6%B5%81.png)


NAT前：`TCP  192.168.0.100:5000 -> 120.120.120.120:80`
NAT后：`TCP  110.110.110.110:6000 -> 120.120.120.120:80`

那么`TCP  192.168.0.100:5000 -> 120.120.120.120:80`到`TCP  110.110.110.110:6000 -> 120.120.120.120:80`的这样一个映射关系就可以称之为会话，而`UDP  192.168.0.100:5000 -> 120.120.120.120:80`到`UDP  110.110.110.110:6000 -> 120.120.120.120:80`则是另一个会话。

# 1. 术语定义
为了方便下文阐述，我们先统一一下术语：
- 定义一条流中从内网发往外网的流量为**上行流量**，`TCP  192.168.0.100:5000 -> 120.120.120.120:80`就标记了一条流上行流量，我们记为:`upKey=(internalIp,internalPort,externalIp,externalPort,protocol)`
- 定义一条流中从外网发往内网的流量为**下行流量**，`TCP  110.110.110.110:6000 -> 120.120.120.120:80`就标记了一条流下行流量，我们记为:`downKey=(externalIp,externalPort,transitIp,transitPort,protocol)`
> 注意这里我们并没有区分去程流量和回程流量，对于私网主动访问外网的场景，上行流量就是去程流量；对于外网主动访问内网的场景，上行流量就是回程流量。

此处我们可以导出会话`session = upKey + downKey + expireTime`。
> 注意，这里我们讨论的都是对称型NAT，关于锥型NAT读者可以自行研究，相对来说会话信息会少一些，映射条件相对更宽松些。

# 2. 会话管理
一个会话的完整生命周期可以分为三个阶段：
- 会话建立
- 会话匹配(续约)
- 会话老化

## 2.1. 会话匹配(续约)
对于一个上行报文，首先肯定是判断是否已经生成映射关系(session)，如果有的话我们只需要按照这个会话进行源地址和源端口的替换就行了，否则才需要新建一个会话。因此在讲会话的建立之前，我们先来聊聊会话的匹配。上行报文可以用一个`upSessKey`来表示，我们需要通过这个`upSessKey`来找到对应的`(transitIp,transitPort,protocol)`的组合。很自然地，我们就想到用一个`map`结构来存储，即一个`upSessKey`到`(transitIp,transitPort,protocol)`的映射关系，定义为`upSessMap`。同样对于下行报文，我们也可以使用一个`downSessKey`到`(internalIp,internalPort,protocol)`的映射关系来表示，定义为`downSessMap`。因此会话的匹配，可以简单概括上行报文通过`upSessKey`在`upSessMap`中匹配获得`session`，下行报文通过`downKey`在`downSessMap`中匹配获得`session`。

上文我们说过，会话是具有超时时间的，为了保证长连接不中断，`NAT`设备在接收到每一个业务报文完成`NAT`转换的同时，还需要对会话的超时时间进行刷新，以便在业务持续有报文的情况下会话不会老化，这个超时时间的刷新就可以称之为会话续约。

## 2.2. 会话建立
由于`internalIp`和`internalPort`是由内网主机决定的，`externalIp`和`externalPort`是由业务访问的目的外网主机决定的，而`protocol`是由通信双方的具体业务类型决定的（`TCP`、`UDP`、`icmp`），因此`NAT`设备实际上可以控制的只有`transitIp`和`tranitPort`，因此会话管理本质上管理的是`transitIp`和`tranitPort`的分配以及销毁。对于一个新建会话，为了保证和任何其他的流不冲突，最稳妥的方式就是使用一个新的`(transitIp,transitPort)`的组合，且不同的`protocol`之间的会话是不会冲突的。因此，我们可以定义如下会话分配池:

```c
// NAT设备控制的一组用于NAT的外网IP
uint32_t transitIpPool[];
struct SessAllocateKey {
    uint32_t transitIp;
    uint8_t protocol;
}
struct BitMap ports;
// key: SessAllocateKey value: BitMap
struct HashMap *sessAllocateMap;
```

因此会话分配的逻辑就是通过一定的算法从`transitIpPool`中选出一个`transitIp`，然后从`sessAllocateMap`中获取当前`protocol`下此`transitIp`管理的端口分配情况的`bitmap`，选出一个未占用的`port`标记为占用，生成`upSessKey -> (transtIp,transitPort,protocol)`的映射关系。同时为了使下行流量(`snat`回程流量)能够顺利地找到会话，将下行流量的`dstIp`和`dstPort`替换为原来的`internalIp`和`internalPort`，此时我们应该同时生成`downKey -> (intenralIp,internalPort,protocol)`的映射关系。为了保证会话在`UDP`通信结束或者`TCP`未正常断链的情况下能够被及时回收，此时我们还需要给会话额外添加一个超时时间。最终设计会话结构如下：

```c
struct UpSesskey {
    uint32_t internalIp;
    uint16_t internalPort;
    uint32_t externalIp;
    uint32_t externalPort;
    uint8_t protocol;
}
struct DownSesskey {
    uint32_t transitIp;
    uint16_t transitPort;
    uint32_t externalIp;
    uint32_t externalPort;
    uint8_t protocol;  
}
struct Session {
   struct UpSesskey upSessKey;
   struct DownSessKey downSessKey;
   uint32_t expireTime;
}
// key: UpSessKey, value: Session
struct HashMap *upSessMap;
// key: DownSessKey, value: Session
struct HashMap *downSessMap;
```

### 2.2.1. TransitIp选择算法
- Round Robin：不受报文内容的影响，各个`transitIp`上端口的分配比较平均
- Hash：根据五元组进行HASH选择`transitIp`，对于特定的业务流场景，NAT后的IP比较稳定
### 2.2.2. 会话结构优化
由于`upSessKey`和`downSessKey`都包含了`(externalIp,externalPort)`，因此如果在`(externalIp,externalPort,protocol)`组合不同的情况下，`(internalIp,internalPort,protocol)`或`(transitIp,transitPrt,protocol)`的组合是可以一样的，这样也可以保证不同的`upSessKey`、不同的`downSessKey`之间都不冲突，也能定位到会话信息，完成`NAT`。同时`(externalIp,externalPort,protocol)`不同的情况下，对于`NAT`前或`NAT`后的流的五元组都不一样，保证无论是客户端还是服务端`OS`都能识别出来是不同的流。因此我们可以在`(externalIp,externalPort,protocol)`组合不同的情况下，复用`(transitIp,transitPort,protocol)`来提高`NAT`资源的使用率。因此我们的会话分配模型可以优化成如下结构：
```c
uint32_t transitIpPool[];
// 将externalIp和externalPort加到会话分配的冲突域中
struct SessAllocateKey {
    uint32_t transitIp;
    uint32_t externalIp;
    uint16_t externalPort;
    uint8_t protocol;
}
struct BitMap ports;
// key: SessAllocateKey value: BitMap
struct HashMap *sessAllocateMap;
```

## 2.3. 会话老化
### 2.3.1. 超时老化
#### 2.3.1.1. UDP
我们都知道`UDP`协议是面向无连接的，`UDP`会话并没有一个明确的“终结报文”来表示当前`UDP`会话可以被销毁了，因此`UDP`会话的唯一老化手段就是超时老化。`UDP`报文的超时老化时间并没有一个明确的标准，根据业务不同建议设置时间控制在`30s-900s`范围内。如果业务确实需要长时间保留`UDP`会话，建议客户端和服务端之间通过定时心跳进行保活。

#### 2.3.1.2. TCP
对于`TCP`会话来说，相对就显得比较复杂了。`TCP`是面向连接的，有完整的`TCP状态机`，在`TCP`通信的任何阶段都有可能因为各种网络或主机异常问题导致`TCP`连接被意外释放，而这些意外释放往往不能被`NAT`设备感知，为了保证这种情况下会话能被释放，就需要各种超时老化机制来兜底。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/20230211160124.png)
##### 2.3.1.2.1. sync超时
`TCP`通过三次握手创建一个连接，有以下两种情况可能会导致超时：
- 对于client来说，在发送`syn`后进入`syn_sent`状态，等待server的`syn+ack`
- 对于server来说，在发送`syn+ack`后进入`syn_revd`状态，等待client的`ack`
在linux系统中，默认的syn超时是`75`秒，NAT设备的`syn`超时时间一般应该设置超过这个时间。
```SHELL
curl -o /dev/null -s -w "time_connect: %{time_connect}\ntime_starttransfer: %{time_starttransfer}\ntime_total: %{time_total}\n" 192.168.0.253:5000      
time_connect: 0.000000
time_starttransfer: 0.000000
time_total: 75.007882
```

##### 2.3.1.2.2. ESTABLISHED超时
`TCP`经历过三次握手后，client和server都进入了`established`阶段。`ESTABLISHED`阶段的异常分为有数据传输和没有数据传输两种情况。

异常时有数据传输，为了保证`TCP`报文的可靠性，`TCP`提供了[[Tcp重传]]能力，默认情况会下会重传`15`次，最大重传时间120秒，重传15次后（总计约15分钟）后会断开连接，且此时是不会有`FIN`动作的，连接会直接关闭。因为一直存在重传报文，此情况下至少要保证NAT设备的超时重传时间大于单次最大重传时间——2分钟。

异常时如果没有数据传输，还需要关注`TCP`有没有开启[[Tcp KeepAlive|KeepAlive]]。开启`KeepAlive`功能后，最长可能会需要7875秒（约两个多小时）后才能断开。如果没有开启`KeepAlive`功能，则连接永远不会断开。此时NAT设备也需要设置一个合理的超时时间，保证NAT设备会话功能不受异常影响。

##### 2.3.1.2.3. FIN超时
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/TCP%E5%9B%9B%E6%AC%A1%E6%8C%A5%E6%89%8B.png)

`TCP`通过四次挥手释放一个连接，有以下四种情况都可能会导致超时：
1.  对于主动释放连接的一方来说
	- 在发送完`FIN`报文进入`FIN_WAIT_1`状态后，等待被动方的`ACK`报文
	- 在收到被动方的`ACK`报文进入`FIN_WAIT_2`后，等待被动方`FIN`报文
2. 对于被动释放连接的一方来说
	- 在收到主动方的`FIN`报文并发送`ACK`进入`CLOSE_WAIT`状态后，此时被动方还有数据需要发送给主动方，等待主动方业务`ACK`报文。
	- 被动方发送`FIN`报文后，进入`LAST_ACK`状态，等待主动方`ACK`报文。

对于主动方来说，`FIN_WAIT_1`状态下会触发主动方的`TCP`重传（最大重传时间15分钟）后断开连接，而`FIN_WAIT_2`在linux下的默认超时时间为60秒。
```shell
$ more /proc/sys/net/ipv4/tcp_fin_timeout
60
```

对被动方来说，正常情况下，处于`CLOSE_WAIT`和`LAST_ACK`状态下会触发TCP重传（最大重传时间15分钟）后断开连接。某些情况下，如果被动方因为代码问题（IO阻塞之类的）未及时close socket，未能发出`FIN`报文，此时tcp如果设置了keepalive，会经历最长7875秒后，由内核断开连接。

### 2.3.2. TCP正常挥手
`TCP`通过四次挥手来完成连接的释放，因此我们可以维护`TCP状态机`，当收到第二个`FIN`报文后又收到`ACK`报文（即`LAST_ACK`），代表`TCP`挥手完成，此时只需要等待`2MSL`后即可释放会话（在被动方没有收到ACK报文的情况下，主动端可以有机会重发）。

### 2.3.3. TCP RST
`RST`用于复位因某种原因引起出现的错误连接，也用来拒绝非法数据和请求。发送`RST`报文通常意味着发生了某些错误，接收端不必回`ACK`，因此`RST`报文也代表着会话的结束。`NAT`设备收到`RST`报文后也需要等待`2MSL`后释放会话（在`RST`未被对端收到的情况下，对端还有机会通过业务报文再次触发`RST`）。
