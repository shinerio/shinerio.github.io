# 1. master和slave数据复制机制
在Redis集群模式下，Master和Slave之间**默认采用异步复制**
- 客户端向Master写入数据后，Master立即返回成功响应，无需等待Slave确认。
- 数据随后异步复制到 Slave 节点。
这种设计的目的是保证高性能和可用性，但存在**数据丢失风险**：如果Master在复制完成前崩溃，未复制到Slave的数据可能丢失。强同步会带来以下问题：
- **性能下降**：等待所有 Slave 确认会显著增加延迟。
- **可用性降低**：只要有一个 Slave 故障，整个集群可能无法写入。
虽然 Redis 集群默认采用异步复制，但在特定场景下可以通过以下方式**近似实现同步复制**
## 1.1. 使用 WAIT 命令（弱同步）
Redis 提供了`WAIT`命令，允许客户端等待数据复制到指定数量的 Slave 后再继续，`WAIT`会等待**当前连接此前执行的所有写命令**（如`SET`、`HSET`、`INCR`等）被复制到至少 N 个 Slave 节点。
```python
import redis

r = redis.Redis(host='localhost', port=6379)

# 执行写操作
r.set('key', 'value')

# 等待数据复制到至少1个Slave，并设置超时时间（毫秒）
r.execute_command('WAIT', 1, 1000)  # 等待1个Slave确认，最多等待1秒
```

```go
func (c cmdable) Wait(ctx context.Context, numSlaves int, timeout time.Duration) *IntCmd {
	cmd := NewIntCmd(ctx, "wait", numSlaves, int(timeout/time.Millisecond))
	_ = c(ctx, cmd)
	return cmd
}
```
**局限性**：
- 仅保证数据复制到 Slave 的内存中，不保证持久化到磁盘。
- 如果所有 Slave 都不可用，`WAIT`会阻塞直到超时。
## 1.2. Allow writes only with N attached replicas
`min-replicas-to-write` 和 `min-replicas-max-lag` 是 Redis **单机模式**（非集群）下的配置参数，用于增强数据安全性：
- **min-replicas-to-write**：至少需要多少个 Slave 同步数据后，Master才接受写操作。
- **min-replicas-max-lag**：Slave与Master的最大延迟（秒），超过此值则认为Slave失效。
**示例配置**：
```conf
# redis.conf（单机模式）
min-replicas-to-write 1
min-replicas-max-lag 10
```

Redis 集群采用 **分片（Sharding）+ 主从复制** 架构，每个主节点（Master）独立管理一部分数据。这种分布式设计导致：
1. **配置复杂性**：每个主节点需单独配置参数，难以统一管理。
2. **可用性权衡**：强制同步会导致单个节点故障影响整个集群写入，违背高可用设计原则。
3. **异步复制优先**：集群默认采用异步复制，追求高性能和可用性。