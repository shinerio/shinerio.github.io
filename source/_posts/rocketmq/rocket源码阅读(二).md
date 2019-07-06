---
title: rocket源码阅读(二)
date: 2019-07-06
categories:
- rocket
tags:
- rocket
- 中间件
---

## NamesrvController的核心组件

NameServer主要作用是为消息生产者和消息消费者提供关于主题的Topic的路由消息，那么NameServer需要存储路由的基础信息，还要能够管理Broker节点，包括路由的注册、路由的删除。NamesrvController有几个核心组件，分别是，kvConfigMangager，routeInfoManager和remotingServer

<!--more-->

# 1. routeInfoManger

## 1.1 主要属性

```java
la'susterName */, Set<String/* brokerName */>> clusterAddrTable; 
 private final HashMap<String/* brokerAddr */, BrokerLiveInfo> brokerLiveTable;
 private final HashMap<String/* brokerAddr */, List<String>/* Filter Server */> filterServerTable;
```

- topicQueueTable

  Topic路由信息，消息发送时根据路由负载均衡。

  ```java
  //一个Topic拥有多个消息队列，一个broker为每一主题创建readQueueNums个读队列
  //writeQueueNums个写队列。
  public class QueueData implements Comparable<QueueData> {
      private String brokerName;  
      private int readQueueNums;  
      private int writeQueueNums;
      private int perm;   //读写权限，详见org.apache.rocketmq.common.constant.PermName
      private int topicSynFlag;  //topic同步标记，详见org.apache.rocketmq.common.sysflag.TopicSysFlag
  ```

- brokerAddrTable

  broker及时信息，包括brokerName，所属集群名称，主备Broker地址

  ```java
  public class BrokerData implements Comparable<BrokerData> {
      private String cluster;
      private String brokerName;
    	//BrokerName名字相同的多台机器组成Master-slave架构,通过brokerId做区分
      private HashMap<Long/* brokerId */, String/* broker address */> brokerAddrs;
  }
  ```

- clusterAddrTable

  broker集群信息，存储集群及集群锁包含的broker。多个Broker组成一个集群。

- brokerLivetable

  broker的状态信息，NameServer每次收到心跳包时会替换该信息

  ```java
  class BrokerLiveInfo {
      private long lastUpdateTimestamp;   //NameServer上次收到心跳包时间
      private DataVersion dataVersion;
      private Channel channel;
      private String haServerAddr;   //master地址，初次请求是值为空，slave向NameServer注册后返回
  
  }
  ```

- filterServerTable

  broker上的FilterServer列表，用于类模式消息过滤

## 1.2 路由注册

RocketMQ的路由注册时通过Broker与NameServer的心跳实现的。Broker启动时向集群中所有的NameServer发送心跳语句，每隔30s向集群中所有NameServer发送心跳包，NameServer收到心跳包后更新lastUpdateTimestamp。

### 1.2.1 broker发送心跳包

```java
//BrokerController
//BrokerConfig中设定private int registerNameServerPeriod = 1000 * 30;
this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {
         		@Override
            public void run() {
                try {
                    BrokerController.this.registerBrokerAll(true, false, brokerConfig.isForceRegister());
                } catch (Throwable e) {
                    log.error("registerBrokerAll Exception", e);
                }
            }
}，, 1000 * 10, Math.max(10000, Math.min(brokerConfig.getRegisterNameServerPeriod(), 60000)), TimeUnit.MILLISECONDS);
```

核心心跳代码维护在BrokerOuterAPI

- 使用了CountDownLatch来并发向所有NameServer发送心跳消息，同时等到此时心跳发送结果
- 心跳包包含topic的信息以及broker属性相关

