---
title: java I/O
date: 2019-05-36
categories:
- java
tags:
- java
- 计算机网络
---

# Java的四种I/O模型

1.  Java传统IO模型（同步阻塞IO）
2.  NIO（同步非阻塞IO）
3.  通过NIO实现的Reactor模式（多路复用模型）
4.  通过AIO实现的Proactor模式（异步IO模型）

<!--more-->

## BIO

java的传统IO模型即是同步阻塞的，关于传统IO模型可以参考[网络编程]([https://shinerio.cc/2019/05/24/java/%E7%BD%91%E7%BB%9C%E7%BC%96%E7%A8%8B/](https://shinerio.cc/2019/05/24/java/网络编程/))中4.4节。服务器有专门的Acceptor线程用来处理客户端连接，对于每一个客户端请求都会创建一个新的线程来处理对应的业务，这是典型的一对一服务模型。java bio是面向流的，每次从(InputStream/OutputStream)中读取一个或多个字节，直到读取完所有字节，他们没有被缓存在任何地方。不能前后移动流中的数据，如果需要前后移动处理，则需要先将其缓存到一个缓冲区。调用read()和write()方法时，线程被阻塞，知道有数据被读取或数据完全写入，阻塞期间线程无法处理其他任何事情。

![java_bio](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/java/java_bio.png)

## NIO

Java提供NIO实现同步非阻塞IO，面向缓冲处理。数据会被读取到一个缓冲区，需要时可以在缓冲区中前后移动处理。读写不会阻塞房钱线程，在数据可读/写前当前线程可以继续做其他事情，所以一个单独的线程可以管理多个输入和输出通道。

Java NIO内部的IO是同步的，基于Selector实现的事件驱动机制，而selector不是异步的，他对IO的读写还是同步阻塞的，只是通过线程复用，将IO的准备时间分离出来。Select函数可以同时监听多个句柄，从而提高系统并发性。

NIO中三个比较重要的对象

- Buffer

  Buffer实质上是一个缓冲容易，发送给Channel的所有数据都必须先放到Buffer中；同理，从Channel中读取任何数据都必须读到Buffer中

- Channel

  Channel是对原IO中流的模拟，任何来源和目的数据都必须通过一个Channel对象。Channel是双向的，可读可写

- Selector是Java NIO中的一个组件，用与检查一个或多个NIO Channel的状态是否处于可读、可写。使用单线程管理多个channels，也就是可以管理多个网络链接。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/java/buffer_and_channel.png)

### FileCopy

```java
 public static void copyFile(String src, String det) throws IOException {
      FileInputStream fis = new FileInputStream(src);
      FileOutputStream fos = new FileOutputStream(det);
      FileChannel cin = fis.getChannel();
      FileChannel cout = fos.getChannel();
      ByteBuffer buffer = ByteBuffer.allocate(1024);
      while(cin.read(buffer)!=-1){
          buffer.flip();
          cout.write(buffer);
          buffer.clear();
      }
      cin.close();
      cout.close();
      fis.close();
      fos.close();
 }
```

### 基于NIO的网络编程

#### 基于SocketChannel实现客户端

```java
public class NonBlockingClient {
    public static void main(String[] args) {
        byte[] data = "message from client".getBytes();
        SocketChannel channel = null;
        try{
            //1. 打开 socket channel
            channel = SocketChannel.open();
            //使用非阻塞式,只有在非阻塞模式下，任何SocketChannel实例上的IO操作才是非阻塞的。
            channel.configureBlocking(false);
            // 2. 连接到服务器，通过轮询方式查看是否完成
            // connect() and finishConnect() 都是非阻塞操作
            //isConnectionPending() 方法来查询是否还在连接中。如果 isConnectionPending()
            // 返回了 false，那就代表已经建立连接了，但是我们还要调用 finishConnect() 来完成连接
            // 返回true，表示还在连接中，我们可以做点其它
            if(!channel.connect(new InetSocketAddress(InetAddress.getLocalHost(),14000))){
                System.out.print("wait");
                while(!channel.finishConnect()){
                    System.out.print(".");
                }
            }
            System.out.println();
            System.out.println("Connected to server...");
            ByteBuffer buffer = ByteBuffer.wrap(data);
            ByteBuffer readBuffer = ByteBuffer.allocate(1024);
            //SelectableChannel 为非阻塞模式，它的 I/O 操作读写的字节数可能比实际的要少，甚至没有。
            // 需要使用循环不断读写，保证读写完成。
            while (buffer.hasRemaining()) {
                channel.write(buffer);
            }
            int totalBytesReceived = 0;
            while (totalBytesReceived == 0) {
                totalBytesReceived += channel.read(readBuffer);
            }
            System.out.println("Server said: " + new String(readBuffer.array()));
        } catch (IOException e) {
            e.printStackTrace();
        }finally {
            // 4 .close socket channel
            try {
                if (channel != null) {
                    channel.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

```

### 基于Selector和ServerSocketChannel实现服务器

```java
public class NoneBlockingServer {
    public static void main(String[] args){
        //1. 打开一个选择器
        Selector selector = null;
        try {
            selector = Selector.open();
            //2. 监听服务器socket通道
            ServerSocketChannel ssc = ServerSocketChannel.open();
            //设置成非阻塞模型
            ssc.configureBlocking(false);
            //绑定服务器监听端口
            ssc.bind(new InetSocketAddress(14000));
            //3. 注册到选择器
            ssc.register(selector, SelectionKey.OP_ACCEPT);
            while (true) {
                //4. 选择准备好的通道来进行IO操作
                /**
                 * 返回自上一次select后有多少channel进入就绪
                 * int select()               阻塞的方法，可用wakeUp()唤醒
                 * int select(long timeout)   设置超时的阻塞
                 * int selectNow()            立即返回
                 */
                //没有就绪
                if (selector.selectNow() == 0) {
                    System.out.println("waiting....");
                    Thread.sleep(3000);
                }
                //5. 获取就绪的selected keys
                Set<SelectionKey> selectionKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectionKeys.iterator();
                //6. 处理selected keys感兴趣操作
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();

                    if (key.isAcceptable()) {
                        // a connection was accepted by a ServerSocketChannel.
                        ServerSocketChannel serverSocketChannel = (ServerSocketChannel) key.channel();
                        // get socket channel from server socket channel
                        SocketChannel clientChannel = serverSocketChannel.accept();
                        // must to be nonblocking before register with selector
                        clientChannel.configureBlocking(false);
                        // register socket channel to selector with OP_READ
                        clientChannel.register(key.selector(), SelectionKey.OP_READ);
                    }else if (key.isReadable()) {
                        // a channel is ready for reading
                        SocketChannel clientChannel = (SocketChannel) key.channel();
                        ByteBuffer buffer = ByteBuffer.allocate(1024);
                        if (clientChannel.read(buffer) != -1) {
                            String s = new String(buffer.array());
                            System.out.println("Client said:" + s);
                            key.interestOps(SelectionKey.OP_WRITE);
                            key.attach("Welcome!!!");
                        } else {
                            System.out.println("closed.......");
                            clientChannel.close();
                            key.cancel();
                        }
                    }else if (key.isValid() && key.isWritable()) {
                        SocketChannel clientChannel = (SocketChannel) key.channel();
                        // get content from attachment
                        String content = (String) key.attachment();
                        // write content to socket channel
                        clientChannel.write(ByteBuffer.wrap(content.getBytes()));
                        key.interestOps(SelectionKey.OP_READ);
                    }
                    iterator.remove();
                }
            }
        }catch  (IOException | InterruptedException e) {
            e.printStackTrace();
        }finally {
            // close selector
            try {
                selector.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}
```

> 同步非阻塞式的理解，作为client的read方法是非阻塞的，会立即返回，所以client中需要不断地read，保证数据的完全读取。同步的理解在于，客户端需要不断轮询，而不是在数据就绪后收到通知。其实上文就是一个最精简的Reactor模式实现，只不过所有的角色都被放到了Reactor中

## 多线程线程Reactor模型

上述代码使用一个线程同时监控多个请求（channel），但是所有读/写/新连接请求处理等都在同一个线程中处理，无法充分利用多CPU优势，同时读/写操作也会阻塞对新连接的处理。因此可以引入多线程，并行处理多个读/写操作。

![](<https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/java/multithread_reactor.png>)

```java
public class NoneBlockingMultiServer {
    public static void main(String[] args) {
        //1. 打开一个选择器
        Selector selector = null;
        try {
            selector = Selector.open();
            //2. 监听服务器socket通道
            ServerSocketChannel ssc = ServerSocketChannel.open();
            //设置成非阻塞模型
            ssc.configureBlocking(false);
            //绑定服务器监听端口
            ssc.bind(new InetSocketAddress(14000));
            //3. 注册到选择器
            ssc.register(selector, SelectionKey.OP_ACCEPT);
            while (true) {
                //4. 选择准备好的通道来进行IO操作
                if (selector.selectNow() == 0) {
                    System.out.println("waiting....");
                    Thread.sleep(3000);
                }
                //5. 获取就绪的selected keys
                Set<SelectionKey> selectionKeys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = selectionKeys.iterator();
                //6. 处理selected keys感兴趣操作
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    if (key.isAcceptable()) {
                        new AcceptProcessor().process(key);
                    } else if (key.isReadable()) {
                        // a channel is ready for reading
                        key.interestOps(SelectionKey.OP_WRITE);
                        new ReadProcessor().process(key);
                    } else if (key.isValid() && key.isWritable()) {
                        key.interestOps(SelectionKey.OP_READ);
                        new WriteProcessor().process(key);
                    }
                    iterator.remove();
                }
            }
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        } finally {
            // close selector
            try {
                selector.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

class ReadProcessor {
    private static final ExecutorService service = Executors.newFixedThreadPool(16);

    public void process(SelectionKey selectionKey) {
        service.submit(() -> {
            try {
                SocketChannel clientChannel = (SocketChannel) selectionKey.channel();
                ByteBuffer buffer = ByteBuffer.allocate(1024);
                if (clientChannel.read(buffer) != -1) {
                    String s = new String(buffer.array());
                    System.out.println("Client said:" + s);
                    selectionKey.attach("Welcome!!!");
                } else {
                    return;
                }
            }catch (IOException e){
                e.printStackTrace();
            }
        });
    }
}

class AcceptProcessor{
    private static final ExecutorService service = Executors.newFixedThreadPool(16);

    public void process(SelectionKey selectionKey) {
        service.submit(() -> {
            try {
                // a connection was accepted by a ServerSocketChannel.
                ServerSocketChannel serverSocketChannel = (ServerSocketChannel) selectionKey.channel();
                // get socket channel from server socket channel
                SocketChannel clientChannel = serverSocketChannel.accept();
                // must to be nonblocking before register with selector
                clientChannel.configureBlocking(false);
                // register socket channel to selector with OP_READ
                clientChannel.register(selectionKey.selector(), SelectionKey.OP_READ);
            } catch (IOException e) {
                e.printStackTrace();
            }
        });
    }
}

class WriteProcessor {
    private static final ExecutorService service = new ThreadPoolExecutor(
            4,
            16,30,
            TimeUnit.SECONDS,
            new LinkedBlockingQueue<Runnable>());

    public void process(SelectionKey selectionKey) {
        service.submit(() -> {
            try {
                SocketChannel clientChannel = (SocketChannel) selectionKey.channel();
                // get content from attachment
                String content = (String) selectionKey.attachment();
                // write content to socket channel
                clientChannel.write(ByteBuffer.wrap(content.getBytes()));
                System.out.println("closed.......");
                clientChannel.close();
            }catch (IOException e){
                e.printStackTrace();
            }
        });
    }
}
```

### 多Reactor

Netty中使用的Reactor模式，引入了多Reactor，即一个主Reactor负责监控所有的连接请求，多个子Reactor负责监控并处理读/写请求，减轻了主Reactor的压力，降低了主Reactor压力太大而造成的延迟。并且每个子Reator分别属于一个独立的线程，每个成功连接后的Channel的所有读写操作都由同一个线程处理。这样保证了同一请求的所有状态和上下文在同一线程中，避免了不必要的上下文切换，同时也方便了监控请求响应状态。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/java/multi_reactor.png)

