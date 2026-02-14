由于主流浏览器都只支持HTTP/2 Over TLS，也就是说当前HTTP/2网站都使用了HTTPS，数据传输都经过了SSL加密，常规抓包方法并不能看到明文数据。
# 1. wireshark
Wireshark 的抓包原理是直接读取并分析网卡数据，要想让它解密 HTTPS 流量，有两个办法：  
1）如果你拥有 HTTPS 网站的加密私钥，可以用来解密这个网站的加密流量；  
2）某些浏览器支持将 TLS 会话中使用的对称密钥保存在外部文件中，可供 Wireshark 加密使用。

Firefox 和 Chrome 都支持生成上述第二种方式的文件，具体格式见这里：[NSS Key Log Format](https://developer.mozilla.org/en-US/docs/Mozilla/Projects/NSS/Key_Log_Format)。  
但 Firefox 和 Chrome 只会在系统环境变量中存在 SSLKEYLOGFILE 路径时才会生成它，先来加上这个环境变量（以 OSX 为例）：
```shell
# 新建sslkeylog.log文件
mkdir ~/tls && touch ~/tls/sslkeylog.log
# 添加环境变量
export SSLKEYLOGFILE=~/tls/sslkeylog.log
```
接着，在 Wireshark选项中按如下设置TLS
![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20241227214238173.png)
接着控制台打开chrome
```
open /Applications/Google\ Chrome.app
```
## 1.1. windows设置
```bash
--ssl-key-log-file=D:\sslkey.log
复制代码
```
在windows系统下可以右键点击Chrome浏览器的快捷方式进行设置：

![image-20220315102335795](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c03a5f7c5ba24bc7a410d357df2500f3~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.image)

