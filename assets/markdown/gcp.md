google的NAT网关比较特别，不是一个独立的网关设备，而是做在源计算节点上的源端NAT。Cloud NAT 是一种没有代管式中间代理的软件定义解决方案，采用[无阻塞点设计](https://cloud.google.com/nat/docs/overview?hl=zh-cn#architecture)，具有高可靠性、高性能和高可伸缩性。
# 1. 公网NAT
Public NAT 网关会为使用网关创建与互联网的出站连接的每个虚拟机分配一组外部 IP 地址和来源端口。
## 1.1. NAT IP
- 支持自动分配，每个虚拟机分配一段端口
- 当某个EIP没有被任何虚拟机使用时（流量排空），EIP可以被回收，但是当EIP被至少一个虚拟机使用（即使只有一个连接），也不能被释放

## 1.2. other
### 1.2.1. 仅支持SNAT，不支持DNAT
### 1.2.2. 支持自动伸缩NAT IP数量
### 1.2.3. 支持流日志
### 1.2.4. Cloud NAT 网关与单个地区和单个 VPC 网络中的子网 IP 地址范围相关联
无法给ER/Peering等来源流量做NAT
# 2. 私网NAT
两端各创建一个网段不重叠的子网，然后通过ER之类的设备互联，NAT进行地址转换。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202310051419188.png)

## 2.1. ## other
### 2.1.1. 同时支持SNAT和DNAT