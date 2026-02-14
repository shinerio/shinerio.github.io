DHCP（Dynamic Host Configuration Protocol，动态主机配置协议），前身是BOOTP协议，是一个局域网的网络协议，使用UDP协议工作，统一使用两个IANA分配的端口：67（服务器端），68（客户端），DHCP客户端使用的源端口号为68，目的端口号为67发送请求消息到DHCP服务器，DHCP服务器使用的源端口号为67，目的端口号为68回应应答消息给DHCP客户端。

DHCP通常被用于局域网环境，主要作用是集中的管理、分配IP地址，使client动态的获得IP地址、子网掩码，网关地址、DNS服务器地址等信息，并能够提升地址的使用率。
# 1. 报文格式
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411272200400.png)
- **<font color="#ff0000">op</font>**：报文的操作类型。分为请求报文和响应报文。1：请求报文，2：应答报文。即client送给server的封包，设为1，反之为2。
    - 请求报文：DHCP Discover、DHCP Request、DHCP Release、DHCP Inform和DHCP Decline。
    - 应答报文：DHCP Offer、DHCP ACK和DHCP NAK。
- **htype**：DHCP客户端的MAC地址类型。MAC地址类型其实是指明网络类型。htype值为1时表示为最常见的以太网MAC地址类型。
- **hlen**：DHCP客户端的MAC地址长度。以太网MAC地址长度为6个字节，即以太网时hlen值为6。
- **hops**：DHCP报文经过的DHCP中继的数目，默认为0。DHCP请求报文每经过一个DHCP中继，该字段就会增加1。没有经过DHCP中继时值为0。(若数据包需经过router传送，每站加1，若在同一网内，为0)
- **xid**：客户端通过DHCP Discover报文发起一次IP地址请求时选择的随机数，相当于请求标识。用来标识一次IP地址请求过程。在一次请求中所有报文的Xid都是一样的。
- **secs**：DHCP客户端从获取到IP地址或者续约过程开始到现在所消耗的时间，以秒为单位。在没有获得IP地址前该字段始终为0。(DHCP客户端开始DHCP请求后所经过的时间。目前尚未使用，固定为0。)
- **flags**：标志位，只使用第0比特位，是广播应答标识位，用来标识DHCP服务器应答报文是采用单播还是广播发送，0表示采用单播发送方式，1表示采用广播发送方式。其余位尚未使用。(即从0-15bits，最左1bit为1时表示server将以广播方式传送封包给client。)
    - 注意：在客户端正式分配了IP地址之前的第一次IP地址请求过程中，所有DHCP报文都是以广播方式发送的，包括客户端发送的DHCP Discover和DHCP Request报文，以及DHCP服务器发送的DHCP Offer、DHCP ACK和DHCP NAK报文。当然，如果是由DHCP中继器转的报文，则都是以单播方式发送的。另外，IP地址续约、IP地址释放的相关报文都是采用单播方式进行发送的。
