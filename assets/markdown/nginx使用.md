# 1. nginx常用命令
Nginx的命令在控制台中输入`nginx -h`就可以看到完整的命令，这里列举几个常用的命令：
- nginx -s reload  # 向主进程发送信号，重新加载配置文件，热重启
- nginx -s reopen	 # 重启 Nginx
- nginx -s stop    # 快速关闭
- nginx -s quit    # 等待工作进程处理完成后关闭
- nginx -T         # 查看当前 Nginx 最终的配置
- nginx -t -c     # 检查配置是否有问题，如果已经在配置目录，则不需要-c

systemctl是Linux系统应用管理工具systemd的主命令，用于管理系统，我们也可以用
它来对 Nginx 进行管理，相关命令如下：
- systemctl start nginx    # 启动 Nginx
- systemctl stop nginx     # 停止 Nginx
- systemctl restart nginx  # 重启 Nginx
- systemctl reload nginx   # 重新加载 Nginx，用于修改配置后
- systemctl enable nginx   # 设置开机启动 Nginx
- systemctl disable nginx  # 关闭开机启动 Nginx
- systemctl status nginx   # 查看 Nginx 运行状态
# 2. nginx配置语法
nginx主配置文件是`/etc/nginx/sites-available/default`或者`/etc/nginx/nginx.conf`，结构图可以概括为：
```conf
main        # 全局配置，对全局生效
├── events  # 配置影响Nginx服务器或与用户的网络连接
├── http    # 配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置
│   ├── upstream # 配置后端服务器具体地址，负载均衡配置不可或缺的部分
│   ├── server   # 配置虚拟主机的相关参数，一个http块中可以有多个 server 块
│   ├── server
│   │   ├── location  # server 块可以包含多个 location 块，location 指令用于匹配 uri
│   │   ├── location
│   │   └── ...
│   └── ...
└── ...
```
配置文件的语法规则：
 - 配置文件由指令与指令块构成；
 - 每条指令以 ; 分号结尾，指令与参数间以空格符号分隔；
 - 指令块以 {} 大括号将多条指令组织在一起；
 - include 语句允许组合多个配置文件以提升可维护性；
 - 使用 # 符号添加注释，提高可读性；
 - 使用$符号使用变量；
 - 部分指令的参数支持正则表达式；
一个典型的配置如下
```conf
user www-data;               # 运行用户，默认即是nginx，可以不进行设置
worker_processes auto;       # Nginx 进程数，一般设置为和CPU核数一样
pid /run/nginx.pid;            # Nginx服务启动时master进程的pid存放位置
error_log /var/log/nginx/error.log;     # Nginx 的错误日志存放目录
include /etc/nginx/modules-enabled/*.conf; # 把指定文件都包含到当前配置中

events {
        worker_connections 768;
        # multi_accept on;
}

# 配置使用最频繁的部分，代理、缓存、日志定义等绝大多数功能和第三方模块的配置都在这里设置
http {  
    # 设置日志模式
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;   # Nginx访问日志存放位置

    sendfile            on;   # 开启高效传输模式
    tcp_nopush          on;   # 减少网络报文段的数量
    tcp_nodelay         on;
    keepalive_timeout   65;   # 保持连接的时间，也叫超时时间，单位秒
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;      # 文件扩展名与类型映射表
    default_type        application/octet-stream;   # 默认文件类型

    include /etc/nginx/conf.d/*.conf;   # 加载子配置项
    
    server {
    	listen       80;       # 配置监听的端口
    	server_name  localhost;    # 配置的域名
    	
    	location / {
    		root   /usr/share/nginx/html;  # 网站根目录
    		index  index.html index.htm;   # 默认首页文件
    		deny 172.168.22.11;   # 禁止访问的ip地址，可以为all
    		allow 172.168.33.44； # 允许访问的ip地址，可以为all
    	}
    	
    	error_page 500 502 503 504 /50x.html;  # 默认50x对应的访问页面
    	error_page 400 404 error.html;   # 配置40x对应的访问页面
    }
}
```
## 2.1. location配置
server 块可以包含多个 location 块，location 指令用于匹配 uri，语法：
```conf
location [修饰符] uri {
	# 配置指令
}
```
Nginx 按以下表格顺序检查并选择匹配的 `location`：

