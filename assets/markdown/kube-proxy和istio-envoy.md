- 每个节点安装了一个kube-proxy
- 每个pod以sidecar的形式部署一个envoy
- kube-proxy拦截的是进出kubernetes节点的流量，envoy拦截的是进出pod的流量。
- istio作为服务网格的一种实现，本质上提供了应用间的流量、安全管理和可观察性。 
# 1. kube-proxy
K8s集群中每个节点部署一个kube-proxy组件，与k8s api server进行通信，获取集群中的服务信息，然后设置iptables规则，将服务请求直接发送到对应的endpoint。
# 2. Istio