- **ciaddr**：DHCP客户端的IP地址。仅在DHCP服务器发送的ACK报文中显示，因为在得到DHCP服务器确认前，DHCP客户端是还没有分配到IP地址的。在其他报文中均显示，只有客户端是Bound、Renew、Rebinding状态，并且能响应ARP请求时，才能被填充。
- **yiaddr**：DHCP服务器分配给客户端的IP地址。仅在DHCP服务器发送的Offer和ACK报文中显示，其他报文中显示为0。
- **siaddr**：为DHCP客户端分配IP地址等信息的DHCP服务器IP地址。仅在DHCP Offer、DHCP ACK报文中显示，其他报文中显示为0。(用于bootstrap过程中的IP地址)。一般来说是服务器的ip地址，当报文的源地址、siaddr、<option­>server_id字段不一致（有经过跨子网转发）时，通常认为<option­>srever_id字段为真正的服务器ip，siaddr有可能是多次路由跳转中的某一个路由的ip
- **giaddr**：DHCP客户端发出请求报文后经过的第一个DHCP中继的IP地址。如果没有经过DHCP中继，则显示为0。(转发代理（网关）IP地址)
- **chaddr**：DHCP客户端的MAC地址。在每个报文中都会显示对应DHCP客户端的MAC地址。
- **sname**：为DHCP客户端分配IP地址的DHCP服务器名称（DNS[域名](https://dnspod.cloud.tencent.com/?from_column=20065&from=20065)格式）。在Offer和ACK报文中显示发送报文的DHCP服务器名称，其他报文显示为0。
- **file**：DHCP服务器为DHCP客户端指定的启动配置文件名称及路径信息。仅在DHCP Offer报文中显示，其他报文中显示为空。
- **options**：可选项字段，长度可变，格式为”代码+长度+数据”。
## 1.1. option字段
DHCP Options 的格式由 **Magic Cookie**和若干个TLV组成。
Magic Cookie占据开头的四个字节，固定值为网络字节序十六进制数”63 82 53 63“，用于标识后续数据的解释模式。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250112215326267.png)
- **Type（代码）**：占一个字节，取值范围是 0-255，用于指定选项的类型。
- **Length（长度）**：占一个字节，单位是字节，表示 Value 字段的长度。
- **Value（值）**：其长度由 Length 字段指定，用于存放具体的选项信息内容。
举例：
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250112214915985.png)
- **选项代码（Type）**：第一个字节 “06”，在 DHCP 选项代码中，“06” 代表 “DNS Servers”（域名服务器）选项 。这表明该选项用于指定客户端应使用的DNS服务器地址。
- **长度（Length）**：第二个字节 “08”，表示后面 “Value” 部分的长度为 8 字节。
- **值（Value）**：
    - 接下来的 8 个字节 “64 64 02 88 64 64 02 8a” 是 DNS 服务器的地址信息。这里的地址表示形式是以网络字节序（大端序）存储的 IP 地址。每 4 个字节代表一个 IP 地址，所以这里包含两个 IP 地址。
    - 将 “64 64 02 88” 转换为十进制，通过计算可得为 “100.100.2.136”。
    - 将 “64 64 02 8a” 转换为十进制，可得为 “100.100.2.138”。
所以，这个 DHCP Option 的含义是为客户端指定了两个 DNS 服务器地址，分别是 100.100.2.136 和 100.100.2.138 。
# 2. DHCP报文种类
DHCP使用 “Message Type” 选项来明确报文类型，该选项在 DHCP 报文中作为一个可变长度选项存在，代码为53 。DHCP一共有8种报文，各种类型报文的基本功能如下：
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250112215500081.png)

| 报文类型           | 说明                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover（0x01） | DHCP客户端在请求IP地址时并不知道DHCP服务器的位置，因此DHCP客户端会在本地网络内以广播方式发送Discover请求报文，以发现网络中的DHCP服务器。所有收到Discover报文的DHCP服务器都会发送应答报文，DHCP客户端据此可以知道网络中存在的DHCP服务器的位置。                                                                                              |
| Offer（0x02）    | DHCP服务器收到Discover报文后，就会在所配置的地址池中查找一个合适的IP地址，加上相应的**租约期限**和其他配置信息（如网关、DNS服务器等），构造一个Offer报文，发送给DHCP客户端，告知用户本服务器可以为其提供IP地址。但这个报文只是告诉DHCP客户端可以提供IP地址，最终还需要客户端通过ARP来检测该IP地址是否重复。                                                                 |
| Request（0x03）  | DHCP客户端可能会收到很多Offer请求报文，所以必须在这些应答中选择一个。通常是选择第一个Offer应答报文的服务器作为自己的目标服务器，并向该服务器发送一个广播的Request请求报文，通告选择的服务器，希望获得所分配的IP地址。另外，DHCP客户端在成功获取IP地址后，在地址使用租期达到50%时，会向DHCP服务器发送单播Request请求报文请求续延租约，如果没有收到ACK报文，在租期达到87.5%时，会再次发送广播的Request请求报文以请求续延租约。 |
| ACK（0x05）      | DHCP服务器收到Request请求报文后，根据Request报文中携带的用户MAC来查找有没有相应的租约记录，如果有则发送ACK应答报文，通知用户可以使用分配的IP地址。                                                                                                                                                      |
| NAK（0x06）      | 如果DHCP服务器收到Request请求报文后，没有发现有相应的租约记录或者由于某些原因无法正常分配IP地址，则向DHCP客户端发送NAK应答报文，通知用户无法分配合适的IP地址。                                                                                                                                                  |
| Release（0x07）  | 当DHCP客户端不再需要使用分配IP地址时（一般出现在客户端关机、下线等状况）就会主动向DHCP服务器发送RELEASE请求报文，告知服务器用户不再需要分配IP地址，请求DHCP服务器释放对应的IP地址。                                                                                                                                      |
| Decline（0x04）  | DHCP客户端收到DHCP服务器ACK应答报文后，通过地址冲突检测发现服务器分配的地址冲突或者由于其他原因导致不能使用，则会向DHCP服务器发送Decline请求报文，通知服务器所分配的IP地址不可用，以期获得新的IP地址。                                                                                                                            |
| Inform（0x08）   | DHCP客户端如果需要从DHCP服务器端获取更为详细的配置信息，则向DHCP服务器发送Inform请求报文；DHCP服务器在收到该报文后，将根据租约进行查找到相应的配置信息后，向DHCP客户端发送ACK应答报文。目前基本上不用了。                                                                                                                         |

