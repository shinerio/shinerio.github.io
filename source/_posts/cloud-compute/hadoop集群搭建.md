---
title: Hapdoop搭建
date: 2019-04-16
categories:
- 大数据
tags:
- 大数据
---



# （ubuntu18.04）

## 1. host配置主机名

修改所有主机host
```
vim /etc/hosts
10.103.238.94 hadoop-master
10.103.238.95 hadoop-slave1  
10.103.238.96 hadoop-slave2
10.103.238.97 hadoop-slave3
```

## 2. 修改主机名

以master为例，其他类似
```
vim /etc/hostname
hadoop-master
reboot
```

## 3. 安装jdk并配置环境

```
apt install openjdk-8-jdk

vim /etc/profile

export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
export CLASSPATH=.:$JAVA_HOME/lib/dt.jar:$JAVA_HOME/lib/tools.jar

source /etc/profile
```

## 4. 配置免密登陆

1）生产秘钥

ssh-keygen -t rsa

2）将公钥追加到”authorized_keys”文件

cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

3）赋予权限

chmod 600 ~/.ssh/authorized_keys

4）验证本机能无密码访问

ssh hadoop-master

5)配置hadoop-master免密登陆slave

将master的~/.ssh/id_rsa.pub追加到slave的~/.ssh/authorized_keys中

6)配置slave免密访问master

将slave的~/.ssh/id_rsa.pub追加到master的~/.ssh/authorized_keys中

## 5. hadoop环境搭建

1. hadoop-master上解压缩安装包及创建基本目录

```
#下载  
wget http://apache.claz.org/hadoop/common/hadoop-3.2.0/hadoop-3.2.0.tar.gz
#解压  
tar -xzvf  hadoop-3.2.0.tar.gz    -C /usr/local 
#重命名   
mv  hadoop-3.2.0  hadoop
```

2. 配置环境变量


```
vim /etc/profile
export HADOOP_HOME=/usr/local/hadoop
export PATH=$PATH:$HADOOP_HOME/bin 
source /etc/profile
```

3. 配置core-site.xml

修改Hadoop核心配置文件/usr/local/hadoop/etc/hadoop/core-site.xml，通过fs.default.name指定NameNode的IP地址和端口号，通过hadoop.tmp.dir指定hadoop数据存储的临时文件夹。

```xml
<configuration>
    <property>
        <name>hadoop.tmp.dir</name>
        <value>file:/usr/local/hadoop/tmp</value>
        <description>Abase for other temporary directories.</description>
    </property>
    <property>
        <name>fs.defaultFS</name>
        <value>hdfs://hadoop-master:9000</value>
    </property>
</configuration>
```

4. 配置hdfs-site.xml

修改HDFS核心配置文件/usr/local/hadoop/etc/hadoop/hdfs-site.xml，通过dfs.replication指定HDFS的备份因子为3，通过dfs.name.dir指定namenode节点的文件存储目录，通过dfs.data.dir指定datanode节点的文件存储目录。

```xml
<configuration>
    <property>
        <name>dfs.replication</name>
        <value>3</value>
    </property>
    <property>
        <name>dfs.name.dir</name>
        <value>/usr/local/hadoop/hdfs/name</value>
    </property>
    <property>
        <name>dfs.data.dir</name>
        <value>/usr/local/hadoop/hdfs/data</value>
    </property>
</configuration>
```

5. 配置mapred-site.xml

拷贝mapred-site.xml.template为mapred-site.xml，再进行修改

```xml
<configuration>
  <property>
      <name>mapreduce.framework.name</name>
      <value>yarn</value>
  </property>
   <property>
      <name>mapred.job.tracker</name>
      <value>http://hadoop-master:9001</value>
  </property>
</configuration>
```

6. 配置yarn-site.xml

```xml
<configuration>
<!-- Site specific YARN configuration properties -->
    <property>
        <name>yarn.nodemanager.aux-services</name>
        <value>mapreduce_shuffle</value>
    </property>
    <property>
        <name>yarn.resourcemanager.hostname</name>
        <value>hadoop-master</value>
    </property>
</configuration>
```

