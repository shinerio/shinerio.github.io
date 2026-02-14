# 1. 起源

`TCP`连接有长连接和短连接之分。短连接环境下，数据交互完毕后，主动释放连接。长连接环境下，双方建立交互的连接并不是一直存在数据交互，有些连接会在数据交互完毕后，主动释放连接，而有些不会，那么在长时间无数据交互的时间段内，交互双方都有可能出现：
1. 主机突然掉电、死机、异常重启
2. 中间路由网络无故断开
3. 中间防火墙设备会话超时丢弃会话
4. 网络隔离
> 使用kill -9强制杀死进程后，并不会出现连接不释放的问题。TCP连接还是可以正常释放的，因为内核OS代替发送了FIN报文。

当这些意外发生之后，这些`TCP`连接并未来得及正常释放，那么，连接的另一方并不知道对端的情况，它会一直维护这个连接，长时间的积累会导致非常多的半打开连接，造成端系统资源的消耗和浪费，为了解决这个问题，在传输层可以利用`TCP`的保活报文来实现，这就有了TCP的Keepalive（保活探测）机制。目前包括`Windows/Macos/Linux`在内的大多数主流OS都已经实现了TCP的Keepalive功能。

# 2. 默认参数
- tcp keepalive time，在TCP保活打开的情况下，最后一次数据交换到TCP发送第一个keepalive报文的间隔，默认7200秒
- tcp keepalive interval，如keepalive报文没有应答，则在keepalive间隔后再次发送keepalive报文，默认75秒
- tcp keepalive count，在没有接受到对方确认，继续发送保活探测保次数，默认9次
idle连接需要经过最长`keepalive_time + keepalive_interval*keepalive_count = 7200 + 75 * 9 = 7875` 才能断开idle连接。
# 3. 配置方式
```shell
# On Linux, this is done by editing the /etc/sysctl.conf file:
# detect dead connections after 70 seconds`
net.ipv4.tcp_keepalive_time = 60
net.ipv4.tcp_keepalive_intvl = 5
net.ipv4.tcp_keepalive_probes = 3

sysctl -p
```