# 3. DHCP Discover
只有跟DHCP客户端在同一个网段的DHCP服务器才能收到DHCP客户端广播的DHCP DISCOVER报文。当DHCP客户端与DHCP服务器不在同一个网段时，必须部署DHCP中继来转发DHCP客户端和DHCP服务器之间的DHCP报文。在DHCP客户端看来，DHCP中继就像DHCP服务器；在DHCP服务器看来，DHCP中继就像DHCP客户端。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250112210118546.png)
第一步：发现阶段
首次接入网络的DHCP客户端不知道DHCP服务器的[IP地址](https://info.support.huawei.com/info-finder/encyclopedia/zh/IPv4.html "IPv4")，为了学习到DHCP服务器的IP地址，DHCP客户端以广播方式发送DHCP DISCOVER报文（目的IP地址为255.255.255.255）给同一网段内的所有设备（包括DHCP服务器或中继）。DHCP DISCOVER报文中携带了客户端的MAC地址（[chaddr字段](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__c1)）、需要请求的参数列表选项（[Option55](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op55)）、广播标志位（[flags字段](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__f1)）等信息。

第二步：提供阶段
与DHCP客户端位于同一网段的DHCP服务器都会接收到DHCP DISCOVER报文，DHCP服务器选择跟接收DHCP DISCOVER报文接口的IP地址处于同一网段的地址池，并且从中选择一个可用的IP地址，然后通过DHCP OFFER报文发送给DHCP客户端。

通常，DHCP服务器的地址池中会指定IP地址的[租期](https://support.huawei.com/hedex/hdx.do?docid=EDOC1100087046&id=ZH-CN_CONCEPT_0176371534&lang=zh)，如果DHCP客户端发送的DHCP DISCOVER报文中携带了期望租期，服务器会将客户端请求的期望租期与其指定的租期进行比较，选择其中时间较短的租期分配给客户端。

DHCP服务器在地址池中为客户端分配IP地址的顺序如下：
1. DHCP服务器上已配置的与客户端MAC地址静态绑定的IP地址。
2. 客户端发送的DHCP DISCOVER报文中[Option50](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op50)（请求IP地址选项）指定的地址。
3. 地址池内查找“Expired”状态的IP地址，即曾经分配给客户端的超过租期的IP地址。
4. 在地址池内随机查找一个“Idle”状态的IP地址。
5. 如果未找到可供分配的IP地址，则地址池依次自动回收超过租期的（“Expired”状态）和处于冲突状态（“Conflict”状态）的IP地址。回收后如果找到可用的IP地址，则进行分配；否则，DHCP客户端等待应答超时后，重新发送DHCP DISCOVER报文来申请IP地址。

设备支持在地址池中排除某些不能通过DHCP机制进行分配的IP地址。例如，客户端所在网段已经手工配置了地址为192.168.1.100/24的DNS服务器，DHCP服务器上配置的网段为192.168.1.0/24的地址池中需要将192.168.1.100的IP地址排除，不能通过DHCP分配此地址，否则，会造成地址冲突。

为了防止分配出去的IP地址跟网络中其他客户端的IP地址冲突，DHCP服务器在发送DHCP OFFER报文前通过发送源地址为DHCP服务器IP地址、目的地址为预分配出去IP地址的[ICMP](https://info.support.huawei.com/info-finder/encyclopedia/zh/ICMP.html "ICMP") ECHO REQUEST报文对分配的IP地址进行地址冲突探测。如果在指定的时间内没有收到应答报文，表示网络中没有客户端使用这个IP地址，可以分配给客户端；如果指定时间内收到应答报文，表示网络中已经存在使用此IP地址的客户端，则把此地址列为冲突地址，然后等待重新接收到DHCP DISCOVER报文后按照前面介绍的选择IP地址的优先顺序重新选择可用的IP地址。

此阶段DHCP服务器分配给客户端的IP地址不一定是最终确定使用的IP地址，因为DHCP OFFER报文发送给客户端等待16秒后如果没有收到客户端的响应，此地址就可以继续分配给其他客户端。通过下面的选择阶段和确认阶段后才能最终确定客户端可以使用的IP地址。

第三步：选择阶段

如果有多个DHCP服务器向DHCP客户端回应DHCP OFFER报文，则DHCP客户端一般只接收第一个收到的DHCP OFFER报文，然后以广播方式发送DHCP REQUEST报文，该报文中包含客户端想选择的DHCP服务器标识符（即[Option54](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op54)）和客户端IP地址（即[Option50](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op50)，填充了接收的DHCP O
'

FFER报文中yiaddr字段的IP地址）。

DHCP客户端广播发送DHCP REQUEST报文通知所有的DHCP服务器，它将选择某个DHCP服务器提供的IP地址，其他DHCP服务器可以重新将曾经分配给客户端的IP地址分配给其他客户端。

第四步：确认阶段

当DHCP服务器收到DHCP客户端发送的DHCP REQUEST报文后，DHCP服务器回应DHCP ACK报文，表示DHCP REQUEST报文中请求的IP地址（[Option50](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op50)填充的）分配给客户端使用。

DHCP客户端收到DHCP ACK报文，会广播发送[免费ARP](https://info.support.huawei.com/info-finder/encyclopedia/zh/ARP.html "ARP")报文，探测本网段是否有其他终端使用服务器分配的IP地址，如果在指定时间内没有收到回应，表示客户端可以使用此地址。如果收到了回应，说明有其他终端使用了此地址，客户端会向服务器发送DHCP DECLINE报文，并重新向服务器请求IP地址，同时，服务器会将此地址列为冲突地址。当服务器没有空闲地址可分配时，再选择冲突地址进行分配，尽量减少分配出去的地址冲突。

当DHCP服务器收到DHCP客户端发送的DHCP REQUEST报文后，如果DHCP服务器由于某些原因（例如协商出错或者由于发送REQUEST过慢导致服务器已经把此地址分配给其他客户端）无法分配DHCP REQUEST报文中[Option50](https://support.huawei.com/hedex/pages/EDOC1100087046AZJ0324D/10/EDOC1100087046AZJ0324D/10/resources/dc/dc_cfg_dhcp_6005.html#ZH-CN_CONCEPT_0176371535__op50)填充的IP地址，则发送DHCP NAK报文作为应答，通知DHCP客户端无法分配此IP地址。DHCP客户端需要重新发送DHCP DISCOVER报文来申请新的IP地址。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250112214318695.png)
![[dhcp_discover.pcap]]
# 4. DHCP续约
时间点：当续约周期剩余一半时会尝试首次续约；续约失败，在剩余八分之一时会尝试再次续约；如果仍然失败，则到期后会释放。
机制：客户端发起DHCP Request，服务端发送DHCP ACK
# 5. 抓包分析

```shell
tcpdump udp port 67 or udp port 68 or arp
```
192.168.85.100通过DHCP获取到IP后，会发送ARP探测报文检查IP是否冲突，然后发送ARP广播报文。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411272301653.png)
![[Tech/Cloud Network/dhcp.pcapng]]

## 5.1. Offer报文
提供了ip地址、dns server（option 6）、租期（option 51）
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202411272310120.png)

```shell
╰─$ scutil --dns
DNS configuration

resolver #1
  nameserver[0] : 202.106.46.151
  nameserver[1] : 202.106.195.68
  flags    : Request A records
  reach    : 0x00000002 (Reachable)
```
# 6. Reference
[DHCP协议详解-腾讯云开发者社区-腾讯云 (tencent.com)](https://cloud.tencent.com/developer/article/2081483)
https://info.support.huawei.com/info-finder/encyclopedia/zh/DHCP.html