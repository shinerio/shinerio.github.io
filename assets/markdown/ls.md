```shell
root@vultr:~# ls -trl --full-time
total 232
-rw-r--r-- 1 root root    432 2024-11-15 13:46:40.747000144 +0000 server.py
-rw-r--r-- 1 root root    358 2024-11-15 13:47:40.179788313 +0000 client.py
-rwxr-xr-x 1 root root  19975 2024-12-13 14:11:47.433975727 +0000 trojan.sh
-rwxr-xr-x 1 root root   8399 2024-12-13 14:23:52.420202666 +0000 easytrojan.sh
-rw-r--r-- 1 root root 171012 2025-01-01 15:50:17.668060999 +0000 menu.sh
-rwxr-xr-x 1 root root  24301 2025-02-26 14:58:13.775206307 +0000 tcp.sh
root@vultr:~# ls -Srlh
total 232K
-rw-r--r-- 1 root root  358 Nov 15 13:47 client.py
-rw-r--r-- 1 root root  432 Nov 15 13:46 server.py
-rwxr-xr-x 1 root root 8.3K Dec 13 14:23 easytrojan.sh
-rwxr-xr-x 1 root root  20K Dec 13 14:11 trojan.sh
-rwxr-xr-x 1 root root  24K Feb 26 14:58 tcp.sh
-rw-r--r-- 1 root root 168K Jan  1 15:50 menu.sh
```
# 1. 基于文件名排序
```bash
# ls -fl
```
# 2. 基于文件大小排序
```bash
# ls -Sr
```
# 3. 基于文件时间排序
```bash
# ls -tr 
```
