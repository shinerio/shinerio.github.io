# 1. 服务与网络三大耦合问题
- 交换机堆叠，存在单点风险和运维困难问题
- 物理网络大二层隧道，引入更大故障域
- 硬件墙的引入限制整体云业务规模，硬件强性能不行，无法横向扩展
# 2. 名词解释
NSA(Network Service Area)
- NWS(Network Service): 网络服务区，BR、ELB、NAT
- MGS(Manage Service): 管理服务区，负责云平台，面向租户提供的管理面服务，如APIG、DNS
NC(Network Cluster): 在AZ内提供计算、存储、网络节点的接入能力，一套NC包含接入、汇聚、核心三层交换机
FA: 分为FA-AZ和FA-NC
- FA-AZ: 负责AZ之间互连，南北向（AZ与AZ间）的流量互连和出口
- FA-NC: 负责NC之间互连，东西向（NC与NC间）
AZC(AZ Connector): DCN3.0下<font color="#ff0000">只用于</font>AZ之间互连，一般是两台（认为跨AZ的流量不会很大）
# 3. 总结
## 3.1. 交换机形态
DCN2.0   TOR核心为盒式，汇聚、核心、FA均为框式
DCN3.x    部分汇聚开始采用盒式
DCN4.x和DCN5.0   核心开始采用框式，FA为框式
> [!tip]
> 规模受限于框式设备端口数，同时框式设备时延高，成本高
## 3.2. FA发展
DCN3.0设计中没有FA，通过AZC（AZ Connector）只负责AZ间的流量转发，AZC不承担南北向流量。南北向（公网）流量:  NC ->  NWS ->  Transit区，然后送往骨干网或互联网。

DCN3.1及以后引入了FA设备，不光承担了AZ间的流量，也承担了南北向流量，NC -> FA -> Transit（流量不过网络服务区了）
## 3.3. 堆叠
DCN3.x    完成了核心、汇聚、AZC/FA的去堆叠，网络服务区汇聚去堆叠，TOR堆叠
DCN4.x   NC内全面去交换机堆叠部署，网络服务区去堆叠部署；管理服务区汇聚去堆叠，TOR存在堆叠
DCN5.x全面去堆叠，包括NC，管理服务器，网络服务区
## 3.4. 路由协议选择
DCN2.0协议采用OSPF，DCN3.x及以后均为BGP组网
AZ内单路由域，计算存储跨平面互访无需过墙，资源访问管理区过墙
## 3.5. 大二层
DCN3.x开始逐步消除大二层
DCN4.x消除NC内、网络服务区大二层
DCN5.x才消除管理服务区大二层（受制于openstack底座能力约束）
## 3.6. 管理墙/边界墙
DCN3.x以下均为硬件
DCN4.x硬墙、软墙结合
DCN5.0，消除硬件墙，SPM/DMZ云化
## 3.7. Transit区
DCN3.x引入transit区，DCN4.x也存在transit区
DCN5.0去transit区，BR网关下沉网络服务区（NWS）
> [!note] transit区为了容灾需要选两个以上的机房，设计上想要离两个AZ都近是比较理想化的，实际很难找到。下沉NWS后，在AZ内建设POP点，这样可以保证有POP点的这些AZ能够实现最短距离，作为主力AZ，提高低时延。
## 3.8. 多VRF路由平面隔离
DCN2.0存在多VRF路由平面隔离，从DCN3.x开始，就不存在多VRF路由平面隔离。
> [!tip]
> 多VRF路由平面隔离会极大地增加DCN管理复杂度
