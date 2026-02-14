# 1. 备份

```shell
df -h
# 数据盘挂载在/home/shinerio/data
# /dev/sda        3.6T  1.5T  2.0T   43% /home/shinerio/data
tar cvpzf /home/shinerio/data/backup.tar.gz --exclude=/proc --exclude=/lost+found --exclude=/mnt --exclude=/sys --exclude=/media --exclude=/home/shinerio /
```

# 2. 还原

```bash
tar xcpfz backup.tar.gz -C /
mkdir proc 
mkdir lost+found 
mkdir mnt 
mkdir sys
```
如果当前启动无法启动，可以通过live cd来启动并执行恢复操作