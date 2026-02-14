---
title: 应用层DNS协议
date: 2020-04-29
categories:
- network
tags:
- network
---
`DNS`（Domain Name System）域名解析服务采用`C/S`架构，是一个应用层协议。`DNS`的作用是将人类可读的域名（如：www.shinerio.cc） 转换为机器可读的 IP 地址（如：1111.111.111.111）。当前，对于每一级域名长度的限制是63个字符，域名总长度则不能超过253个字符。`DNS`协议建立在`UDP`或`TCP`协议之上，默认使用53号端口。客户端默认通过UDP协议进行通信，但是由于广域网中不适合传输过大的`UDP`数据包，因此规定当报文长度超过了512字节时，应转换为使用`TCP`协议进行数据传输。此时可能会出现如下的两种情况：
-   客户端认为`UDP`响应包长度可能超过512字节，主动使用`TCP`协议
-   客户端使用UDP协议发送DNS请求，服务端发现响应报文超过了 512 字节，在截断的`UDP`响应报文中将`TC`设置为1，以通知客户端该报文已经被截断，客户端收到之后再发起一次`TCP`请求（该特性通常也被安全厂商作为一种有效防御`DNS Query Flood`攻击的手段）

<!--more-->
  
# 1. 基本概念
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424141937.png)

## 1.1. 域名结构
常见的域名格式有：
- www.google.com
- mail.google.com 
- scholar.google.com  

【顶级域名】： .com
【二级域名】： google
【三级域名】：www/mail/scholar
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424142522.png)

## 1.2. DNS记录类型
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424152649.png)

### 1.2.1. A记录
A记录是用来指定主机名（或域名）对应的IP地址记录。如设置二级域名`shinerio.cc`对应`ip`地址为`185.199.111.153`（gitpage服务器地址）等。当然，也可以为三级域名`mail.shinerio.cc`绑定对应`ip`地址。一个域名可以对应多条`A`记录，即对应多个ip地址，实现`DNS`负载均衡。

主机记录`www`解析后域名为`www.shinerio.cc`。`@`直接解析主域名`shinerio.cc`，相当于`www.shinerio.cc`。`*`匹配所有域名`*.shinerio.cc`，将所有`shinerio.cc`下的子域名指向同一服务器地址。`mail`将域名解析为`mail.shinerio.cc`，通常用于解析邮箱服务器。主机记录`xxx`解析后域名为`xxx.shinerio.cc`，用于解析`xxx`类型服务。

### 1.2.2. AAAA记录
AAAA记录和A记录的区别在于，AAAA记录将域名解析到一个`ipv6`地址。

### 1.2.3. NS记录
`NS记录`指定解析域名或子域名的DNS服务器。

### 1.2.4. MX记录
MX记录（邮件交换）用来指定接收信息的邮件服务器。建立邮箱时，一般会根据邮箱服务商提供的MX记录填写此记录。

### 1.2.5. CNAME
`CNAME`记录将多个名字映射到另外一个域名。如将shinerio.cc记录别名为`shinerio.github.io`，这样用`shinerio.cc`替代`shinerio.github.io`访问gitpage提供的个人博客主页。

使用`CNAME`记录可以很方便地变更IP地址。如果一台服务器有100个网站，每个网站有一个域名。如果使用A记录，那么服务器ip更改时，则需要修改100条A记录。如果使用CNAME指向同一域名，那么该台服务器变更IP时，只需要变更别名的A记录就可以。

# 2. 域名解析
## 2.1. 域名服务器层次
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424144017.png)

### 2.1.1. 根域名服务器
最高层次的域名服务器，也是最重要的域名服务器。全球有13个根域名服务器名称，并不是一个名字对应一台物理服务器的地址，一个根服务器的名字可以作为入口对应一组服务器集群来提供域名解析服务。
- a.root-servers.net.
- b.root-servers.net.
- c.root-servers.net.
- d.root-servers.net.
- e.root-servers.net.
- f.root-servers.net.
- g.root-servers.net.
- h.root-servers.net.
- i.root-servers.net.
- j.root-servers.net.
- k.root-servers.net.
- l.root-servers.net.
- m.root-servers.net.

### 2.1.2. 顶级域名服务器
主要负责管理在该顶级域名服务器注册的下一级域名(二级域名)。所有顶级域名服务器的名称和IP地址是在根服务器注册的，也就是说，根域名服务器知道所有的顶级域名服务器的名称和IP地址。

### 2.1.3. 权威域名服务器
负责一个区的域名服务器，顶级域名服务器也可以算作是权威域名服务器，只不过由于其特殊性，我们专门把它划分为一类。因此权威域名服务器通常是指顶级域名以下的管理二级、三级、四级等域名的服务器。

