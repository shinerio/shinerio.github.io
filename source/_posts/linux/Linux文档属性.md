---
title: Linux文档属性
date: 2019-08-30
categories:
- Linux
tags:
- Linux
---

## 文档属性

使用命令`ls -al --full-time` 或者`ll`可以查看文件或者目录的所有属性

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20190830140704.png)

 共有7列，分别是：

- 第一列（共10位）

  - 第1位表示文档类型，d表示目录，-表示普通文件，l表示符号链接，s表示套接字，b表示块设备（光驱、磁盘），c表示字符设备（鼠标、键盘），p表示管道。其中s/b/c/p都是伪文件
  - 第2-10位，共9位，分表对应owner/group/others的权限，rwx分表表示readable/writable/excutable，-表示没有当前权限。

- 第二列

  关联硬链接数，对于一个新建文件夹来说，有两个链接，对于一个新建文件来说，有一个链接

- 第三列

  表示owner

- 第四列

  表示group

- 第五列

  表示文档大小，单位字节

- 第六列

  表示文档最后修改时间

- 第七列

  表示文档名，隐藏文件以`.`开头

## Linux用户与群组

使用`cat /etc/passwd`查看所有用户

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20190830142723.png)

使用`cat /etc/group`查看所有用户组

![](https://shinerio.oss-cn-beijing.aliyuncs.com/blog_images/uncategory/20190830142837.png)

```shell
# chmmond [-options] [账号/群组] [文件或目录]
# 改变文档所属用户或用户组，-R为可选餐具是，表示递归表更
chown [-R] [账号] [文件或目录]
chown [-R] [账号]:[群组] [文件或目录]
# 改变文档所属用户组
chgrp [-R] [群组] [文件或目录] 
```

## Linux权限

```shell
chmod | u g o a | + - = | r w x | 文档路径
或
chmod | xxx | 文档路径
```

u，g，o代表三种身份user/group/other，a代表全部身份all

+\-\=代表三种操作行为（添加/删除/设置权限）

rwx表示三种权限，也可以使用4/2/1或者他们的和作为权限，如5代表rx

xxx代表三位数字，rwx分别为4/2/1，三种权限相加可以得出一种身份的权限

示例：

```shell
# 给test文件设置所有人拥有所有权限
chmod u=rwx,g=rwx,0=rwx test
chmod ugo=rwx test
chmod a=rwx test
chmod ugo+rwx test
chmod 777 test
# 所有人添加执行权限
chmod a+x test
# 所有人删除写权限
chmod a-w test
```

> 对于文件来说x表示文件可以被系统执行的权限，对于目录来说，x代表着可以进入目录的权限，即可以cd进入