| 修饰符  | 含义                     |
| ---- | ---------------------- |
| `=`  | 精确匹配（优先级最高）            |
| `^~` | 前缀匹配（一旦匹配成功则停止搜索其他匹配项） |
| `~`  | 正则匹配（区分大小写）            |
| `~*` | 正则匹配（不区分大小写）           |
| 无    | 前缀匹配（继续搜索其他匹配项）        |
示例；
```conf
location = /exact { ... }           # 精确匹配 /exact
location ^~ /static/ { ... }        # 前缀匹配 /static/ 及其子路径
location ~ \.(jpg|png|gif)$ { ... } # 正则匹配图片文件
location / { ... }                # 通用匹配（兜底）
```
## 2.2. nginx变量
在一个完整的请求过程中，会产生很多数据，nginx将这些数据以变量的形式提供给使用者。
- 所有的`nginx`变量在`nginx`配置文件中引用时都必须带上`$`前缀；
- 在`nginx`配置文件中，变量只能存放一种类型的值，那就是`字符串`类型；
- `nginx`使用变量来简化配置和提高配置灵活性，所有的变量值都以`$变量名`的形式引用；
### 2.2.1. 自定义变量
可以在`http`、`server`、`location`等标签中使用`set`命令声明变量，语法`set $变量名 变量值`

在不同层级标签中，声明变量可见性规则如下：
- `location`标签中声明的变量对这个`location块`可见
- `server`标签中声明的变量对`server块`以及`server块中的所有子块`可见
- `http`标签中声明的变量对`http块`以及`http块中的所有子块`可见
### 2.2.2. 内置预定义变量
访问地址 `http://test.com/foo?pid=123&sid=abc`

