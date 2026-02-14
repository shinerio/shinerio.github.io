# 1. remote_addr
表示发出请求的远程主机的IP地址，remote_addr代表**客户端的IP**，但它的值不是由客户端提供的，而是服务端根据客户端的ip指定的，当你的浏览器访问某个网站时
1. 假设中间没有任何代理，那么网站的web[服务器](https://www.baidu.com/s?wd=%E6%9C%8D%E5%8A%A1%E5%99%A8&tn=24004469_oem_dg&rsv_dl=gh_pl_sl_csd)（[Nginx](https://www.baidu.com/s?wd=Nginx&tn=24004469_oem_dg&rsv_dl=gh_pl_sl_csd)，Apache等）就会把remote_addr设为你的**机器IP**
2. 如果你用了某个代理，那么你的浏览器会先访问这个代理，然后再由这个代理转发到网站，这样web服务器就会把remote_addr设为这台**代理机器的IP**
# 2. http_x_forwarded_for
在 HTTP 代理和负载均衡等场景中，用于标识通过HTTP代理服务器连接到Web服务器的客户端的原始IP地址。

由于你使用了代理时，web服务器就不知道你的真实IP了，为了避免这个情况，代理服务器通常会增加一个叫做http_x_forwarded_for的头信息，把连接它的客户端IP(即你的上网机器IP)加到这个头信息里，这样就能保证网站的web服务器能获取到真实IP
格式一般为：
```
X-Forwarded-For: 1.1.1.1, 2.2.2.2, 3.3.3.3
```
代表 请求由`1.1.1.1`发出，经过两层代理，第一层是`2.2.2.2`，第二层是`3.3.3.3`
# 3. X-Real-IP
`X-Real-IP`是一个自定义的 HTTP 请求头字段，常用于标识客户端的**真实IP地址**。在存在代理服务器（如反向代理、负载均衡器等）的网络环境中，服务器直接获取到的 IP 地址往往是代理服务器的 IP 地址。为了能获取到客户端的真实 IP，就可以使用 `X-Real-IP`请求头。

当请求经过代理服务器时，代理服务器会将客户端的真实IP填充到 `X-Real-IP` 这个请求头字段中，然后再将请求转发给后端的 Web 服务器。Web 服务器通过解析这个请求头，就可以获取到客户端的真实 IP 地址。
> [!note]
> - X-Forwarded-For一般是每一个非[透明代理](https://www.baidu.com/s?wd=%E9%80%8F%E6%98%8E%E4%BB%A3%E7%90%86&tn=SE_PcZhidaonwhc_ngpagmjz&rsv_dl=gh_pc_zhidao)转发请求时会将上游服务器的IP地址追加到X-Forwarded-For的后面，使用英文逗号分割 
> - X-Real-IP一般是第一级代理将客户端IP地址添加到该头中
> - remote_addr代表最后一个代理服务器的ip
