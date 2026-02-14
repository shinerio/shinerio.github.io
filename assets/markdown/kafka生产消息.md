# 1. kafka获取partition对应节点
**通过元数据获取**
- Kafka producer 在启动时会向 Kafka 集群中的任意一个 broker（通常是配置中的 bootstrap.servers 列表中的一个）发送元数据请求（Metadata Request）。这个请求用于获取集群的元数据信息，包括主题（topic）的分区（partition）分布情况以及每个 broker 的相关信息。
- 例如，当producer第一次尝试发送消息到一个 topic 时，它会向集群询问这个 topic 的元数据。集群会返回这个 topic 有多少个分区，每个分区的副本分布在哪些 broker 上等信息。这些元数据会在 producer 本地缓存起来，并且会定期（可配置更新间隔）进行更新，以确保信息的准确性。
**缓存更新机制**
- 为了应对集群拓扑结构的变化（如新增 broker、broker 故障等），producer 会定期更新缓存的元数据。当有元数据更新时，例如某个分区的 leader 发生了变更，producer 会收到集群的通知或者在下次更新元数据请求时获取到新的信息。
- 比如，当一个 broker 发生故障时，Kafka 集群会进行重新选举，选出新的分区 leader。producer 下一次更新元数据时，就会获取到这个新的 leader 信息，从而保证消息能够正确地发送到新的 leader 所在的 broker。
# 2. 元数据
在 Kafka 中，元数据主要存储在 Zookeeper 和 Kafka 控制器节点中。
**一、存储在 Zookeeper 中的元数据**
Zookeeper 中存储了以下与 Kafka 相关的元数据信息：
1. 主题（topic）列表：记录了当前 Kafka 集群中的所有主题名称。
2. 分区（partition）信息：包括每个主题的分区数量、分区的领导者副本（leader replica）、跟随者副本（follower replica）等信息。
3. 消费者群组（consumer group）信息：记录了消费者群组的 ID、消费者的成员信息以及消费的偏移量（offset）等。
**二、存储在 Kafka 控制器节点中的元数据**
Kafka 控制器是一个特殊的 broker 节点，负责管理整个Kafka集群的状态。控制器节点中存储了以下元数据：
1. 主题和分区的详细信息：包括分区的状态、副本的分布情况、副本的同步状态等。
2. 领导者副本的选举信息：当领导者副本出现故障时，控制器负责选举新的领导者副本。
3. 集群的配置信息：如 broker的列表、主题的配置参数等。

# 3. 消息发送
我们需要将 Producer 发送的数据封装成一个 ProducerRecord 对象，该对象需要指定一些参数：
- topic：string 类型，NotNull。
- partition：int 类型，可选。
- timestamp：long 类型，可选。
- key：string 类型，可选。
- value：string 类型，可选。
- headers：array 类型，Nullable。

①指明 Partition 的情况下，直接将给定的 Value 作为 Partition 的值。
②没有指明 Partition 但有 Key 的情况下，将 Key 的 Hash 值与分区数取余得到 Partition 值。
③既没有 Partition 有没有 Key 的情况下，第一次调用时随机生成一个整数（后面每次调用都在这个整数上自增），将这个值与可用的分区数取余，得到 Partition 值，也就是常说的 Round-Robin 轮询算法。