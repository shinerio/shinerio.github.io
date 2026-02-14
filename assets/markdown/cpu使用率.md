# 1. 查看进程CPU使用率
## 1.1. 平均使用率
ps命令显示的`%cpu`值是进程的平均CPU使用率，计算公式为:
$$\%CPU=(进程使用的CPU时间​/进程运行的总时间)×100$$
如下命令显示CPU占用最高的前几名进程
`ps -eo pid,comm,%cpu --sort=-%cpu | head`
输出如下
```scss
PID COMMAND         %CPU  
1234 firefox         42.3  
5678 chrome          37.5  
9101 java            22.0
```
## 1.2. 瞬时使用率
如果想监控某个进程（比如 `nginx`）的 CPU 使用率
```
top -p $(pgrep nginx)
```
# 2. 查看系统CPU使用率
## 2.1. 使用 `top` 命令（实时查看）
进入 `top` 界面后，按 **`1`** 可以查看每个CPU核心的使用情况。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162105169.png)
`Cpu(s)` 行的字段含义：
- **`us`（user）**：用户进程占用 CPU 百分比
- **`sy`（system）**：内核进程占用 CPU 百分比
- **`ni`（nice）**：调整过优先级的用户进程占用 CPU 百分比
- **`id`（idle）**：空闲 CPU 百分比
- **`wa`（iowait）**：等待 I/O 操作的时间
- **`hi`（hardware IRQ）**：硬件中断占用 CPU 百分比
- **`si`（software IRQ）**：软件中断占用 CPU 百分比
- **`st`（steal）**：虚拟化环境中被其他虚拟机抢占的 CPU 百分比
```scss
%Cpu(s):  12.3 us,  4.5 sy,  0.0 ni, 80.1 id,  2.9 wa,  0.0 hi,  0.2 si,  0.0 st
```
- 用户进程占用12.3%CPU
- 内核进程占用4.5%CPU
- 空闲80.1%CPU
## 2.2. 使用 `htop`（更美观的交互界面)
需要手动安装（部分 Linux 发行版可能没有预装）。
```shell
sudo apt install htop 
# Ubuntu/Debian 
sudo yum install htop  
# CentOS/RHEL sudo dnf install htop  # Fedora`
```
- 显示每个 CPU 核心的负载情况
- 颜色区分不同类型的 CPU 负载
- 支持鼠标操作和快捷键
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162144690.png)
## 2.3. 使用 `vmstat`（监控 CPU 使用情况）
`vmstat 1`
输出如下
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162217345.png)
- **`us`（user）**：用户进程CPU使用率
- **`sy`（system）**：内核进程CPU使用率
- **`id`（idle）**：CPU空闲率
- **`wa`（wait）**：I/O等待占用CPU比例
## 2.4. 使用 `mpstat`（更详细的 CPU 统计信息）
`mpstat -P ALL 1`
**关键参数**
- `-P ALL`：显示所有CPU核心的统计信息
- `1`：每秒刷新一次
安装方式
```shell
sudo apt install sysstat  
# Ubuntu/Debian 
sudo yum install sysstat  
# CentOS/RHEL`
```
输出如下
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162355778.png)
## 2.5. 使用 `sar`（历史 CPU 使用情况）
`sar -u 5 3`
- 需要安装 `sysstat`（同 `mpstat`）
- `-u`：显示 CPU 使用情况。
- `5 3`：每 5 秒采样一次，共 3 次。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162516258.png)
top是实时显示cpu使用率，而sar适用于**CPU 历史使用情况分析**，可以查看过去的CPU负载趋势。sar从 `sysstat` 日志文件 `/var/log/sysstat/` 读取数据，适合长期分析。
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250302162750842.png)
## 2.6. 只查看 CPU 使用率数值
如果你只想获取当前的CPU使用率（去掉 `idle` 部分）：
`top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8"%"}'`
- `$8` 代表 `idle` 值（空闲 CPU）。
- 计算 `100 - idle`，得到 CPU 使用率。
```scss
root@vultr:~# top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8"%"}'
16.7%
```
# 3. 总结

| 命令                                 | 作用                         |
| ---------------------------------- | -------------------------- |
| `top`                              | 实时查看CPU平均使用率，按 `1` 显示各核心情况 |
| `htop`                             | 交互式界面，类似`top`，更美观         |
| `vmstat 1`                         | 每秒显示一次CPU统计信息            |
| `mpstat -P ALL 1`                  | 按 CPU 核心统计使用率              |
| `sar -u 5 3`                       | 采样 CPU 负载历史数据              |
| `top -bn1                          | grep "Cpu(s)"              |
| "ps -eo pid,comm,%cpu --sort=-%cpu \| head"  |    查看CPU实时利用率                  |
| `ps -C nginx -o %cpu`              | 查询 `nginx` 进程的 CPU 使用率     |
