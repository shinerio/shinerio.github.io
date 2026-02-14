```shell
# 安装依赖
apt install wget apt-transport-https gnupg2
# 安装桌面环境
apt install xfce4 xfce4-goodies
# 安装tigervnc
apt install tigervnc-standalone-server

# 编辑.vnc/xstartup
---
#!/bin/sh
# Start up the standard system desktop
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
/usr/bin/startxfce4
---

# 启动并设置密码
vncserver


# ssh加密，使用tmux执行
ssh -L 59000:127.0.0.1:5901 -C -N -l shinerio 192.168.85.2

# 安装novnc以支持浏览器访问
git clone git@github.com:novnc/noVNC.git
# 进入项目
cd noVNC
# 启动项目
chmod +x ./utils/novnc_proxy
./utils/novnc_proxy --listen 8080 --vnc 127.0.0.1:59000

# 浏览器输入ip:8080/vnc.html访问
```

