---
title: 计算机网络（九）—— 传输层
date: 2020-04-27
categories:
- 计算机网络
tags:
- 计算机网络
---
传输层架构在网络层之上，在两台计算机**进程**之间传输数据，常见的传输层协议包括TCP和UDP。
# 1. TCP

## 1.1. 首部格式

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200423212128.png)

## 1.2. TCP状态机

TCP是面向连接的，在其生命周期会有各种不同状态	

| 状态           | 描述                                              |
| ------------ | ----------------------------------------------- |
| LISTEN       | 等待来自远程TCP应用程序的请求                                |
| SYN_SENT     | 发送连接请求后等待来自远程端点的确认。TCP第一次握手后客户端所处的状态            |
| SYN-RECEIVED | 该端点已经接收到连接请求并发送确认。该端点正在等待最终确认。TCP第二次握手后服务端所处的状态 |
| ESTABLISHED  | 代表连接已经建立起来了。这是连接数据传输阶段的正常状态                     |
| FIN_WAIT_1   | 等待来自远程TCP的终止连接请求或终止请求的确认                        |
| FIN_WAIT_2   | 在此端点发送终止连接请求后，等待来自远程TCP的连接终止请求                  |
| CLOSE_WAIT   | 该端点已经收到来自远程端点的关闭请求，此TCP正在等待本地应用程序的连接终止请求        |
| CLOSING      | 等待来自远程TCP的连接终止请求确认                              |
| LAST_ACK     | 等待先前发送到远程TCP的连接终止请求的确认                          |
| TIME_WAIT    | 等待足够的时间来确保远程TCP接收到其连接终止请求的确认                    |

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200423203536.png)
### 1.2.1. 三次握手

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200423210040.png)

### 1.2.2. 四次挥手

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200423210106.png)
具体过程如下：
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229221623113.png)
- 客户端主动调用关闭连接的函数，于是就会发送FIN报文，这个FIN报文代表客户端不会再发送数据了，进入FIN_WAIT_1状态；
- 服务端收到了FIN报文，然后马上回复一个ACK确认报文，此时服务端进入 CLOSE_WAIT状态。在收到FIN报文的时候，TCP 协议栈会为FIN包插入一个文件结束符EOF到接收缓冲区中，服务端应用程序可以通过read调用来感知这个FIN包，这个EOF会被放在已排队等候的其他已接收的数据之后，所以必须要得继续read接收缓冲区已接收的数据；
- 接着，当服务端在read数据的时候，最后自然就会读到EOF，接着read() 就会返回 0，这时服务端应用程序如果有数据要发送的话，就发完数据后才调用关闭连接的函数，如果服务端应用程序没有数据要发送的话，可以直接调用关闭连接的函数，这时服务端就会发一个FIN包，这个FIN报文代表服务端不会再发送数据了，之后处于LAST_ACK状态；
- 客户端接收到服务端的FIN包，并发送ACK确认包给服务端，此时客户端将进入TIME_WAIT状态；
- 服务端收到ACK确认包后，就进入了最后的CLOSE状态；
- 客户端经过2MSL时间之后，也进入CLOSE状态；

