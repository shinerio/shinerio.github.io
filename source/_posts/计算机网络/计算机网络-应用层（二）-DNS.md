---
title: 计算机网络-应用层（二）-DNS
date: 2020-04-23
categories:
- 计算机网络
tags:
- 计算机网络
---

DNS域名解析服务采用C/S架构

<!--more-->

##1. 基本概念

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424141937.png)

### 1.1 域名结构

www.google.com    mail.google.com    scholar.google.com

【顶级域名】： .com

【二级域名】： google

【三级域名】：www/mail/scholar

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424142522.png)

### 1.2 CNAME和A记录

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424152649.png)

【A记录】：A记录是用来指定主机名（或域名）对应的IP地址记录。如设置二级域名shinerio.cc对应ip地址为185.199.111.153（gitpage服务器地址）等。当然，也可以为三级域名mail.shinerio.cc绑定对应ip地址。一个域名可以对应多条A记录，即对应多个ip地址，实现DNS负载均衡。

> 主机记录类型有www,解析后域名为www.shinerio.cc。@，直接解析主域名shinerio.cc，相当于www.shinerio.cc。*，匹配所有域名\*.shinerio.cc，将所有shinerio.cc下的子域名指向同一服务器地址。mail，将域名解析为mail.shinerio.cc，通常用于解析邮箱服务器。

【CNAME记录】：CNAME记录将多个名字映射到另外一个域名。如将shinerio.cc记录别名为shinerio.github.io，这样用shinerio.cc替代shinerio.github.io访问gitpage提供的个人博客主页。

【比较】：

1. 使用CNAME记录可以很方便地变更IP地址。如果一台服务器有100个网站，每个网站有一个域名。如果使用A记录，那么服务器ip更改时，则需要修改100条A记录。如果使用CNAME指向同一域名，那么该台服务器变更IP时，只需要变更别名的A记录就可以。
2. 使用A记录，输入域名的时候可以用shinerio.cc代替www.shinerio.cc，

## 2. 域名解析

### 2.1 域名服务器层次

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424144017.png)

【根域名服务器】： 最高层次的域名服务器，也是最重要的域名服务器。全球有13个根域名服务器名称，并不是一个名字对应一台物理服务器的地址，一个根服务器的名字可以作为入口对应一组服务器集群来提供域名解析服务。

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

【顶级域名服务器】：主要负责管理在该顶级域名服务器注册的下一级域名(二级域名)。所有顶级域名服务器的名称和IP地址是在根服务器注册的，也就是说，根域名服务器知道所有的顶级域名服务器的名称和IP地址。

【 权威域名服务器】：负责一个区的域名服务器，顶级域名服务器也可以算作是权威域名服务器，只不过由于其特殊性，我们专门把它划分为一类。因此权威域名服务器通常是指顶级域名以下的管理二级、三级、四级等域名的服务器。

【本地域名服务器】：当一个主机(个人电脑)发出DNS请求时，查询请求就被发送到本地域名服务器，本地域名服务器负责回答这个查询，或者代替主机向域名空间中不同层次的权威域名服务器查询，再把查询的结果返回给主机。

### 2.2 解析过程

DNS解析过程其实可以看做一个多岔树递归查询算法，从根节点出发，递归找下属域名服务器，直到解析成功。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424150647.png)

## 3. 协议报文格式

DNS采用UDP或TCP传输，主要是查看DNS报文首部中的标志字段。当客户端发出DNS查询请求，从服务器收到的响应报文中的TC（删减标志）比特被置为1时，表示应答总长度超过512字节，只返回前512个字节，这时DNS就需要使用TCP重发原来的查询请求。因为在UDP的应用程序中，其应用程序被限制在512个字节或更小，因此DNS报文穿数据流只能有512字节，而TCP能将用户的数据流分为一些报文段，因此TCP就能用多个报文段去传超过512字节的数据流或是任意长度的数据流。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424155506.png)

### 3.1 头部

【会话标识】（2字节）：是DNS报文的ID标识，对于请求报文和其对应的应答报文，这个字段是相同的，通过它可以区分DNS应答报文是哪个请求的响应

【标志】（2字节）：

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424155715.png)
| 字段  | 描述 |
| -------------- | --------------------------------------------- |
| QR（bit）      | 查询/响应标志，0为查询，1为响应                    |
| opcode（4bit） | 0表示标准查询，1表示反向查询，2表示服务器状态请求            |
| AA（1bit）     | 表示授权回答    |
| TC（1bit）     | 表示可截断的       |
| RD（1bit）     | 表示期望递归  |
| RA（1bit）     | 表示可用递归   |
| rcode（4bit）  | 表示返回码，0表示没有差错，3表示名字差错，2表示服务器错误（Server Failure） |

【Questions】 （2字节）表示查询问题区域节的数量

【Answers】（2字节）表示回答区域的数量

【Authoritative namesversers】（2字节）表示授权区域的数量

【Additional recoreds】（2字节）表示附加区域的数量

### 3.2 正文

【Queries】

![img](https://jocent.me/wp-content/uploads/2017/06/dns-package-quey.png)

- **NAME**。长度不固定，且不使用填充字节，一般该字段表示的就是需要查询的域名（如果是反向查询，则为IP，反向查询即由IP地址反查域名），一般的格式如下图所示。

  ![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163058.png)

- **查询类型**。

  | 类型 | 助记符 | 说明               |
  | ---- | ------ | ------------------ |
  | 1    | A      | 由域名获得IPv4地址 |
  | 2    | NS     | 查询域名服务器     |
  | 5    | CNAME  | 查询规范名称       |
  | 6    | SOA    | 开始授权           |
  | 11   | WKS    | 熟知服务           |
  | 12   | PTR    | 把IP地址转换成域名 |
  | 13   | HINFO  | 主机信息           |
  | 15   | MX     | 邮件交换           |
  | 28   | AAAA   | 由域名获得IPv6地址 |
  | 252  | AXFR   | 传送整个区的请求   |
  | 255  | ANY    | 对所有记录的请求   |

- 查询类。通常为0x0001，表明Internet数据

【Answers,Authoritative namesversers,Additional recoreds】

这三个部分格式一样，如下图所示。

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424160818.png)

- Name。它的格式和Queries区域的查询名字字段是一样的。有一点不同就是，当报文中域名重复出现的时候，该字段使用2个字节的偏移指针来表示。比如，在资源记录中，域名通常是查询问题部分的域名的重复，因此用2字节的指针来表示，具体格式是最前面的两个高位是 11，用于识别指针。其余的14位从DNS报文的开始处计数（从0开始），指出该报文中的相应字节数。一个典型的例子，`C00C`(11**00000000001100，**12正好是头部的长度，其正好指向Queries区域的查询名字字段)。
- 生存时间。以秒为单位，表示的是资源记录的生命周期，一般用于当地址解析程序取出资源记录后决定保存及使用缓存数据的时间，它同时也可以表明该资源记录的稳定程度，极为稳定的信息会被分配一个很大的值（比如86400，这是一天的秒数）。

-  data。该字段是一个可变长字段，表示按照查询段的要求返回的相关资源记录的数据。可以是Address（表明查询报文想要的回应是一个IP地址）或者CNAME（表明查询报文想要的回应是一个规范主机名）等。

### 3.3 wireshark抓包分析

【请求报文】

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163208.png)

【响应报文】

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20200424163312.png)

## 4. nslookup

使用``nslookup shinerio.cc``查询DNS

