# 1. 主机硬件

- 主板：微星B360M Mortar
- CPU：i3-8300t
- 内存：金士顿骇客8G * 2 DDR4
- SSD：三星980 NVMe PCIe3.0 500G
- 西数：红盘4T
- 散热器：利民AXP90 X47
- 电源：台达VX350
- 机箱：先马米立方matx

# 2. ssh登录
ubuntu系统，设置仅支持ssh秘钥登录，保证安全性

# 3. 开启samba共享文件
```shell
vim /etc/samba/smb.conf
```

# 4. plex
配置ssl加密，在let's encrypt申请证书（p12格式，默认包含公钥、私钥和证书）。

> 更换绑定证书后需要浏览器清理一下证书缓存。

外网访问plex统一使用https通道，内网还保留http通道。
# 5. movie-robot
```shell
docker run -itd --name=movie-robot --restart always --network host -p 1329:1329 -v /home/shinerio/movie-robot:/data -v /home/shinerio/Downloads:/Downloads -v /home/shinerio/data/Media/Movie:/Movie -v /home/shinerio/data/Media/TvShow:/TvShow --env 'LICENSE_KEY=存储在1password' yipengfei/movie-robot:latest
```

# 6. shadowsocks打通隧道
通过ddns绑定公网ip，端口只映射几个必要的、能够保证安全的端口，其他服务在外网通过ss代理的方式访问。内网主机配置自定义域名解析到192.168.85.0/24内网IP，识别外网环境强制192.168.85.0/24这个网段走家庭网络专用ss代理服务器。

## 6.1. 端口映射

| port  | service   | 安全性                                                    |
| ----- | --------- | --------------------------------------------------------- |
| 50000 | tomcat    | 使用tomcat用户启动，无login权限，无sudo权限；三重密码保护 |
| 14443 | ss-server | 高安全性加密算法，复杂密码                                              |
| 32400 | plex      | plex用户启动，无login权限，无sudo权限；两步认证           |

## 6.2. 域名分配
设备使用自定义域名解析到内网ip，配置场景模式外网环境强制走ss代理，14443端口回家，家庭环境直接走内网，不过路由。

| ip地址       | 自定义域名      |
| -------------- | --------------- |
| 192.168.85.105 | shinerio.nas    |
| 192.168.85.2   | shinerio.server |

## 6.3. 外网访问使用的所有自定义域名ss-server也必须可以解析
```shell
# vim /etc/hosts添加
192.168.85.2 shinerio.server
fe80::211a:a1f9:e853:b548 shinerio.server
192.168.85.105 shinerio.nas
fe80::20c:29ff:feb5:ff66 shinerio.nas
```
需要同时添加ipv6的解析，否则ss建连会比较慢
```bash
Apr  2 19:40:53 shinerio-ubuntu /usr/local/bin/ss-server[27224]: successfully resolved shinerio.nas
Apr  2 19:40:53 shinerio-ubuntu /usr/local/bin/ss-server[27224]: new connection to remote, 1 opened remote connections
Apr  2 19:40:53 shinerio-ubuntu /usr/local/bin/ss-server[27224]: failed to lookup v6 address Timeout while contacting DNS servers
```

# 7. 远程控制
## 7.1. xrdp远程桌面
```shell
# 安装
apt install xrdp
# 启动
systemctl start xrdp
# 开机启动
systemctl enable xrdp
```
解决黑屏
```shell
# 编辑
vim /etc/xrdp/startwm.sh
# 添加配置
unset DBUS_SESSION_BUS_ADDRESS
unset XDG_RUNTIME_DIR

# 优化桌面，不做任何配置，启动之后的桌面是非常别扭的，因为是Gnome的原始桌面，没有左侧的任务栏，窗口也没有最小化按钮，等等一些列问题
vim ~/.xsessionrc

# 添加：
export GNOME_SHELL_SESSION_MODE=ubuntu
export XDG_CURRENT_DESKTOP=ubuntu:GNOME
export XDG_CONFIG_DIRS=/etc/xdg/xdg-ubuntu:/etc/xdg

# 重启
systemctl restart xrdp
```

## 7.2. 通过Guacamole实现web端控制
```shell
# 默认情况下guacamole只监听本地ip
# /etc/guacamole/guacd.conf
[server]
bind_host = 192.168.85.2
bind_port = 4822
```
配置登录信息
```shell
vim /etc/guacamole/user-mapping.xml
```
为了安全尽量不要配置密码，在登录后手动输入
```xml
<user-mapping>
        <authorize password="xxxx" username="shinerio"> #登录界面账号密码

        <connection name="rdp-shinerio-ubuntu">
                <protocol>rdp</protocol>  #RDP协议配置
                <param name="hostname">192.168.85.2</param> #远程主机IP
                <param name="port">3389</param> #rdp 默认端口
                <param name="username">your-username</param> #远程主机用户
                <param name="ignore-cert">true</param>
        </connection>
      </authorize>
</user-mapping>
```
重启
systemctl restart guacd

# 8. 群晖（虚拟机）
使用arpl安装。设置复杂密码+两步认证+开启自动封锁

## 8.1. 安装webDav server

## 8.2. 设置仅支持ssh秘钥登录
```
# sshd对文件夹权限校验严格，需要将以下目录权限设置正确
chmod 755 /homes/shinerio 
chmod 700 ~/.ssh 
chmod 600 ~/.ssh/authorized_keys
```

## 8.3. 安装git备份obsidian笔记
```shell
# 增量同步数据
rsync -r shinerio@192.168.85.2:/home/shinerio/data/Documents/obsidian /var/services/homes/shinerio/Document/note
```

# 9. 分工原则

ubuntu: 媒体中心，存储电视、电影，通过web控制端兼具远程办公能力
nas: photo备份(google photo同步备份)，重要资料备份中心，document目录1自动同步google drive云备份
obsidian：
1. 全平台所有资料存储本地保存，通过gitee同步。
2. 苹果是主力写作平台，通过icloud同步，同时google drive同步