7. 配置masters文件

修改/usr/local/hadoop/etc/hadoop/masters文件，该文件指定namenode节点所在的服务器机器。删除localhost，添加namenode节点的主机名hadoop-master；不建议使用IP地址，因为IP地址可能会变化，但是主机名一般不会变化。

```
vi /usr/local/hadoop/etc/hadoop/masters
##内容
hadoop-master
```

8. 配置slave文件

修改/usr/local/hadoop/etc/hadoop/workers文件(低版本是slaves文件)，该文件指定哪些服务器节点是datanode节点。删除locahost，添加所有datanode节点的主机名，如下所示。
```
vi /usr/local/hadoop/etc/hadoop/slaves
## 内容
hadoop-slave1
hadoop-slave2
hadoop-slave3
```

## 6. 配置slave的hadoop环境

1. 复制hadoop到slave

`scp -r /usr/local/hadoop hadoop-slave1:/usr/local/`

2. 删除slave节点中slaves内容

`rm -rf /usr/local/hadoop/etc/hadoop/slaves`

3. 配置环境变量

```
vi /etc/profile
## 内容
export HADOOP_HOME=/usr/local/hadoop
export PATH=$PATH:$HADOOP_HOME/bin
source /etc/profile
```

## 7. 启动集群

1. 格式化HDFS文件系统

进入master的~/hadoop目录，执行以下操作

`bin\hadoop namenode -format`

格式化namenode，第一次启动服务前执行的操作，以后不需要执行。

2. 启动hadoop:

`sbin/start-all.sh`

3. 使用jps命令查看运行情况

```
#master 执行 jps查看运行情况
25928 SecondaryNameNode
25742 NameNode
26387 Jps
26078 ResourceManager
```

```
#slave 执行 jps查看运行情况
24002 NodeManager
23899 DataNode
24179 Jps
```

4. 命令查看Hadoop集群的状态

通过简单的jps命令虽然可以查看HDFS文件管理系统、MapReduce服务是否启动成功，但是无法查看到Hadoop整个集群的运行状态。我们可以通过hadoop dfsadmin -report进行查看。用该命令可以快速定位出哪些节点挂掉了，HDFS的容量以及使用了多少，以及每个节点的硬盘使用情况

`hadoop dfsadmin -report`

5. hadoop重启

```
sbin/stop-all.sh
sbin/start-all.sh
```

## 报错解决

错误
```
ERROR: Attempting to operate on hdfs namenode as root
ERROR: but there is no HDFS_NAMENODE_USER defined. Aborting operation.
Starting datanodes
ERROR: Attempting to operate on hdfs datanode as root
ERROR: but there is no HDFS_DATANODE_USER defined. Aborting operation.
Starting secondary namenodes [hadoop-master]
ERROR: Attempting to operate on hdfs secondarynamenode as root
ERROR: but there is no HDFS_SECONDARYNAMENODE_USER defined. Aborting operation.
Starting resourcemanager
ERROR: Attempting to operate on yarn resourcemanager as root
ERROR: but there is no YARN_RESOURCEMANAGER_USER defined. Aborting operation.
```

解决方案
```
export HDFS_NAMENODE_USER="root"
export HDFS_DATANODE_USER="root"
export HDFS_SECONDARYNAMENODE_USER="root"
export YARN_RESOURCEMANAGER_USER="root"
export YARN_NODEMANAGER_USER="root"
```

错误
```
hadoop-slave2: ERROR: JAVA_HOME is not set and could not be found.
hadoop-slave3: ERROR: JAVA_HOME is not set and could not be found.
hadoop-slave1: ERROR: JAVA_HOME is not set and could not be found.

```

解决方案
```
vi /usr/local/hadoop/etc/hadoop/hadoop-env.sh 
## 配置项
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-amd64
```