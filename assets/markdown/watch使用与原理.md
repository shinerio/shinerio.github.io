Watch机制是etcd的核心功能之一，它允许客户端监听指定键或前缀的变化，实现配置变更的实时通知。默认情况下，watch是从<font color="#ff0000">最新版本</font>开始监听的。
# 1. 使用方式
## 1.1. 基本使用
```shell
etcdctl watch --prefix /app
# PUT
# /app
# myapp2
# PUT
# /app/owner
# shinerio
```
添加或修改key
```shell
etcdctl put /app myapp2
# OK
etcdctl put /app/owner shinerio
# OK
```
etcd提供了多种方式使用Watch功能
### 1.1.1. 命令行方式
```shell
# 监听单个键 
etcdctl watch mykey 
# 监听带有特定前缀的所有键 
etcdctl watch --prefix /myapp/ 
# 从特定历史版本开始监听 
etcdctl watch mykey --rev=3 
# 以JSON格式输出变更 
etcdctl -w=json watch mykey
```
### 1.1.2. API调用方式
 Go客户端示例
```go
// Go客户端示例
watcher := clientv3.NewWatcher(client)
watchChan := watcher.Watch(context.Background(), "/app", clientv3.WithPrefix())

for watchResp := range watchChan {
    for _, event := range watchResp.Events {
        fmt.Printf("Type: %s Key:%s Value:%s\n", 
                   event.Type, event.Kv.Key, event.Kv.Value)
    }
}
```
支持以下高级选项
1. **指定版本**:
    - 从特定版本开始监听: `WithRev(revision)`
    - 仅获取最新事件: `WithLastRev()`
2. **范围监听**:
    - 前缀监听: `WithPrefix()`
    - 范围监听: `WithRange(endKey)`
3. **事件过滤**:
    - 仅接收PUT事件: `WithFilterPut()`
    - 仅接收DELETE事件: `WithFilterDelete()`
4. **进度通知**:
    - 当没有事件时发送进度更新: `WithProgressNotify()`
    - 用于确认连接活跃性
# 2. 工作原理
## 2.1. 整体架构
Watch机制的核心组件包括：
1. **watchableStore**: 可监听的存储层
2. **watcherGroup**: 监听器群组管理
3. **watcher**: 单个监听器
4. **eventBuffer**: 事件缓冲区
## 2.2. 事件流转过程
1. **客户端发起Watch请求**:
    - 指定key/范围、起始版本等参数
    - 建立长连接(通常基于gRPC流)
2. **服务端注册watcher**:
    - 创建watcher对象
    - 将watcher添加到watcherGroup中
    - 根据起始版本决定是否需要从历史事件开始发送
3. **同步历史事件**:
	- 如果客户端指定了过去的版本号，服务端会从MVCC存储中查询该版本到当前的所有历史事件，将这些事件发送给客户端。
4. **异步事件通知**:
    - 当etcd处理写请求时，会同时：
        - 应用到存储层
        - 通过触发器(trigger)通知watchableStore
    - watchableStore将事件分发给匹配的watcher
    - 通过长连接将事件推送给客户端
## 2.3. MVCC的重要作用
Watch机制严重依赖etcd的MVCC(多版本并发控制)功能：
1. 每个修改操作都会生成新的版本号(revision)
2. 历史版本使得Watch可以从<font color="#ff0000">任意点"回溯"监听</font>
3. 由于保留了历史版本，即使客户端断开重连，也不会错过事件
## 2.4. 内存和性能优化
为了高效处理大量Watch请求，etcd采用了多种优化：
1. **批处理机制**:
    - 多个事件会被批量发送给客户端
    - 减少网络往返次数
2. **压缩与淘汰**:
    - 基于时间/版本的自动压缩
    - 设置内存上限，超出时淘汰不活跃的watcher
3. **按需机制**:
    - 服务端维护未发送的事件队列
    - 客户端ready时才发送
4. **进度通知**:
    - 定期发送当前进度，避免长时间无事件导致连接失效
## 2.5. 可靠性保障
etcd Watch提供高可靠性保证：
1. **断线重连**:
    - 客户端断开连接后可从上次接收到的版本继续监听
    - 不会丢失中间发生的事件
2. **版本保证**:
    - 只要历史版本未被压缩，客户端总能收到完整事件序列
    - 如果请求的版本已被压缩，服务端会返回压缩错误
3. **集群支持**:
    - Watch请求可发送到任何集群成员
    - Leader变更不影响Watch功能
# 3. 常见挑战和解决方案
1. **历史事件压缩**:
    - 问题：如果监听的**起始版本已被压缩，将无法获取完整事件**
    - 解决：合理设置压缩策略，或实现备用同步机制
2. **大量watcher的性能**:
    - 问题：大量watcher可能导致内存压力和事件分发延迟
    - 解决：使用前缀合并，减少watcher数量；合理设置服务端资源限制
3. **网络中断处理**:
    - 问题：长时间网络中断可能丢失事件
    - 解决：实现健壮的重连逻辑，记录最后处理的版本号