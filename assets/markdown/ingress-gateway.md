在Kubernetes的服务网格架构中，Ingress Gateway是通过Envoy实现的。在Istio中，Ingress Gateway 是用于管理进入服务网格的流量的组件，它基于 Envoy 代理构建。Envoy 是一个高性能的代理，专门设计用于处理服务到服务的通信，支持动态服务发现、负载均衡、TLS 终止、HTTP/2 和 gRPC 代理、熔断器、健康检查、灰度发布、故障注入和丰富的指标收集等功能。

k8s中istiod和envoy就是典型的控制平面和数据平面的关系。用户通过声明式的方法调用kubernetes api server，istiod将配置转化为数据面能理解的数据，envoy通过xds协议主动从istiod拉去数据。