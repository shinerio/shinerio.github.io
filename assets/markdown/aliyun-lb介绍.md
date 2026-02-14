# 1. ALB
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202506222005646.png)
- 每个可用区占用三个ip，一个vip，两个local ip
- 每个vip可以独立绑定eip
- [ALB具备可用区级容灾能力](https://help.aliyun.com/zh/slb/application-load-balancer/use-cases/realize-alb-zone-level-disaster-recovery-drill-through-cadt)。ALB实例的杭州**可用区H**发生故障时，ALB能够在短时间内停用该可用区，并继续使用其他启用的可用区提供服务。
- ALB默认开启跨AZ负载均衡，即ALB在同地域跨可用区的后端服务之间分配流量。当ALB挂载的服务器组关闭跨AZ负载均衡时，ALB仅在同地域同可用区的后端服务之间分配流量。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202506221854362.png)

## 1.1. ipv6支持
双栈ALB前后端均支持ipv4和ipv6
## 1.2. 流量镜像
ALB提供的流量镜像功能可以实现在线流量仿真，将在线流量镜像到测试环境的后端服务器，同时ALB自动丢弃镜像后端服务器返回的响应数据，保证镜像后端服务器的测试业务不会影响到线上业务，主要有以下应用场景：
- 测试新功能和服务性能。
- 仿真线上数据，不需要额外制造测试数据。
- 复现线上问题，方便故障定位。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202506221830541.png)
# 2. gwlb
网关型负载均衡GWLB（Gateway Load Balancer）是三层负载均衡，通过IP监听可将所有端口的流量分发给后端服务器组中的网络虚拟设备NVA（Network Virtual Appliance），可帮轻松实现各类网络虚拟设备的高可用部署，例如：防火墙、入侵检测、流量镜像、深度报文检测等。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian202506221800100.png)
1. 进出GWLBe的流量使用路由表进行控制。
2. 访问流量通过GWLBe路由至GWLB，经过后端网络虚拟设备检测过滤后，再次被路由回相应的GWLBe，最终转发至应用端。
3. GWLB使用IP全端口监听，可将访问流量透明地转发到IP监听所关联的后端服务器组中，，GWLB会将同一特征的流量路由到相同后端网络虚拟设备中，支持基于以下一致性hash算法来调度流量
	- 五元组（源IP、目的IP、传输协议、源端口、目的端口）
	- 三元组（源IP、目的IP、传输协议）
	- 二元组（源IP、目的IP）