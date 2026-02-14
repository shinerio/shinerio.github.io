# 1. go-redis
在go- redis中，连接设置是通过 Options 结构体来管理的。

## 1.1. 单机模式
-  Network - 网络类型，可以是 tcp 或 unix，默认值为 tcp。
- Addr -  Redis 服务器的 host:port 地址。
- Dialer - 创建新网络连接的函数，优先于Network和Addr选项。
- OnConnect - 新连接建立时调用的钩子函数。
- Username - 连接 Redis 6.0 及更高版本时使用的用户名，用于身份验证。
- Password - 连接 Redis 时使用的可选密码。
- DB - 连接后选择的数据库编号。
- MaxRetries - 在放弃之前的最大重试次数，默认是 3。
- MinRetryBackoff - 每次重试之间的最小等待时间，默认是 8 毫秒。
- MaxRetryBackoff - 每次重试之间的最大等待时间，默认是 512 毫秒。
- DialTimeout - 建立新连接的超时时间，默认是 5 秒。
- ReadTimeout - 套接字读取的超时时间，默认是 3 秒。
- WriteTimeout - 套接字写入的超时时间，默认是 3 秒。
- PoolTimeout - 如果所有连接都忙碌，客户端等待连接的时间，默认是 ReadTimeout + 1 秒。 
- MinIdleConns - 最少的idle状态的连接数
- IdleTimeout：Amount of time after which client closes idle connections.  // Should be less than server's timeout.  // Default is 5 minutes. -1 disables idle timeout check.
- MaxConnAge - Connection age at which client retires (closes) the connection.  // Default is to not close aged connections.
- IdleCheckFrequency：Frequency of idle checks made by idle connections reaper.  // Default is 1 minute. -1 disables idle connections reaper,  // but idle connections are still discarded by the client  // if IdleTimeout is set.
- Limiter - 用于实现断路器或速率限制的接口。 

## 1.2. 哨兵模式
```go
type FailoverOptions struct {
	// The master name.
	MasterName string
	// A seed list of host:port addresses of sentinel nodes.
	SentinelAddrs []string
	// Sentinel password from "requirepass <password>" (if enabled) in Sentinel configuration
	SentinelPassword string

	// Allows routing read-only commands to the closest master or slave node.
	// This option only works with NewFailoverClusterClient.
	RouteByLatency bool
	// Allows routing read-only commands to the random master or slave node.
	// This option only works with NewFailoverClusterClient.
	RouteRandomly bool

	// Route all commands to slave read-only nodes.
	SlaveOnly bool

	// Use slaves disconnected with master when cannot get connected slaves
	// Now, this option only works in RandomSlaveAddr function.
	UseDisconnectedSlaves bool

	// Following options are copied from Options struct.

	Dialer    func(ctx context.Context, network, addr string) (net.Conn, error)
	OnConnect func(ctx context.Context, cn *Conn) error

	Username string
	Password string
	DB       int

	MaxRetries      int
	MinRetryBackoff time.Duration
	MaxRetryBackoff time.Duration

	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	PoolSize           int
	MinIdleConns       int
	MaxConnAge         time.Duration
	PoolTimeout        time.Duration
	IdleTimeout        time.Duration
	IdleCheckFrequency time.Duration

	TLSConfig *tls.Config
}
```

## 1.3. 集群模式
```go
type ClusterOptions struct {
	// A seed list of host:port addresses of cluster nodes.
	Addrs []string

	// NewClient creates a cluster node client with provided name and options.
	NewClient func(opt *Options) *Client

	// The maximum number of retries before giving up. Command is retried
	// on network errors and MOVED/ASK redirects.
	// Default is 3 retries.
	MaxRedirects int

	// Enables read-only commands on slave nodes.
	ReadOnly bool
	// Allows routing read-only commands to the closest master or slave node.
	// It automatically enables ReadOnly.
	RouteByLatency bool
	// Allows routing read-only commands to the random master or slave node.
	// It automatically enables ReadOnly.
	RouteRandomly bool

	// Optional function that returns cluster slots information.
	// It is useful to manually create cluster of standalone Redis servers
	// and load-balance read/write operations between master and slaves.
	// It can use service like ZooKeeper to maintain configuration information
	// and Cluster.ReloadState to manually trigger state reloading.
	ClusterSlots func(context.Context) ([]ClusterSlot, error)

	// Following options are copied from Options struct.

	Dialer func(ctx context.Context, network, addr string) (net.Conn, error)

	OnConnect func(ctx context.Context, cn *Conn) error

	Username string
	Password string

	MaxRetries      int
	MinRetryBackoff time.Duration
	MaxRetryBackoff time.Duration

	DialTimeout  time.Duration
	ReadTimeout  time.Duration
	WriteTimeout time.Duration

	// PoolSize applies per cluster node and not for the whole cluster.
	PoolSize           int
	MinIdleConns       int
	MaxConnAge         time.Duration
	PoolTimeout        time.Duration
	IdleTimeout        time.Duration
	IdleCheckFrequency time.Duration

	TLSConfig *tls.Config
}
```

# 2. java-lettuce
## 2.1. 集群模式
- [spring.redis.lettuce.cluster.refresh.adaptive](https://github.com/redis/lettuce/wiki/Redis-Cluster#user-content-refreshing-the-cluster-topology-view)：redis集群拓扑自动刷新，默认false
- spring.redis.lettuce.cluster.refresh.period：集群拓扑刷新周期
- spring.redis.lettuce.pool.time-between-eviction-runs：空闲对象逐出器线程的运行间隔时间。当为正值时，空闲对象逐出器线程启动，否则不执行空闲对象逐出。
> [!note]
> The Redis Cluster configuration may change at runtime. New nodes can be added, the master for a specific slot can change. Lettuce handles `MOVED` and `ASK` redirects transparently but in case too many commands run into redirects, you should refresh the cluster topology view. The topology is bound to a `RedisClusterClient` instance. All cluster connections that are created by one `RedisClusterClient` instance share the same cluster topology view.

故障无法切换的问题可以参考：https://blog.csdn.net/zzhongcy/article/details/107043589