![[tcp关键内核参数#1.1. tcp timewait]]

### 1.2.3. RST
其实关闭的连接的函数有两种函数：
- close函数，同时socket关闭发送方向和读取方向，也就是socket不再有发送和接收数据的能力；
- shutdown函数，可以指定socket只关闭发送方向而不关闭读取方向，也就是socket 不再有发送数据的能力，但是还是具有接收数据的能力；

close在某些场景下会导致RST：
1. 只要TCP栈的读缓冲里还有未读取（read）数据，则调用close时会直接向对端发送RST。比如客户端一次发送100个字节，但是服务器read设置最多读取90个，read一次后就不再read，所以还有10个在缓冲区，服务器执行close，服务器会发送RST。如果客户端第一次发送100个字节，服务器read最多读取100个，read一次把数据全部读出来了，然后客户端再发送100个字节，但是服务器没有read，执行close，执行的是四次挥手。
2. 如果客户端用close函数来关闭连接，那么在TCP四次挥手过程中，如果收到了服务端发送的数据，由于客户端已经不再具有发送和接收数据的能力，所以客户端的内核会回RST报文给服务端，然后内核会释放连接，这时就不会经历完成的 TCP 四次挥手，所以我们常说，调用close是粗暴的关闭。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229222110694.png)

当服务端收到RST后，内核就会释放连接，当服务端应用程序再次发起读操作或者写操作时，就能感知到连接已经被释放了
- 如果是读操作，则会返回RST的报错，也就是我们常见的[[http连接池#2.1.2. Connection reset by peer|Connection reset by peer]]。
- 如果是写操作，那么程序会产生SIGPIPE信号，应用层代码可以捕获并处理信号，如果不处理，则默认情况下进程会终止，异常退出。
相对的，shutdown函数因为可以指定只关闭发送方向而不关闭读取方向，所以即使在 TCP 四次挥手过程中，如果收到了服务端发送的数据，客户端也是可以正常读取到该数据的，然后就会经历完整的 TCP 四次挥手，所以我们常说，调用 shutdown 是优雅的关闭。
- 当调用 `shutdown(sockfd, SHUT_RD)` 时，关闭套接字的读方向，这意味着该套接字不能再接收数据，即使接收缓冲区中还有数据也会被丢弃。对端如果继续发送数据，接收方会回复 RST 包，强制关闭连接。
- 当调用 `shutdown(sockfd, SHUT_WR)` 时，关闭套接字的写方向，这会导致发送缓冲区中的数据被立即发送出去（如果有数据的话），然后发送一个 FIN 包给对端，通知对端本方不再发送数据，但仍可以接收对端的数据。这就是所谓的 “半关闭” 状态，常用于在完成数据发送后，等待对方发送完剩余数据再完全关闭连接的场景。
	- 当调用 `shutdown(sockfd, SHUT_RDWR)` 时，相当于同时关闭读写方向，功能类似 `close` 函数，但 `shutdown` 不会立即释放套接字资源，直到所有数据传输完毕和连接完全关闭。

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229222354006.png)

#### 1.2.3.1. 四次挥手优化为三次
当被动关闭方（下图的服务端）在 TCP 挥手过程中，「没有数据要发送」并且「开启了 TCP 延迟确认机制」，那么第二和第三次挥手就会合并传输，这样就出现了三次挥手。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229220836128.png)
因为TCP延迟确认机制是默认开启的，所以导致我们抓包时，看见三次挥手的次数比四次挥手还多
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229220936995.png)

![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229220909787.png)
## 1.3. TCP延迟确认机制
当发送没有携带数据的ACK，它的网络效率也是很低的，因为它也有40个字节的IP头和TCP头，但却没有携带数据报文。为了解决ACK传输效率低问题，所以就衍生出了TCP延迟确认。

TCP 延迟确认的策略：
- 当有响应数据要发送时，ACK会随着响应数据一起立刻发送给对方
- 当没有响应数据要发送时，ACK将会延迟一段时间，以等待是否有响应数据可以一起发送
- 如果在延迟等待发送ACK期间，对方的第二个数据报文又到达了，这时就会立刻发送 ACK
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229221203486.png)


# 2. UDP

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200423225822.png)

# 3. TCP与UDP的区别

|          | TCP                                            | UDP                                   |
| -------- | ---------------------------------------------- | ------------------------------------- |
| 是否连接 | 面向无连接                                     | 面向连接                              |
| 是否可靠 | 不可靠传输，尽力交付                           | 可靠传输，有流量控制和拥塞控制        |
| 通信方式 | 支持单播、多播                                 | 只能点对点通信                        |
| 传输方式 | 面向报文                                       | 面向字节流                            |
| 首部开销 | 8字节                                          | 最小20字节，最大60字节                |
| 使用场景 | 适用IP电话、视频会议、直播、即时通讯等实时应用 | 适用要求可靠传输的应用，如http，ftp等 |

# 4. 引用
1. [TCP状态机](https://www.jianshu.com/p/3c7a0771b67e)
2. [TCP报文段首部格式详解](https://blog.csdn.net/wilsonpeng3/article/details/12869233)
3. [TCP四次挥手变为三次](https://www.51cto.com/article/717235.html)