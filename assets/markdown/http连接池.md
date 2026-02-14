# 1. 长连接
长连接利用keep-alive技术实现，能在多次 HTTP 之间重用同一个 TCP 连接，从而**减少创建/关闭多个 TCP 连接的开销（包括响应时间、CPU 资源、减少拥堵等）**。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241218234752650.png)

然而长连接并非没有弊端，天下没有免费的午餐，如果客户端在接收完所有的信息之后还没有关闭连接，则服务端相应的资源还在被占用（尽管已经没用了）。例如Tomcat的BIO实现中，未关闭的连接会占用对应的处理线程，如果一个长连接实际上已经处理完毕，但关闭的超时时间未到，则该线程会一直被占用（使用NIO的实现没有该问题）。显然，**如果客户端和服务端的确需要进行多次通信，则开启 keep-alive 是更好的选择**，例如在微服务架构中，通常微服务的使用方和提供方会长期有交流。在一些 TPS/QPS 很高的 REST 服务中，如果使用的是短连接（即没有开启keep-alive），则很可能发生客户端端口被占满的情形。这是由于短时间内会创建大量TCP 连接，而在 TCP 四次挥手结束后，客户端的端口会处于TIME_WAIT一段时间(2MSL，linux系统中大概`60*2=120`秒)，这期间端口不会被释放，从而导致端口被占满。这种情况下最好使用长连接。
## 1.1. 开启方法
- 在 HTTP1.0中，若要使用长连接，需要在请求头中明确添加 “Connection: keep-alive”。只有当客户端和服务器都设置了该字段时，才会建立长连接。客户端发出带有 “Connection: keep-alive” 头的请求；服务端接收到这个请求后，根据 HTTP 1.0 和该头信息判断出这是一个长连接，会在响应头中也增加 “Connection: keep-alive”，并且不会关闭已建立的 TCP 连接；客户端收到服务端的响应后，发现其中包含 “Connection: keep-alive”，就认为是一个长连接，不关闭这个连接。
- HTTP 1.1 默认支持长连接，无需额外设置 “Connection: keep-alive”。
## 1.2. LB长连接
LB的前后端连接是独立的，长连接的维护也是独立的，会有前后端两个独立的连接池。即使客户端与LB在一个长连接会话中发起多次请求，这些请求也会被负载均衡到多个LB与后端server的连接中完成。
## 1.3. http1.0长连接测试
server端代码
```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import time


class LongConnectionHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Connection', 'keep-alive')  # 设置响应头，表明支持长连接
        self.end_headers()
        self.wfile.write(b"<html><body><h1>Hello, World!</h1></body></html>")


if __name__ == "__main__":
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, LongConnectionHandler)
    print('Starting server, use <Ctrl-C> to stop')
    httpd.serve_forever()
```
client端代码(这里裸写的socket编程，真正的HTTP client需要看响应头中是否携带keep-alive来决定要不要保持长连接，使用如下代码后是否保持长连接就只取决于服务端行为了)
```python
import socket
import time

def http_1_0_client():
    host = "localhost"
    port = 8000
    buffer_size = 10240

    # 创建套接字并连接到服务器
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # 构造HTTP 1.0请求消息，设置长连接头部
    request = "GET / HTTP/1.0\r\n"
    request += "Host: localhost\r\n"
    request += "Connection: Keep-Alive\r\n\r\n"

    # 发送第一次请求
    client_socket.send(request.encode())
    # 等待服务端响应
    time.sleep(1)
    response = client_socket.recv(buffer_size).decode()
    print("第一次响应:")
    print(response)

    time.sleep(10)

    # 构造并发送第二次请求（可以多次重复类似操作体现长连接持续交互）
    second_request = "GET / HTTP/1.0\r\n"
    second_request += "Host: localhost\r\n"
    second_request += "Connection: Keep-Alive\r\n\r\n"
    client_socket.send(second_request.encode())
    # 等待服务端响应
    time.sleep(1)
    second_response = client_socket.recv(buffer_size).decode()
    print("第二次响应:")
    print(second_response)
    client_socket.close()


if __name__ == "__main__":
    http_1_0_client()
```
可以看到在此期间连接一直处于established状态，客户端的两次请求复用了同一个tcp连接。
```shell
➜  ~ netstat -anv|grep 8000
tcp4       0      0  127.0.0.1.8000         127.0.0.1.64622        ESTABLISHED 408241 146988  48143      0 0x0002 0x00000004
tcp4      48      0  127.0.0.1.64622        127.0.0.1.8000         ESTABLISHED 408160 146988  48145      0 0x0002 0x00000000
tcp4       0      0  *.8000                 *.*                    LISTEN      131072 131072  48143      0 0x0000 0x00000006
```
## 1.4. http1.1长连接测试
http1.1下不需要携带keep-alive头，默认使用长连接。Client或者Server都可以通过设置请求头或响应头`"Connection": "close"`方式强制关闭。