```java
    public List<RegisterBrokerResult> registerBrokerAll(
        final String clusterName,
        final String brokerAddr,
        final String brokerName,
        final long brokerId,
        final String haServerAddr,
        final TopicConfigSerializeWrapper topicConfigWrapper,
        final List<String> filterServerList,
        final boolean oneway,
        final int timeoutMills,
        final boolean compressed) {

        final List<RegisterBrokerResult> registerBrokerResultList = Lists.newArrayList();
        List<String> nameServerAddressList = this.remotingClient.getNameServerAddressList();
        if (nameServerAddressList != null && nameServerAddressList.size() > 0) {

            final RegisterBrokerRequestHeader requestHeader = new RegisterBrokerRequestHeader();
            requestHeader.setBrokerAddr(brokerAddr);
            requestHeader.setBrokerId(brokerId);
            requestHeader.setBrokerName(brokerName);
            requestHeader.setClusterName(clusterName);
            requestHeader.setHaServerAddr(haServerAddr);
            requestHeader.setCompressed(compressed);

            RegisterBrokerBody requestBody = new RegisterBrokerBody();
            requestBody.setTopicConfigSerializeWrapper(topicConfigWrapper);
            requestBody.setFilterServerList(filterServerList);
            final byte[] body = requestBody.encode(compressed);
            final int bodyCrc32 = UtilAll.crc32(body);
            requestHeader.setBodyCrc32(bodyCrc32);
            final CountDownLatch countDownLatch = new CountDownLatch(nameServerAddressList.size());
            for (final String namesrvAddr : nameServerAddressList) {
                brokerOuterExecutor.execute(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            RegisterBrokerResult result = registerBroker(namesrvAddr,oneway, timeoutMills,requestHeader,body);
                            if (result != null) {
                                registerBrokerResultList.add(result);
                            }

                            log.info("register broker[{}]to name server {} OK", brokerId, namesrvAddr);
                        } catch (Exception e) {
                            log.warn("registerBroker Exception, {}", namesrvAddr, e);
                        } finally {
                            countDownLatch.countDown();
                        }
                    }
                });
            }

            try {
                countDownLatch.await(timeoutMills, TimeUnit.MILLISECONDS);
            } catch (InterruptedException e) {
            }
        }
        return registerBrokerResultList;
    }
```

### 1.2.2 NameServer处理心跳包

RouteInfoManager注册broker

