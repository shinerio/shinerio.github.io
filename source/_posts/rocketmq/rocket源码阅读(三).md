---
title: rocket源码阅读(三)
date: 2019-07-07
categories: 
- rocket
tags:
- rocket
- 中间件
---

# 1. 带着问题看源码

- 负载均衡如何实现
- 如何维护路由
- 消息投递过程如何实现at least once

<!--more-->

# 2. 消息结构

```java
public class Message implements Serializable {
    private static final long serialVersionUID = 8445773977080406428L;
    private String topic;
    private int flag;
  	//扩展属性，org.apache.rocketmq.common.message.MessageConst
    private Map<String, String> properties;  
    private byte[] body;  //消息体
    private String transactionId;
}
```

# 3. Rocket消息发送的方式

- 可靠同步发送

  发送者向 MQ 执行发送消息 API 时，同步等待， 直到消息服务器返回发送结果

- 可靠异步发送

  发送者向 MQ 执行发送消息 API 时，指定消息发送成功后的回调函数，然后调用消息发送API 后，立即返回，消息发送者线程不阻塞 ，直到运行结束，消息发送成功或失败的回调任务在一个新的线程中执行 。 

- 单向发送(OneWay)

  消息发送者向 MQ 执行发送消息 API 时，直接返回，不等待消息服务器的结果，也不注册回调函数，简单地说，就是只管发，不在乎消息是否成功存储在消息服务器上

# 4. Producer

## 4.1 启动流程

`DefaultMQProducer`是默认的消息生产者实现类，实现了MQAdmin接口。

```java
  @Override
    public void start() throws MQClientException {
      	//设置producerGroup
        this.setProducerGroup(withNamespace(this.producerGroup)); 
        this.defaultMQProducerImpl.start();
        if (null != traceDispatcher) {
            try {
                traceDispatcher.start(this.getNamesrvAddr(), this.getAccessChannel());
            } catch (MQClientException e) {
                log.warn("trace dispatcher start failed ", e);
            }
        }
    }
//defaultMQProducerImpl.start()
public void start(final boolean startFactory) throws MQClientException {
        switch (this.serviceState) {
            // 初始状态为create_just
            case CREATE_JUST:
                //设置状态为start_failed，若中间不出错，则最后会设置成running状态
                this.serviceState = ServiceState.START_FAILED;
                // 检查producerGroup命名是否合法
                this.checkConfig();
                // 将InstanceName设置为pid，避免clientId冲突
                if (!this.defaultMQProducer.getProducerGroup().equals(MixAll.CLIENT_INNER_PRODUCER_GROUP)) {
                    this.defaultMQProducer.changeInstanceNameToPID();
                }
                // MQClientManager为单例模式，维护了ConcurrentMap<String/* clientId */, MQClientInstance>，clientId由ip地址，instanceName等组成
                this.mQClientFactory = MQClientManager.getInstance().getAndCreateMQClientInstance(this.defaultMQProducer, rpcHook);
                // 向MQClientManager注册自己，put到上面的ConcurrentMap中
                boolean registerOK = mQClientFactory.registerProducer(this.defaultMQProducer.getProducerGroup(), this);
                if (!registerOK) {
                    this.serviceState = ServiceState.CREATE_JUST;
                    throw new MQClientException("The producer group[" + this.defaultMQProducer.getProducerGroup()
                        + "] has been created before, specify another name please." + FAQUrl.suggestTodo(FAQUrl.GROUP_NAME_DUPLICATE_URL),
                        null);
                }

                this.topicPublishInfoTable.put(this.defaultMQProducer.getCreateTopicKey(), new TopicPublishInfo());
                //启动mqClientInstance
                if (startFactory) {
                    mQClientFactory.start();
                }

                log.info("the producer [{}] start OK. sendMessageWithVIPChannel={}", this.defaultMQProducer.getProducerGroup(),
                    this.defaultMQProducer.isSendMessageWithVIPChannel());
                this.serviceState = ServiceState.RUNNING;
                break;
            case RUNNING:
            case START_FAILED:
            case SHUTDOWN_ALREADY:
                throw new MQClientException("The producer service state not OK, maybe started once, "
                    + this.serviceState
                    + FAQUrl.suggestTodo(FAQUrl.CLIENT_SERVICE_NOT_OK),
                    null);
            default:
                break;
        }
  			//produce与broker保持长连接
        this.mQClientFactory.sendHeartbeatToAllBrokerWithLock();
```