server端代码
```python
from http.server import HTTPServer, BaseHTTPRequestHandler
import time


class LongConnectionHandler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b"<html><body><h1>Hello, World!</h1></body></html>")


if __name__ == "__main__":
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, LongConnectionHandler)
    print('Starting server, use <Ctrl-C> to stop')
    httpd.serve_forever()
```
client端代码
```python
import socket
import time

def http_1_0_client():
    host = "localhost"
    port = 8000
    buffer_size = 10240

    # 创建套接字并连接到服务器
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((host, port))

    # 构造HTTP 1.1请求消息，默认长连接
    request = "GET / HTTP/1.1\r\n"
    request += "Host: localhost\r\n\r\n"

    # 发送第一次请求
    client_socket.send(request.encode())
    # 等待服务端响应
    time.sleep(1)
    response = client_socket.recv(buffer_size).decode()
    print("第一次响应:")
    print(response)

    time.sleep(10)

    # 构造并发送第二次请求（可以多次重复类似操作体现长连接持续交互）
    second_request = "GET / HTTP/1.1\r\n"
    second_request += "Host: localhost\r\n\r\n"
    client_socket.send(second_request.encode())
    # 等待服务端响应
    time.sleep(1)
    second_response = client_socket.recv(buffer_size).decode()
    print("第二次响应:")
    print(second_response)
    client_socket.close()


if __name__ == "__main__":
    http_1_0_client()
```

## 1.5. 长链接超时设置
- 客户端和服务端都可以独立声明连接的生命周期
- 客户端超时时间建议设置比服务端短
- 客户端到服务端中间有可能会有7层LB，此时LB前后端的连接是独立的。==建议客户端超时时间<lb超时时间<后端server超时时间==
# 2. http常见问题
### 2.1.1. reactor.netty.http.client.PrematureCloseException: Connection prematurely closed BEFORE response

客户端发起请求的过程中server端正好超时fin了。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/obsidian/IMG_2680.JPG)

### 2.1.2. Connection reset by peer
1. **写异常** 如果一端的Socket被关闭（或主动关闭，或因为异常退出而引起的关闭），另一端仍发送数据，发送的第一个数据包引发该异常(Connect reset by peer)。Socket默认连接60秒，60秒之内没有进行心跳交互，即读写数据，就会自动关闭连接。
2. **读异常** 一端退出但退出时并未关闭该连接，另一端如果在从连接中读数据则抛出该异常。

可以通过python pdb的方式调试server端代码，在`self.wfile.write(b"<html><body><h1>Hello, World!</h1></body></html>")`处断点，然后执行client代码，等待server执行的断点处时，强制kill client端，此时继续执行server端代码输出响应体，server端就会报错`ConnectionResetError: [Errno 54] Connection reset by peer`
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241219224340496.png)

### 2.1.3. Broken pipe
Broken pipe实际上是一个不应该出现的错误，甚至可以理解为是一个bug，表明了你在往一个已经关闭的socket中写数据。当对端因为种种原因需要强制关闭连接的时候会发送RST，这时候应用捕获会报错Connection reset by peer，而当你不顾这个错误，继续写的时候，就会报错Broken pipe。

### 2.1.4. Connection refused
1. **服务未启动**：比如你尝试访问一个Web服务器，但Web服务器软件没有运行起来，那么在它对应的端口（如80端口用于HTTP服务）就没有服务在监听，此时客户端就会收到“Connection refused”的反馈。
2. **防火墙阻止**：防火墙规则可能会阻止客户端对特定端口的访问。即使服务器在正常运行并且监听了相应端口，但防火墙设置可能会导致连接请求被拒绝，客户端同样会收到“Connection refused”的消息。
在不启动server的情况下，直接启动client发送请求，可以发现tcp第一次握手后，直接被server发送RST拒绝了，此时客户端会报错`ConnectionRefusedError: [Errno 61] Connection refused`。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241219224619720.png)

### 2.1.5. 502 Bad Gateway
不建议多个LB挂相同的后端节点，对于客户端来说，看到的是不同的目的IP，此时可能源端口会复用。第二个请求发送的syn包对服务端来说是不可接受的，因此server端发送rst将连接中断，从而导致两个请求都失败（也有请求是，发送syn后立马收到了server对于第一个连接的ack或者psh报文，这时候client也会认为异常，从而发送rst到服务端）。这种情况下，LB都无法与后端服务建立正常连接，因此会报错返回502。

LB节点超时时间比后端Server超时时间要长，有概率导致LB使用了已经被后端关闭的连接，此时也会建链失败，从而报错502。

# 3. 连接池
HttpClient中使用了连接池来管理持有连接，同一条 TCP 链路上，连接是可以复用的。HttpClient 通过连接池的方式进行连接持久化。其实“池”技术是一种通用的设计，其设计思想并不复杂：
1. 当有连接第一次使用的时候建立连接
2. 结束时对应连接不关闭，归还到池中
3. 下次同个目的的连接可从池中获取一个可用连接
4. 定期清理过期连接


# 4. reference
https://blog.csdn.net/rickiyeat/article/details/107900585?sharetype=blogdetail&shareId=107900585&sharerefer=APP&sharesource=jstxzhangrui&sharefrom=link

![[HTTP协议解析]]