```java
   public RegisterBrokerResult registerBroker(
        final String clusterName,
        final String brokerAddr,
        final String brokerName,
        final long brokerId,
        final String haServerAddr,
        final TopicConfigSerializeWrapper topicConfigWrapper,
        final List<String> filterServerList,
        final Channel channel) {
        RegisterBrokerResult result = new RegisterBrokerResult();
        try {
            try {
                this.lock.writeLock().lockInterruptibly();
                //1. 获取broker集群
                Set<String> brokerNames = this.clusterAddrTable.get(clusterName);
                //1.1 集群不存在，新建
                if (null == brokerNames) {
                    brokerNames = new HashSet<String>();
                    this.clusterAddrTable.put(clusterName, brokerNames);
                }
                //1.2 集群存在，将broker加入相应集群，brokerNames被设计成了Set，所以每次心跳都可以直接加进去，不用判断是否存在
                brokerNames.add(brokerName);

                boolean registerFirst = false;

                BrokerData brokerData = this.brokerAddrTable.get(brokerName);
                //2. 判断broker是否存在，broker不存在，则为标记第一次注册
                if (null == brokerData) {
                    registerFirst = true;
                    brokerData = new BrokerData(clusterName, brokerName, new HashMap<Long, String>());
                    this.brokerAddrTable.put(brokerName, brokerData);
                }
                Map<Long, String> brokerAddrsMap = brokerData.getBrokerAddrs();
                //Switch slave to master: first remove <1, IP:PORT> in namesrv, then add <0, IP:PORT>
                //The same IP:PORT must only have one record in brokerAddrTable
                Iterator<Entry<Long, String>> it = brokerAddrsMap.entrySet().iterator();
                //2.1 broker已存在，非第一次注册，如果心跳的broker地址和Map中的地址一致但是brokerId不一致的话，说明更改了brokerId，所以需要移除旧的
                while (it.hasNext()) {
                    Entry<Long, String> item = it.next();
                    if (null != brokerAddr && brokerAddr.equals(item.getValue()) && brokerId != item.getKey()) {
                        it.remove();
                    }
                }
                //2.2 注册新brokerId
                String oldAddr = brokerData.getBrokerAddrs().put(brokerId, brokerAddr);
                registerFirst = registerFirst || (null == oldAddr);

                //3. 如果是master的心跳包并且是初次注册的话，则需要更新路由信息，更新topicQueueTable
                if (null != topicConfigWrapper
                    && MixAll.MASTER_ID == brokerId) {   //brokerId为0的是master
                    if (this.isBrokerTopicConfigChanged(brokerAddr, topicConfigWrapper.getDataVersion())
                        || registerFirst) {
                        ConcurrentMap<String, TopicConfig> tcTable =
                            topicConfigWrapper.getTopicConfigTable();
                        if (tcTable != null) {
                            for (Map.Entry<String, TopicConfig> entry : tcTable.entrySet()) {
                                this.createAndUpdateQueueData(brokerName, entry.getValue());
                            }
                        }
                    }
                }
                // 4. 更新brokerLiveInfo信息
                BrokerLiveInfo prevBrokerLiveInfo = this.brokerLiveTable.put(brokerAddr,
                    new BrokerLiveInfo(
                        System.currentTimeMillis(),
                        topicConfigWrapper.getDataVersion(),
                        channel,
                        haServerAddr));
                if (null == prevBrokerLiveInfo) {
                    log.info("new broker registered, {} HAServer: {}", brokerAddr, haServerAddr);
                }
                // 5. 注册broker的过滤器server地址列表，一个broker会关联多个FilterLis
                if (filterServerList != null) {
                    if (filterServerList.isEmpty()) {
                        this.filterServerTable.remove(brokerAddr);
                    } else {
                        this.filterServerTable.put(brokerAddr, filterServerList);
                    }
                }
                // 6. 如果心跳包来自slave节点，那么需要返回master节点的地址给broker
                if (MixAll.MASTER_ID != brokerId) {
                    String masterAddr = brokerData.getBrokerAddrs().get(MixAll.MASTER_ID);
                    if (masterAddr != null) {
                        BrokerLiveInfo brokerLiveInfo = this.brokerLiveTable.get(masterAddr);
                        if (brokerLiveInfo != null) {
                            result.setHaServerAddr(brokerLiveInfo.getHaServerAddr());
                            result.setMasterAddr(masterAddr);
                        }
                    }
                }
            } finally {
                this.lock.writeLock().unlock();
            }
        } catch (Exception e) {
            log.error("registerBroker Exception", e);
        }

        return result;
    }
```

## 1.3 删除路由

routInfoManager每隔10秒扫面一次brokerLiveTable，如果lastUpdateTimestamp滞后当前系统时间超过`BROKER_CHANNEL_EXPIRED_TIME`，认为broker节点失效，关闭与broker的连接，移除broker。调用`onChannelDestory`方法同时更新`topicQueueTabel、brokerAddrTable、brokerLiveTable和filterServerTable`

```java
public void scanNotActiveBroker() {
    Iterator<Entry<String, BrokerLiveInfo>> it = this.brokerLiveTable.entrySet().iterator();
    while (it.hasNext()) {
        Entry<String, BrokerLiveInfo> next = it.next();
        long last = next.getValue().getLastUpdateTimestamp();
        if ((last + BROKER_CHANNEL_EXPIRED_TIME) < System.currentTimeMillis()) {
            RemotingUtil.closeChannel(next.getValue().getChannel());
            it.remove();
            log.warn("The broker channel expired, {} {}ms", next.getKey(), BROKER_CHANNEL_EXPIRED_TIME);
            this.onChannelDestroy(next.getKey(), next.getValue().getChannel());
        }
    }
}
```