# 4.2 发送消息

默认消息发送以同步的方式进行。

```java
    @Override
    public SendResult send(
        Message msg) throws MQClientException, RemotingException, MQBrokerException, InterruptedException {
        Validators.checkMessage(msg, this);
        msg.setTopic(withNamespace(msg.getTopic()));
        return this.defaultMQProducerImpl.send(msg);
    }
```

消息发送的主要步骤为：验证消息、查找路由和消息发送

### 4.2.1 查找路由

```java
TopicPublishInfo topicPublishInfo = this.tryToFindTopicPublishInfo(msg.getTopic());
private TopicPublishInfo tryToFindTopicPublishInfo(final String topic) {
        TopicPublishInfo topicPublishInfo = this.topicPublishInfoTable.get(topic);
        if (null == topicPublishInfo || !topicPublishInfo.ok()) {
            this.topicPublishInfoTable.putIfAbsent(topic, new TopicPublishInfo());
            // 路由不存在，从nameServer中获取路由信息
            this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic);
            topicPublishInfo = this.topicPublishInfoTable.get(topic);
        }
        // 如果缓存了此topic的路由，则直接返回
        if (topicPublishInfo.isHaveTopicRouterInfo() || topicPublishInfo.ok()) {
            return topicPublishInfo;
        } else {
            this.mQClientFactory.updateTopicRouteInfoFromNameServer(topic, true, this.defaultMQProducer);
            topicPublishInfo = this.topicPublishInfoTable.get(topic);
            return topicPublishInfo;
        }
}
```

```java
public class TopicPublishInfo {
    private boolean orderTopic = false
    private boolean haveTopicRouterInfo = false;
   	private List<MessageQueue> messageQueueList = new ArrayList<MessageQueue>();
    private volatile ThreadLocalIndex sendWhichQueue = new ThreadLocalIndex();
  	private TopicRouteData topicRouteData;
}	
```

路由选择的核心代码

```java
//记录上次broker
String lastBrokerName = null == mq ? null : mq.getBrokerName();
MessageQueue mqSelected = this.selectOneMessageQueue(topicPublishInfo, lastBrokerName);
```

默认不采用故障延迟功能

```java
public MessageQueue selectOneMessageQueue(final String lastBrokerName) {
        if (lastBrokerName == null) {
            //第一次路由，取余实现负载均衡
            return selectOneMessageQueue();
        } else {  //非第一次排除上次故障broker
            int index = this.sendWhichQueue.getAndIncrement();
            //防止陷入循环
            for (int i = 0; i < this.messageQueueList.size(); i++) {
                int pos = Math.abs(index++) % this.messageQueueList.size();
                if (pos < 0)
                    pos = 0;
                MessageQueue mq = this.messageQueueList.get(pos);
                if (!mq.getBrokerName().equals(lastBrokerName)) {
                    return mq;
                }
            }
            return selectOneMessageQueue();
        }
    }

    public MessageQueue selectOneMessageQueue() {
        // 基数自增长，对队列区域取余实现负载均衡
        int index = this.sendWhichQueue.getAndIncrement();
        int pos = Math.abs(index) % this.messageQueueList.size();
        if (pos < 0)
            pos = 0;
        return this.messageQueueList.get(pos);
    }

```

### 4.2.2

```java
sendResult = this.sendKernelImpl(msg, mq, communicationMode, sendCallback, topicPublishInfo, timeout - costTime);
```

同步调用的时候，会通过sendResult来保证消息已经被准备投递，但是无法避免因为网络延时等问题造成的多次投递。

# NameSpace

rocketMQ使用NameSpace来wrapper producerGroup等，实现隔离

# 尚存疑问

produceGroup作用

MQClientInstance启动过程及作用
