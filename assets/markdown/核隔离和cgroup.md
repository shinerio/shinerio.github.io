
![[CPU#1. 基本概念]]
# 1. 核隔离
修改内核启动参数
```shell
# 查看可用cpu编号
lscpu | grep -i on-line
# 修改内核启动参数 vim /etc/default/grub
GRUB_CMDLINE_LINUX="isolcpus=2,3 ...其他参数..." # 多个参数用空格分隔
# 更新grub并重启，centos或redhat系统使用sudo grub2-mkconfig -o /boot/grub2/grub.cfg
sudo update-grub 
sudo reboot
# 查看被隔离CPU
cat /sys/devices/system/cpu/isolated
# 2-3
# 或使用以下命令
cat /proc/cmdline | grep isolcpus
```
## 1.1. CPU加压测试
```shell
# 安装stress
sudo apt-get update
sudo apt-get install stress
# 指定cpu数量
stress --cpu 4
```
htop可以看到隔离的核没有受到影响
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250222000430884.png)
# 2. 绑定进程到隔离核心
```shell
taskset -c 2 stress --cpu 1 &
taskset -c 3 stress --cpu 2 &
```
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250222001417888.png)
# 3. cgroup
```bash
# 创建cgroup目录
sudo mkdir /sys/fs/cgroup/cpuset/myapp
# 设置允许使用的CPU核心（2-3）
echo "2-3" | sudo tee /sys/fs/cgroup/cpuset/myapp/cpuset.cpus
# 设置关联的内存节点（通常为0）
echo "0" | sudo tee /sys/fs/cgroup/cpuset/myapp/cpuset.mems
# 启动程序并加入cgroup
sudo cgexec -g cpuset:myapp ./cpu_test
```
输出如下
> [!info]
> Worker 0 started on CPU 2
Worker 2 started on CPU 2
Worker 1 started on CPU 3
Worker 3 started on CPU 3
![image.png](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images20250223224921767.png)

示例代码参考[[核隔离和cgroup#5. 附录]]

> [!tip]
> 这里一定要设置cpu affinity，否则进程偏向于只调度在一个CPU上
# 4. irqbalance
irqbalance是一个 Linux 系统中的守护进程，其主要功能是动态地将硬件中断请求（IRQ）分配到不同的CPU核心上，以此来优化系统的中断处理性能。在多CPU核心的系统中，如果所有的中断都集中在一个或少数几个CPU 核心上处理，会导致这些核心负载过高，而其他核心则处于空闲状态，从而影响系统整体性能。`irqbalance` 会根据系统的负载情况，自动调整中断的分配，使得中断能够均匀地分布到各个CPU核心上，提高系统的并行处理能力和响应速度。
## 4.1. 禁用中断
由于 `irqbalance` 会动态调整中断分配，可能会导致中断在不同的 CPU 核心之间频繁迁移。这种中断迁移会带来额外的开销，例如缓存失效、上下文切换等，从而导致系统性能出现波动，不利于DPDK应用程序实现稳定的高性能处理。在基于DPDK的网络转发平台上，我们可以设置禁止转发线程使用CPU处理中断，以防止造成性能损失。
## 4.2. /etc/sysconfig/irqbalance文件
该文件用于存储 `irqbalance` 服务的配置参数，通过修改这个文件中的配置项，可以对 `irqbalance` 服务的行为进行定制化设置。
## 4.3. 禁止CPU处理中断
`vim /etc/sysconfig/irqbalance`，添加`IRQBALANCE_BANNED_CPUS=c`，[参考设置](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux_for_real_time/7/html/tuning_guide/interrupt_and_process_binding#Interrupt_and_process_binding)

> [!tip] 
> 这里的`C`是一个十六进制数，转换为二进制是 `1100`，从右到左每一位依次对应 CPU 0、CPU 1、CPU 2、CPU 3，为1的位表示对应的 CPU 核心会被 `irqbalance` 考虑用于中断分配，为 0 则表示不考虑

```shell
sudo systemctl restart irqbalance
# 观察中断处理是否符合预期
watch -n 1 "cat /proc/interrupts"
```

/sys/devices/virtual/workqueue/cpumask，转发线程在用户态运行，若调度到workqueue线程，则会陷入内核态，造成线程损失，因此需要对转发线程所在的核进行workqueue屏蔽

```shell
cat /sys/devices/virtual/workqueue/cpumask
# f  输出为f，二进制1111，代表所有核都参与
```

/proc/sys/vm/

# 5. 附录
## 5.1. 多线程测试应用
```c
#include <stdio.h>
#include <pthread.h>
#include <unistd.h>
#include <sched.h>

#define NUM_THREADS 4
#define CPU_START 2
#define CPU_END 3

void* worker(void* arg) {
    long tid = (long)arg;
    
    // 设置CPU亲和性，设置不同线程的不同CPU亲和性
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET(CPU_START + (tid % (CPU_END - CPU_START + 1)), &cpuset);
    int rc = pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
    if (rc != 0) {
        perror("Error setting thread affinity");
    }
    
    printf("Worker %ld started on CPU %d\n", tid, sched_getcpu());
    
    // 持续消耗CPU的计算任务
    while(1) {
        double x = 3.14159 * 123456.789;
        x /= 3.14159;
        x *= 123456.789;
    }
    return NULL;
}

int main() {
    // 设置主线程亲和性
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    for(int cpu = CPU_START; cpu <= CPU_END; cpu++) {
        CPU_SET(cpu, &cpuset);
    }
    pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);

    pthread_t threads[NUM_THREADS];
    
    for(long i = 0; i < NUM_THREADS; i++) {
        pthread_create(&threads[i], NULL, worker, (void*)i);
    }

    // 主线程等待所有工作线程
    for(int i = 0; i < NUM_THREADS; i++) {
        pthread_join(threads[i], NULL);
    }
    return 0;
}
```
编译
```shell
gcc -D_GNU_SOURCE cpu_test.c -o cpu_test -pthread
```
## 5.2. grub
GRUB用于多操作系统启动管理的工具，主要配置文件是`/boot/grub/grub.cfg`，但一般不建议直接编辑该文件。GRUB2采用动态生成配置文件的方式，用户可以通过修改 `/etc/default/grub`和`/etc/grub.d`目录下的脚本文件来间接配置启动选项。系统会根据这些设置自动生成最终的`grub.cfg`文件。
- **/boot/grub2/grub.cfg**：常见于基于Red Hat系列的发行版，如Red Hat Enterprise Linux（RHEL）、CentOS、Fedora 等。这些发行版为了明确区分GRUB和 GRUB2，采用`/boot/grub2`目录来存放 GRUB2 的相关文件，`grub.cfg` 就是其中关键的配置文件，它记录了系统的启动选项、内核信息等。
- **/boot/grub/grub.cfg**：多见于基于 Debian 系列的发行版，如 Debian、Ubuntu 等。这些发行版在采用 GRUB2 作为启动加载器后，仍然沿用了`/boot/grub`目录结构，所以 GRUB2 的配置文件存放在该目录下的 `grub.cfg` 中。