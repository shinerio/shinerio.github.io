---
title: rocket源码阅读(一)
date: 2019-06-25
categories:
- rocket
Tags:
- rocket
- 中间件
---

# NameServer架构设计

NameServer提供服务发现的功能，维护了broker的地址列表和Topic及Topic对应队列的地址列表，与每一个broker保持心跳连接，检查broker是否存活，broker消息服务器在启动时向所有NameServer注册。在producer和consumer需要发布或者消费消息时，向nameserver发出请求来获取连接。NameServer本身的高可用可以通过部署多台NameServer服务器来实现，但彼此之间互不通信，也就是NameServer服务器之间在某个时刻的数据并不会完全相同，但这对消息发送不会造成任何影响，RoketMQ NameServer设计追求简单高效。

<!--more-->

## NameServer启动

NameServer通过org.apache.rocketmq.namesrv.NamesrvStartup启动。

```java
public static void main(String[] args) {
     main0(args);
}    
public static NamesrvController main0(String[] args) {

        try {
            NamesrvController controller = createNamesrvController(args);
            start(controller);
            String tip = "The Name Server boot success. serializeType=" + RemotingCommand.getSerializeTypeConfigInThisServer();
            log.info(tip);
            System.out.printf("%s%n", tip);
            return controller;
        } catch (Throwable e) {
            e.printStackTrace();
            System.exit(-1);
        }

        return null;
    }
```

### 1. NameServer创建

主要是创建NameServerConfig和NettyServerConfig，生成NameServerController

```java
public static NamesrvController createNamesrvController(String[] args) throws IOException, JoranException {
        System.setProperty(RemotingCommand.REMOTING_VERSION_KEY, Integer.toString(MQVersion.CURRENT_VERSION));
        //PackageConflictDetect.detectFastjson();

        Options options = ServerUtil.buildCommandlineOptions(new Options());
        //解析option参数，包含-h参数，返回null，打印help信息，程序退出
  			commandLine = ServerUtil.parseCmdLine("mqnamesrv", args, buildCommandlineOptions(options), new PosixParser());
        if (null == commandLine) {
            System.exit(-1);
            return null;
        }

        final NamesrvConfig namesrvConfig = new NamesrvConfig();
        final NettyServerConfig nettyServerConfig = new NettyServerConfig();
        nettyServerConfig.setListenPort(9876);  //设置NameServer监听端口号为9876
        //-c configFile指定配置文件路径，初始化两个config对象
        if (commandLine.hasOption('c')) {
            String file = commandLine.getOptionValue('c');
            if (file != null) {
                InputStream in = new BufferedInputStream(new FileInputStream(file));
                properties = new Properties();
                properties.load(in);
              	//通过反射调用setter的方式注入属性
                MixAll.properties2Object(properties, namesrvConfig);
                MixAll.properties2Object(properties, nettyServerConfig);

                namesrvConfig.setConfigStorePath(file);

                System.out.printf("load config properties file OK, %s%n", file);
                in.close();
            }
        }
				//-p参数打印所有config信息，程序退出，启动前可以用这种方式检查配置属性
        if (commandLine.hasOption('p')) {
            InternalLogger console = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_CONSOLE_NAME);
            MixAll.printObjectProperties(console, namesrvConfig);
            MixAll.printObjectProperties(console, nettyServerConfig);
            System.exit(0);
        }
				//使用“--属性名 属性值”的方式设置配置，例如--listenPort 9876
        MixAll.properties2Object(ServerUtil.commandLine2Properties(commandLine), namesrvConfig);

        if (null == namesrvConfig.getRocketmqHome()) {
            System.out.printf("Please set the %s variable in your environment to match the location of the RocketMQ installation%n", MixAll.ROCKETMQ_HOME_ENV);
            System.exit(-2);
        }

        LoggerContext lc = (LoggerContext) LoggerFactory.getILoggerFactory();
        JoranConfigurator configurator = new JoranConfigurator();
        configurator.setContext(lc);
        lc.reset();
        configurator.doConfigure(namesrvConfig.getRocketmqHome() + "/conf/logback_namesrv.xml");

        log = InternalLoggerFactory.getLogger(LoggerName.NAMESRV_LOGGER_NAME);

        MixAll.printObjectProperties(log, namesrvConfig);
        MixAll.printObjectProperties(log, nettyServerConfig);

        final NamesrvController controller = new NamesrvController(namesrvConfig, nettyServerConfig);

        // remember all configs to prevent discard
        controller.getConfiguration().registerConfig(properties);

        return controller;
    }
```

#### 1.1 NameServerConfig属性

```java
//rocket主目录，可以通过  -Drocketmq.home.dir指定或者设置环境变量ROCKETMQ_HOME  
private String rocketmqHome = System.getProperty(MixAll.ROCKETMQ_HOME_PROPERTY, System.getenv(MixAll.ROCKETMQ_HOME_ENV));
//NameServer存储KV配置属性的持久化路径
private String kvConfigPath = System.getProperty("user.home") + File.separator + "namesrv" + File.separator + "kvConfig.json";
//默认配置文件路径
private String configStorePath = System.getProperty("user.home") + File.separator + "namesrv" + File.separator + "namesrv.properties";
private String productEnvName = "center";
private boolean clusterTest = false;
//是否支持顺序消息，默认不支持
private boolean orderMessageEnable = false;
```

#### 1.2 NettyServerConfig属性