| 参数名                 | 参数值                       | 说明                                                                         |
| ------------------- | ------------------------- | -------------------------------------------------------------------------- |
| request_filename    | /usr/share/nginx/html/foo | 磁盘文件系统待访问文件的完整路径                                                           |
| document_root       | /usr/share/nginx/html     | 由 `URI` 和 `root/alias` 规则生成的文件夹路径                                          |
| fastcgi_script_name | /foo                      | 当前请求的脚本名称                                                                  |
| uri                 | /foo                      | 请求的`URL`，不包含参数                                                             |
| document_uri        | /foo                      | 与`$uri`相同                                                                  |
| request_uri         | /foo?pid=123&sid=abc      | 请求的`URL`，包含参数                                                              |
| args                | pid=123&sid=abc           | 全部参数字符串                                                                    |
| arg_参数名             | arg_pid:123 arg_sid:abc   | 获取特定参数值                                                                    |
| query_string        | pid=123&sid=abc           | 与 `args` 相同                                                                |
| is_args             | ?                         | `URL` 中是否有参数，有的话返回 `?` ，否则返回空                                              |
| request_method      | GET                       | 请求方法                                                                       |
| request_time        | 0.000                     | 处理请求已消耗的时间                                                                 |
| request_length      | 444                       | 全部请求的长度，包含请求行、请求头、请求体                                                      |
| http_user_agent     | Mozilla/5.0.....          | 用户浏览器                                                                      |
| http_referer        | 空                         | 从哪些链接过来的请求                                                                 |
| remote_addr         | 客户端`IP`                   | 客户端`IP`                                                                    |
| remote_port         | 客户端端口                     | 客户端端口                                                                      |
| server_addr         | 服务端 `IP` 地址               | 服务端 `IP` 地址                                                                |
| server_port         | 80                        | 服务端端口                                                                      |
| server_protocol     | HTTP/1.1                  | 服务端协议                                                                      |
| scheme              | http                      | 协议名， `http` 或 `https`                                                      |
| http_via            | 空                         | 每经过一层代理服务器，都会添加相应的信息                                                       |
| http_cookie         | 空                         | 获取用户 `cookie`                                                              |
| https               | 空                         | 是否开启了`https`，是则返回 `on` ，否则返回空                                              |
| limit_rate          | 空                         | 返回响应时的速度上限值                                                                |
| content_length      | 空                         | 请求头中的`Content-length`字段                                                    |
| content_type        | 空                         | 请求头中的`Content-Type`字段                                                      |
| request_body_file   | 空                         | 客户端请求主体信息的临时文件名                                                            |
| remote_user         | 空                         | 已经经过Auth Basic Module验证的用户名                                                |
| host                | test                      | 请求信息中的 `Host` ，如果请求中没有 `Host`  行，则在请求头中找，最后使用 `nginx` 中设置的 `server_name` 。 |
# 3. 域名配置
由于默认配置文件`/etc/nginx/nginx.conf`的 http 模块中有一句`include /etc/nginx/conf.d/*.conf`也就是说`conf.d`文件夹下的所有`*.conf`文件都会作为子配置项被引入配置文件中。可以新建一个`/etc/nginx/conf.d/home.shinerio.site.conf`文件用于存储home.shinerio.site域名提供的服务。
```conf
server {
  listen 8080;
	server_name home.shinerio.site;

	location / {
	    # 默认网址重定向到最大学习网站Bilibili的proxy_pass配置🤓 ：
		proxy_pass http://www.bilibili.com;
	}
}
```
服务只监听了localhost:8080端口，可以通过nginx把115.190.78.70:8000请求转发到本地8080端口
```conf
server {
        listen 8000;
        server_name 115.190.78.70;
        location / {
                proxy_pass http://127.0.0.1:8080/;
                proxy_http_version 1.1;
                proxy_set_header X-Forwarded-Host $http_host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
                http2_push_preload on;
        }
}
```
实际使用中，可以将请求转发到本机另一个服务器上，也可以根据访问的路径跳转到不同端口的服务中。
- 把访问 http://home.shinerio.site:8080/edu 的请求转发到 http://127.0.0.1:8080
- 把访问 http://home.shinerio.site:8080/vod 的请求转发到 http://127.0.0.1:8081
```conf
server {
  listen 8080;
  server_name home.shinerio.site;

  location ~ /edu/ {
    proxy_pass http://127.0.0.1:8080;
  }
  
  location ~ /vod/ {
    proxy_pass http://127.0.0.1:8081;
  }
}
```
反向代理还有一些其他的指令
- proxy_set_header：在将客户端请求发送给后端服务器之前，更改来自客户端的请求头信息；
- proxy_connect_timeout：配置 Nginx 与后端代理服务器尝试建立连接的超时时间；
- proxy_read_timeout：配置 Nginx 向后端服务器组发出 read 请求后，等待相应的超时时间；
- proxy_send_timeout：配置 Nginx 向后端服务器组发出 write 请求后，等待相应的超时时间；
- proxy_redirect：用于修改后端服务器返回的响应头中的 Location 和 Refresh。
# 4. 负载均衡
```conf
http {
  upstream myserver {
  	# ip_hash;  # ip_hash 方式
    # fair;   # fair 方式
    server 127.0.0.1:8081;  # 负载均衡目的服务地址
    server 127.0.0.1:8080;
    server 127.0.0.1:8082 weight=10;  # weight方式，不写默认为 1
  }
 
  server {
    location / {
    	proxy_pass http://myserver;
        proxy_connect_timeout 10;
    }
  }
}
```

Nginx 提供了好几种分配方式，默认为轮询，就是轮流来。
- 轮询，默认方式，每个请求按时间顺序逐一分配到不同的后端服务器，如果后端服务挂了，能自动剔除；
- weight，权重分配，指定轮询几率，权重越高，在被访问的概率越大，用于后端服务器性能不均的情况；
- ip_hash，每个请求按访问IP的 hash 结果分配，这样每个访客固定访问一个后端服务器，可以解决动态网页 session 共享问题。负载均衡每次请求都会重新定位到服务器集群中的某一个，那么已经登录某一个服务器的用户再重新定位到另一个服务器，其登录信息将会丢失，这样显然是不妥的；
- fair（第三方），按后端服务器的响应时间分配，响应时间短的优先分配，依赖第三方插件 nginx-upstream-fair，需要先安装；
# 5. ref
https://www.nginx.org.cn/article/detail/545