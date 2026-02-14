1nginx默认的启动方式是多进程的方式，nginx在启动后，在unix系统中会以daemon的方式在后台运行，后台进程包含一个master进程和多个worker进程。worker的数量可以通过`nginx.config`配置文件中的`worker_processes`配置项控制，一般建议设置与机器cpu核数相当。
```shell
[root@vultr ~]# ps -ef|grep nginx
root      1227     1  0 Oct15 ?        00:00:00 nginx: master process /usr/sbin/nginx -c /etc/nginx/nginx.conf
root     21207  1227  0 Oct23 ?        00:00:03 nginx: worker process
```
Nginx采用了事件驱动的模型，期望worker进程可以从头到尾占满一颗CPU，这样可以更加高效的利用整颗CPU，提高CPU的缓存命中率，另外还可以将worker进程与某一个CPU核绑定在一起。
> [!question]  Nginx 为什么采用多进程而不是多线程的进程结构呢?
> 因为 Nginx 要保证高可用性，多线程之间会共享地址空间，当某一个第三方模块引发了一个段错误时，就会导致整个Nginx进程挂掉。而采用多进程模型不会出现这个问题
# 1. nginx的四种进程
- **Master 进程**。Master 进程是父进程，其他进程都是子进程，Master进程对worker进程进行管理
- **worker 进程**。worker 进程有多个，是负责处理具体的请求的。
- **cache manager**和**cache loader进程**。缓存除了要被多个 worker 进程使用，也要被 cache进程使用，cache loader做缓存的载入，cache manager做缓存的管理，实际上每一个请求所使用的缓存还是由worker进程来进行的。这些进程间的通信都是通过共享内存来进行的
## 1.1. Master进程
master进程是父进程，主要用来管理worker进程，包含：
- 接收来自外界的信号
- 向各worker进程发送信号
- 管理worker进程。主进程负责启动指定数量的工作进程，每个工作进程都是一个独立的实例，用于处理客户端请求。当需要关闭Nginx时，主进程也负责通知工作进程优雅地退出。Master进程还负责监控worker进程的运行状态，如果有worker进程退出或者异常，会自动fork一个新的worker进程出来。
## 1.2. worker进程
基本的网络事件，则是放在worker进程中来处理了。多个worker进程之间是对等的，他们同等竞争来自客户端的请求，各进程互相之间是独立的。一个请求，只可能在一个worker进程中处理，一个worker进程，不可能处理其它进程的请求。

当我们提供80端口的http服务时，一个连接请求过来，每个进程都有可能处理这个连接，怎么做到的呢？首先，每个worker进程都是从master进程fork过来，在master进程里面，先建立好需要listen的socket（listenfd）之后，然后再fork出多个worker进程。所有worker进程的listenfd会在新连接到来时变得可读，为保证只有一个进程处理该连接，所有worker进程在注册listenfd读事件前抢**accept_mutex**，抢到互斥锁的那个进程注册listenfd读事件，在读事件里调用accept接受该连接。当一个worker进程在accept这个连接之后，就开始读取请求，解析请求，处理请求，产生数据后，再返回给客户端，最后才断开连接，这样一个完整的请求就是这样的了。我们可以看到，一个请求，完全由worker进程来处理，而且只在一个worker进程中处理。

# 2. nginx处理事件
nginx采用多worker的方式来处理请求，每个worker里面只有一个主线程，那能够处理的并发数很有限啊，多少个worker就能处理多少个并发，何来高并发呢？非也，这就是nginx的高明之处，nginx采用了**异步非阻塞**的方式来处理请求，也就是说，nginx是可以同时处理成千上万个请求的，每个worker的线程可以把一个cpu的性能发挥到极致。所以worker数和服务器的cpu数相等是最为适宜的。设少了会浪费 cpu，设多了会造成 cpu 频繁切换上下文带来的损耗。想想apache的常用工作方式（apache也有异步非阻塞版本，但因其与自带某些模块冲突，所以不常用），每个请求会独占一个工作线程，当并发数上到几千时，就同时有几千的线程在处理请求了。这对操作系统来说，是个不小的挑战，线程带来的内存占用非常大，线程的上下文切换带来的cpu开销很大，自然性能就上不去了，而这些开销完全是没有意义的。