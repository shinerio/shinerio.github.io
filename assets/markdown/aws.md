aws的nat网关作为vpc的一个特性，创NAT网关的时候可以选择公网还是私网。流量经过NAT网关，源地址都会转成网关的私网地址，公网NAT后面会经过internate gateway，然后将私网地址转换成公网地址。
# 1. 公网NAT
## 1.1. 性能
- 默认5 Gbps，最高100 Gbps
- pps 1M-10M
- 每一个EIP在目的地址不同情况下支持55000个并发连接。
- 公网NAT支持绑定最多两个ip
- 只允许创建一个snat规则绑定所有ip，不允许创建dnat规则。
## 1.2. other
### 1.2.1. IP占用情况
- 创建网关关联一个EIP，默认占用一个私网地址
- 可以额外多关联一个EIP，会额外再占用一个私网地址
# 2. 私网NAT
创建网关的时候可以选择随机分配，也可以指定ip地址，可以自定义1个主ip地址 + 最多7个副ip地址
## 2.1. 重叠网段互访
两个vpc中各创建一个不冲突的子网，然后各创建一个NAT网关。两个可路由的子网使用Transit gateway(ER)连接，配置两条VPC静态路由。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202310042245219.png)

- 默认5 Gbps，最高100 Gbps
- pps 1M-10M
- 每一个EIP在目的地址不同情况下支持55000个并发连接。
- 私网NAT支持最多8个ip。
- 只允许创建一个snat规则绑定所有ip，不允许创建dnat规则。
## 2.2. 指定IP访问IDC
客户端所在子网路由表配置目的地址为对端的送到私网NAT网关；网关所在子网绑定自定义路由表，设置目的地址为对端的送VPN或专线。
# 3. other
## 3.1. 不支持az容灾
要求用户每个az创一个nat网关，然后自己配置路由实现az亲和访问，避免单可用区故障。
## 3.2. 支持NAT64（配合DNS64）
## 3.3. 公网NAT不支持通过其他连接方式过来的流量（如ER/Peering）
## 3.4. transit gateway
类似于ER
# 4. link
[NAT gateways - Amazon Virtual Private Cloud](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