### 2.1.4. 本地域名服务器
当一个主机(个人电脑)发出DNS请求时，查询请求就被发送到本地域名服务器，本地域名服务器负责回答这个查询，或者代替主机向域名空间中不同层次的权威域名服务器查询，再把查询的结果返回给主机。

## 2.2. 解析过程
DNS解析过程其实可以看做一个多岔树递归查询算法，从根节点出发，递归找下属域名服务器，直到解析成功。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424150647.png)

在浏览器中输入`www.shinerio.cc`域名，操作系统会先检查自己本地的`hosts`文件是否存在域名映射关系。如果存在映射关系，则根据映射完成域名解析；如果没有映射，则查找本地DNS缓存，是否存在域名映射关系，如果有，则直接返回，完成域名解析。

如果`hosts`与本地DNS缓存都没有相应的域名映射关系，首先会找网络配置参数中设置的首选DNS服务器（记为A-DNS服务器），此服务器收到查询时，如果要查询的域名包含在本地配置区域资源中，则返回解析结果给客户机，完成域名解析，此解析具有权威性。如果要查询的域名，不由A-DNS服务器区域解析，但该服务器已缓存了此网址映射关系，则调用这个IP地址映射，完成域名解析，此解析不具有权威性。

如果A-DNS服务器本地区域文件与缓存解析都失效，则根据A-DNS服务器的设置（是否设置转发器）进行查询。

- 如果未用转发模式，本地DNS就把请求发至根DNS服务器（记为B-DNS服务器），B-DNS服务器收到请求后会判断这个域名(.com)是谁来授权管理，并会返回一个负责该顶级域名服务器的一个IP。A-DNS服务器收到IP信息后，将会联系负责.com域的这台服务器（记为C-DNS服务器）。C-DNS服务器收到请求后，如果自己无法解析，它就会找一个管理.com域的下一级DNS服务器地址（记为D-DNS服务器）给A-DNS服务器。当A-DNS服务器收到这个地址后，就会找D-DNS服务器，重复上面的动作，进行查询，直至找到`www.shinerio.cc`主机。
- 如果用的是转发模式，A-DNS服务器就会把请求转发至上一级DNS服务器（记为E-DNS服务器），由E-DNS服务器进行解析；如果E-DNS服务器如果不能解析，那么会继续找根DNS或把转请求转至上上级，以此循环。

# 3. 协议报文格式
`DNS`采用`UDP`或`TCP`传输，主要是查看`DNS`报文首部中的标志字段。当客户端发出`DNS`查询请求，从服务器收到的响应报文中的`TC`（截断标志）比特被置为1时，表示应答总长度超过512字节，只返回前512个字节，这时DNS就需要使用TCP重发原来的查询请求。因为在`UDP`的应用程序中，其应用程序被限制在512个字节或更小，因此`DNS`报文穿数据流只能有512字节，而`TCP`能将用户的数据流分为一些报文段，因此`TCP`就能用多个报文段去传超过512字节的数据流或是任意长度的数据流。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424155506.png)
## 3.1. 头部
### 3.1.1. 会话标识（字节）
会话标识是DNS报文的ID标识，对于请求报文和其对应的应答报文，这个字段是相同的，通过它可以区分DNS应答报文是哪个请求的响应。
### 3.1.2. 标志（2字节）
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424155715.png)

| 字段           | 描述                                             |
| ------------ | ---------------------------------------------- |
| QR（bit）      | 查询/响应标志，0为查询，1为响应                              |
| opcode（4bit） | 0表示标准查询，1表示反向查询，2表示服务器状态请求                     |
| AA（1bit）     | 表示授权回答                                         |
| TC（1bit）     | 表示可截断的                                         |
| RD（1bit）     | 表示期望递归                                         |
| RA（1bit）     | 表示可用递归                                         |
| rcode（4bit）  | 表示返回码，0表示没有差错，3表示名字差错，2表示服务器错误（Server Failure） |

### 3.1.3. Questions（2字节）
问题计数，DNS查询请求的数目

### 3.1.4. Answers（2字节）
回答资源计数，DNS响应的数目

### 3.1.5. Authority RRs（2字节）
权威名称服务器计数，权威名称服务器的数目。

### 3.1.6. Additional RRs（2字节）
额外的记录数目（权威名称服务器对应`IP`地址的数目）