> NameServer与broker之间通过RemotingUtils保持长连接。

## 1.4 路由发现

RocketMQ路由发现是非实时的， 当Topic路由出现变化后，NameServer不主动推送给客户端，而是由客户端定时拉取Topic最新的路由。通过发送`RequestCode.GET_ROUTEINTO_BY_TOPIC`到`DefaultRequestProcesser`。

```java
 public RemotingCommand getRouteInfoByTopic(ChannelHandlerContext ctx,
        RemotingCommand request) throws RemotingCommandException {
        final RemotingCommand response = RemotingCommand.createResponseCommand(null);
        final GetRouteInfoRequestHeader requestHeader =
            (GetRouteInfoRequestHeader) request.decodeCommandCustomHeader(GetRouteInfoRequestHeader.class);
        //从NameServer从获取topic相关路由信息
        TopicRouteData topicRouteData = this.namesrvController.getRouteInfoManager().pickupTopicRouteData(requestHeader.getTopic());

        if (topicRouteData != null) {
            //如果是顺序消息，从kvConfig中拿到顺序相关配置
            if (this.namesrvController.getNamesrvConfig().isOrderMessageEnable()) {
                String orderTopicConf =
                    this.namesrvController.getKvConfigManager().getKVConfig(NamesrvUtil.NAMESPACE_ORDER_TOPIC_CONFIG,
                        requestHeader.getTopic());
                topicRouteData.setOrderTopicConf(orderTopicConf);
            }

            byte[] content = topicRouteData.encode();
            response.setBody(content);
            response.setCode(ResponseCode.SUCCESS);
            response.setRemark(null);
            return response;
        }
        //未找到相关topic路由
        response.setCode(ResponseCode.TOPIC_NOT_EXIST);
        response.setRemark("No topic route info in name server for the topic: " + requestHeader.getTopic()
            + FAQUrl.suggestTodo(FAQUrl.APPLY_TOPIC_URL));
        return response;
    }
```

## 1.5 ReentrantReadWriteLock

在`onChannelDestory`中用到了读写锁。

- routeInfoManager中维护的信息都是多线程竞争使用的，会被频繁的读取，而销毁则需要加锁，通过读写锁实现读写分离
- 先加读锁的目的，写锁是一个排他锁，直接加写锁会导致其他线程拿不到读锁，而此时channel不存在，固造成线程阻塞，资源浪费，先用读锁判断channel存在，此时就必须加写锁进行broker信息删除。

```java
this.lock.readLock().lockInterruptibly();   //获取锁，如果线程被中断，自动释放锁
//通过读锁获取查找被销毁的Broker对应的channel
...
brokerAddrFound = entry.getKey();
...
this.lock.readLock().unlock();
```

```java
this.lock.writeLock().lockInterruptibly();
//获取写锁，删除broker相关信息
...
this.brokerLiveTable.remove(brokerAddrFound);
this.filterServerTable.remove(brokerAddrFound);
...
this.lock.writeLock().unlock();
```

> 这里有一些优化，虽然scan方法是有NameServer定时执行，不会存并发调用这个方法，但是代码还是可以优化一下的，将if判定放到加锁之后更合适

```java
if (brokerAddrFound != null && brokerAddrFound.length() > 0) {
            //if判定成功后，当前线程被挂起，其他线程进行了channel删除，if条件应该下沉到加写锁后
            try {
                try {
                    this.lock.writeLock().lockInterruptibly();
                    this.brokerLiveTable.remove(brokerAddrFound);
                    this.filterServerTable.remove(brokerAddrFound);
                  .......
```

# 2. 框图总结

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/rocketMQ路由机制.png)

# 3. 尚存疑问

- nameserver需要120s才能移除宕机Broker，此时producer根据路由信息路由到了宕机的broker如何处理
- nameserver如何借助topicQueueTable实现负载均衡的
- kvConfigManager和brokerHouseKeepingService的作用