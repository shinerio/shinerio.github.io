现在OpenVSwitch主要由三个部分组成：
- **ovsdb-server**：OpenFlow本身被设计成网络数据包的一种处理流程，它没有考虑软件交换机的配置，例如配置QoS，关联SDN控制器等。ovsdb-server是OpenVSwitch对于OpenFlow实现的补充，它作为OpenVSwitch的configuration database，保存OpenVSwitch的持久化数据。
- **ovs-vswitchd**：运行在用户空间的转发程序，接收SDN控制器下发的OpenFlow规则。并且通知OVS内核模块该如何处理网络数据包。
- **ovs内核模块**：运行在内核空间的转发程序，根据ovs-vswitchd的指示，处理网络数据包

OpenVSwitch中有快路径（fast path）和慢路径（slow path），其中ovs-vswitchd代表了slow path，ovs内核模块代表了fast path。现在OpenFlow存储在slow path中，但是为了快速转发，网络包应该尽可能的在fast path中转发。因此，OpenVSwitch按照下面的逻辑完成转发。

1. 当一个网络连接的第一个网络数据包（首包）被发出时，OVS内核模块会先收到这个packet。但是内核模块现在还不知道如何处理这个包，因为所有的OpenFlow都存在ovs-vswitchd，因此它的默认行为是将这个包upcall到ovs-vswitchd。
2. ovs-vswitchd通过OpenFlow pipeline，处理完网络数据包送回给ovs内核模块，同时，ovs-vswitchd还会生成一串类似于OpenFlow Action，但是更简单的datapath action。这串datapath action会一起送到OVS内核模块。因为同一个网络连接的所有网络数据包特征（IP，MAC，端口号）都一样，当OVS内核模块收到其他网络包的时候，可以直接应用datapath action。因此，这里将OVS内核模块与OpenFlow协议解耦了，OpenFlow的小改动影响不到内核模块。