## 3.2. 正文 
### 3.2.1. Queries
`Queries`部分是用来显示DNS下查询请求的问题，通常只有一个问题。该部分包含正在进行的查询信息，包含查询名（被查询主机名字）、查询类型、查询类。
#### 3.2.1.1. 查询名
一般为要查询的域名，有时也会是 IP 地址，用于反向查询，一般的格式如下图所示。
<div align="center">
<img src="https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163058.png" width="100%"><br>
<sup><strong>Fig 1:</strong>NAME格式</sup>
</div>
#### 查询类类型
DNS 查询请求的资源类型。通常查询类型为 A 类型，表示由域名获取对应的 IP 地址。

<div align="center">
<sup><strong>Tab 1:</strong>查询类型</sup>
</div>

| 类型 | 助记符 | 说明 |
| ------ | ------ | ------ |
| 1 | A | 由域名获得IPv4地址 |
| 2 | NS | 查询域名服务器 |
| 5 | CNAME | 查询规范名称 |
| 6 | SOA | 开始授权 |
| 11 | WKS | 熟知服务 |
| 12 | PTR | 把IP地址转换成域名 |
| 13 | HINFO | 主机信息 |
| 15 | MX | 邮件交换 |
| 28 | AAAA | 由域名获得IPv6地址 |
| 252 | AXFR | 传送整个区的请求 |
| 255 | ANY | 对所有记录的请求 |

#### 3.2.1.2. 查询类
通常为`0x0001`，表明是互联网地址。

### 3.2.2. Answers,Authoritative namesversers,Additional recoreds
这三个部分格式一样，如下图所示。
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424160818.png)
- <font color=red>Name</font>。它的格式和Queries区域的查询名字字段是一样的。有一点不同就是，当报文中域名重复出现的时候，该字段使用2个字节的偏移指针来表示。比如，在资源记录中，域名通常是查询问题部分的域名的重复，因此用2字节的指针来表示，具体格式是最前面的两个高位是11，用于识别指针。其余的14位从DNS报文的开始处计数（从0开始），指出该报文中的相应字节数。一个典型的例子，C00C(1100000000001100，12正好是头部的长度，其正好指向Queries区域的查询名字字段)。
- <font color=red>生存时间</font>。以秒为单位，表示的是资源记录的生命周期，一般用于当地址解析程序取出资源记录后决定保存及使用缓存数据的时间，它同时也可以表明该资源记录的稳定程度，极为稳定的信息会被分配一个很大的值（比如86400，这是一天的秒数）。
- <font color=red>data</font>。该字段是一个可变长字段，表示按照查询段的要求返回的相关资源记录的数据。可以是Address（表明查询报文想要的回应是一个IP地址）或者CNAME（表明查询报文想要的回应是一个规范主机名）等。
## 3.3. wireshark抓包分析
### 3.3.1. 请求报文
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163208.png)

### 3.3.2. 响应报文
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163312.png)

# 4. nslookup和dig
通过命令行查询域名对应ip有两种方式：
- 使用``nslookup shinerio.cc``查询域名ip
- 使用`dig shinerio.cc`查询域名ip
# 5. DNS Over TCP
客户端默认通过UDP协议进行通信，但是由于广域网中不适合传输过大的`UDP`数据包，因此规定当报文长度超过了512字节时，应转换为使用`TCP`协议进行数据传输。此时可能会出现如下的两种情况：
-   客户端认为`UDP`响应包长度可能超过512字节，主动使用`TCP`协议
-   客户端使用UDP协议发送DNS请求，服务端发现响应报文超过了 512 字节，在截断的`UDP`响应报文中将`TC`设置为1，以通知客户端该报文已经被截断，客户端收到之后再发起一次`TCP`请求（该特性通常也被安全厂商作为一种有效防御`DNS Query Flood`攻击的手段）

使用以下脚本`python3 dns_query.py shinerio.site 8.8.8.8`可以使用TCP发起DNS请求。
```
import dns.resolver
import dns.query
import dns.rdatatype


def tcp_dns_query(domain, dns_server):
    resolver = dns.resolver.Resolver()
    resolver.nameservers = [dns_server]
    query = dns.message.make_query(domain, dns.rdatatype.A)
    try:
        response = dns.query.tcp(query, dns_server)
        for answer in response.answer:
            for item in answer.items:
                print(item.address)
    except dns.resolver.NXDOMAIN:
        print(f"域名 {domain} 未找到。")
    except dns.resolver.NoAnswer:
        print(f"DNS服务器 {dns_server} 没有返回答案。")
    except dns.resolver.Timeout:
        print(f"查询 {domain} 超时。")


if __name__ == "__main__":
    import sys

    if len(sys.argv)!= 3:
        print("用法: python tcp_dns_query.py [域名] [DNS服务器地址]")
    else:
        domain = sys.argv[1]
        dns_server = sys.argv[2]
        tcp_dns_query(domain, dns_server)
```

![[dns_over_tcp.pcapng]]
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241229214126094.png)