```java
//NameServer监听端口号
private int listenPort = 8888;
//Netty业务线程池线程数量
private int serverWorkerThreads = 8;
//Netty public任务线程池数量，Netty网络设计，根据业务类型会创建不同的线程池，比如处理消息发送、消息消费、心跳检测等。如果该业务类型(RequestCode)未注册线程池，则由public线程池执行
private int serverCallbackExecutorThreads = 0;
//IO线程池线程个数，主要是NameServer、Broker端解析请求、返回相应的线程个数，这类线程主要是处理网络请求的，解析请求包，然后转发到各个业务线程池完成具体的业务操作，然后将结果在返回给调用方
private int serverSelectorThreads = 3;
//send oneway消息请求并发度(Broker端参数)
private int serverOnewaySemaphoreValue = 256;
//异步消息发送最大并发度(Broker端参数)
private int serverAsyncSemaphoreValue = 64;
//网络连接最大空闲时间，默认120s。如果连接空闲时间超过该参数设置的值，连接将被关闭。
private int serverChannelMaxIdleTimeSeconds = 120;
//网络socket发送缓存区大小，默认64k
private int serverSocketSndBufSize = NettySystemConfig.socketSndbufSize;
//王烈socket接收缓存区大小，默认64k
private int serverSocketRcvBufSize = NettySystemConfig.socketRcvbufSize;
//ByteBuffer是否开启缓存，建议开启
private boolean serverPooledByteBufAllocatorEnable = true;

    /**
     * make make install
     *
     *
     * ../glibc-2.10.1/configure \ --prefix=/usr \ --with-headers=/usr/include \
     * --host=x86_64-linux-gnu \ --build=x86_64-pc-linux-gnu \ --without-gd
     */
//启动Epoll IO模型，linux环境建议开启
private boolean useEpollNativeSelector = false;
```

#### 1.3 创建NamesrvController实例

通过启动属性创建NamesrvController实例，NamesrvController是NameServer的核心控制器

```java
public NamesrvController(NamesrvConfig namesrvConfig, NettyServerConfig nettyServerConfig) {
        this.namesrvConfig = namesrvConfig;
        this.nettyServerConfig = nettyServerConfig;
        this.kvConfigManager = new KVConfigManager(this);
        this.routeInfoManager = new RouteInfoManager();
        this.brokerHousekeepingService = new BrokerHousekeepingService(this);
        this.configuration = new Configuration(
            log,
            this.namesrvConfig, this.nettyServerConfig
        );
        this.configuration.setStorePathFromConfig(this.namesrvConfig, "configStorePath");
}
```

### 2. 启动NamesrvController

初始化NamesrvController并创建JVM Hook

```java
    public static NamesrvController start(final NamesrvController controller) throws Exception {

        if (null == controller) {
            throw new IllegalArgumentException("NamesrvController is null");
        }

        boolean initResult = controller.initialize();
        if (!initResult) {
            controller.shutdown();
            System.exit(-3);
        }
				//使用java.lang.Runtime.addShutdownHook()钩子程序，在java程序退出之前，安全地shutdown
        Runtime.getRuntime().addShutdownHook(new ShutdownHookThread(log, new Callable<Void>() {
            @Override
            public Void call() throws Exception {
                controller.shutdown();
                return null;
            }
        }));
				//启动NameServer服务器
        controller.start();

        return controller;
    }
```

```java
 public boolean initialize() {
  			//加载KV配置
        this.kvConfigManager.load();
   			//创建NettyServer网络处理对象
        this.remotingServer = new NettyRemotingServer(this.nettyServerConfig, this.brokerHousekeepingService);
        this.remotingExecutor =
            Executors.newFixedThreadPool(nettyServerConfig.getServerWorkerThreads(), new ThreadFactoryImpl("RemotingExecutorThread_"));
        this.registerProcessor();
   			//开启定时任务，每10秒扫描一次broker，移除不激活状态的broker
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                NamesrvController.this.routeInfoManager.scanNotActiveBroker();
            }
        }, 5, 10, TimeUnit.SECONDS);
				//定期定时任务，nameserver每隔10分钟打印一次kv配置1
        this.scheduledExecutorService.scheduleAtFixedRate(new Runnable() {

            @Override
            public void run() {
                NamesrvController.this.kvConfigManager.printAllPeriodically();
            }
        }, 1, 10, TimeUnit.MINUTES);
				//ssl不被禁止，开启线程监听ssl上下文
        if (TlsSystemConfig.tlsMode != TlsMode.DISABLED) {
            // Register a listener to reload SslContext
            try {
                fileWatchService = new FileWatchService(
                    new String[] {
                        TlsSystemConfig.tlsServerCertPath,
                        TlsSystemConfig.tlsServerKeyPath,
                        TlsSystemConfig.tlsServerTrustCertPath
                    },
                    new FileWatchService.Listener() {
                        boolean certChanged, keyChanged = false;
                        @Override
                        public void onChanged(String path) {
                            if (path.equals(TlsSystemConfig.tlsServerTrustCertPath)) {
                                log.info("The trust certificate changed, reload the ssl context");
                                reloadServerSslContext();
                            }
                            if (path.equals(TlsSystemConfig.tlsServerCertPath)) {
                                certChanged = true;
                            }
                            if (path.equals(TlsSystemConfig.tlsServerKeyPath)) {
                                keyChanged = true;
                            }
                            if (certChanged && keyChanged) {
                                log.info("The certificate and private key changed, reload the ssl context");
                                certChanged = keyChanged = false;
                                reloadServerSslContext();
                            }
                        }
                        private void reloadServerSslContext() {
                            ((NettyRemotingServer) remotingServer).loadSslContext();
                        }
                    });
            } catch (Exception e) {
                log.warn("FileWatchService created error, can't load the certificate dynamically");
            }
        }

        return true;
    }
```

#### 2.1 监听broker

NameServer中的routeInfoManager的会定时检测broker的心跳，如果broker与服务器的心跳连接延迟超过两分钟，broker就会被移除

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
//    private final static long BROKER_CHANNEL_EXPIRED_TIME = 1000 * 60 * 2;
```