```java
public class MultiReactor {
    public static void main(String[] args) throws IOException {
        Selector selector = Selector.open();
        ServerSocketChannel serverSocketChannel = ServerSocketChannel.open();
        serverSocketChannel.configureBlocking(false);
        serverSocketChannel.bind(new InetSocketAddress(14000));
        serverSocketChannel.register(selector, SelectionKey.OP_ACCEPT);
        //子Reactor个数是当前机器可用核数的两倍（与Netty默认的子Reactor个数一致）。
        // 对于每个成功连接的SocketChannel，通过round robin的方式交给不同的子Reactor。
        int coreNum = 2 * Runtime.getRuntime().availableProcessors();
        Processor[] processors = new Processor[coreNum];
        for (int i = 0; i < processors.length; i++) {
            processors[i] = new Processor();
        }

        int index = 0;
        while (selector.select() > 0) {
            Set<SelectionKey> keys = selector.selectedKeys();
            Iterator<SelectionKey> iterator = keys.iterator();
            //6. 处理selected keys感兴趣操作
            while (iterator.hasNext()) {
                SelectionKey key = iterator.next();
                keys.remove(key);
                if (key.isAcceptable()) {
                    ServerSocketChannel acceptServerSocketChannel = (ServerSocketChannel) key.channel();
                    SocketChannel socketChannel = acceptServerSocketChannel.accept();
                    socketChannel.configureBlocking(false);
                    Processor processor = processors[index++ % coreNum];
                    //SocketChannel通过在属于不同Processor的Selector注册事件，加入到相应的任务中
                    //实现了每个子Reactor包含一个Selector对象，并由一个独立的线程处理。
                    processor.addChannel(socketChannel);
                    processor.wakeup();
                }
            }
        }
    }
}

class Processor {
    private static final ExecutorService service =
            Executors.newFixedThreadPool(2 * Runtime.getRuntime().availableProcessors());

    private Selector selector;

    public Processor() throws IOException {
        this.selector = SelectorProvider.provider().openSelector();
        start();
    }

    public void addChannel(SocketChannel socketChannel) throws ClosedChannelException {
        socketChannel.register(this.selector, SelectionKey.OP_READ);
    }

    public void wakeup() {
        this.selector.wakeup();
    }

    public void start() {
        service.submit(() -> {
            while (true) {
                if (selector.select(500) <= 0) {
                    continue;
                }
                Set<SelectionKey> keys = selector.selectedKeys();
                Iterator<SelectionKey> iterator = keys.iterator();
                while (iterator.hasNext()) {
                    SelectionKey key = iterator.next();
                    iterator.remove();
                    if (key.isReadable()) {
                        ByteBuffer buffer = ByteBuffer.allocate(1024);
                        SocketChannel socketChannel = (SocketChannel) key.channel();
                        int count = socketChannel.read(buffer);
                        if (count < 0) {
                            System.out.println("closed.......");
                            socketChannel.close();
                            key.cancel();
                            continue;
                        } else if (count == 0) {
                            System.out.println("empty!");
                            continue;
                        } else {
                            System.out.println(new String(buffer.array()));
                            key.interestOps(SelectionKey.OP_WRITE);
                            key.attach("Welcome!!!");
                        }
                    }else if (key.isValid() && key.isWritable()) {
                        SocketChannel clientChannel = (SocketChannel) key.channel();
                        // get content from attachment
                        String content = (String) key.attachment();
                        // write content to socket channel
                        clientChannel.write(ByteBuffer.wrap(content.getBytes()));
                        key.interestOps(SelectionKey.OP_READ);
                    }
                }
            }
        });
    }
}
```

## 参考文献

[Java进阶（五）Java I/O模型从BIO到NIO和Reactor模式](<http://www.jasongj.com/java/nio_reactor/>)

[关于JAVA NIO是同步非阻塞I/O的解释](<https://blog.csdn.net/tomcyndi/article/details/79087578>)

[java Socket之NIO](<https://juejin.im/post/5ae33c026fb9a07a9c03f45b>)

[高性能IO之Reactor模式](https://www.cnblogs.com/doit8791/p/7461479.html)

[Java Nio（二） - 用NIO实现Reactor模式](<http://afghl.github.io/2016/12/17/java-nio-02-reactor-and-nio.html>)

[Java NIO Tutorial](<http://tutorials.jenkov.com/java-nio/index.html>)

