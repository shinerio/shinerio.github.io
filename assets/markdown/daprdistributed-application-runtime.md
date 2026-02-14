dapr重点落在了runtime上，runtime是一个抽象概念，提供了运行时的实现，不需要开发人员操心，比如Java的runtime环境就是jvm。核心思想是模块化，通过sidecar的方式实现，然后通过本地rpc或者http调用。
# 1. Multi Runtime
分布式应用的需求：
- 生命周期：包括部署，健康检查，水平扩展，配置管理等。kubernetes实现
- 网络：服务发现；接口超时，重试；断路器；点对点通信，订阅和发布；安全；可观测性，这部分主要是service mesh框架想解决的问题，比如istio
- 状态：包括数据库的读写，缓存，定时任务
- 绑定：系统和外部资源的交互，协议转换，消息转换，消息路由
已以上的需求，在传统软件时代是耦合在代码里面的，现在越来越倾向于把软件做薄，把一些分布式的能力从应用中剥离。从业务代码剥离到依赖lib，然后到一些平台层Kubernetes或sidecar中。将应用所需要的能力通过多个runtime提供。
# 2. Dapr架构
Dapr架构的核心要素是API, Building Blocks, Components。其中API通过标准化的方式暴露building block，Building Block是能力的抽象，Components是能力的实现，一个Building Block可以组合使用人意的components，一个component也可以被不同的building block使用。
## 2.1. Building Blocks
Dapr对外提供能力的基本单元，是对分布式能力的抽象和归类
- service-to-service invocation
- State management
- Publish and subscribt
- Resource bindings
- Actors
- Observability
- Secrets
## 2.2. Components
一种component有多个实现，如消息中间件component的实现有Kafka，redis等。
## 2.3. API
应用如何使用这些分布式能力是dapr最核心的设计，dapr利用标准API暴露各种分布式能力。dapr提供两种API：http1.1/REST和http2/grocery，两种功能是等价的。应用只需要按照API规范发起，不管是服务访问，还是存储，还是发布消息到消息队列，都是HTTP接口。不管是操作redid还是操作mysql都是一样的API，一切所需能力均可以用http协议表示。
# 3. [Dapr sidecar进程概述](https://v1-5.docs.dapr.io/zh-hans/concepts/dapr-services/sidecar/)
Dapr 使用 [sidecar 模式](https://v1-5.docs.dapr.io/zh-hans/concepts/overview/#sidecar-architecture)，这意味着 Dapr API 在与应用程序一起运行的单独进程（即 Dapr sidecar）上运行和公开。 Dapr sidecar 进程名为`daprd` ，并且根据不同的宿主环境有不同的启动方式。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202309242221262.png)
可以通过如下命令启动一个名叫myapp的空白应用，同时会启动Dapr sidecar。
```
dapr run --app-id myapp --dapr-http-port 3500
```


# 4. [状态管理](https://docs.dapr.io/zh-hans/developing-applications/building-blocks/state-management/state-management-overview/)
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/202309242219797.png)

## 4.1. 并发控制
基与Etags乐观并发控制（OCC）， 当一个发送请求操作状态时，Dapr会给返回的状态附加一个ETag属性。 当用户代码试图更新或删除一个状态时，它应该通过更新的请求体或删除的`If-Match`头附加ETag。 只有当提供的ETag与状态存储中的ETag匹配时，写操作才能成功。
# 5. SideCar模式

# 6. 参考链接
[Dapr|云原生的抽象和实现](https://zhuanlan.zhihu.com/p/366526565)