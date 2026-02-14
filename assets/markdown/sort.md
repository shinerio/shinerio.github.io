-f  ：忽略大小写的差异，例如 A 与 a 视为编码相同；
-b  ：忽略最前面的空格符部分；
-M  ：以月份的名字来排序，例如 JAN, DEC 等等的排序方法；
-n  ：使用『纯数字』进行排序(默认是以文字型态来排序的)；
-r  ：反向排序；
-u  ：就是 uniq ，去重，相同的数据中，仅出现一行代表；
-t  ：分隔符，默认是用 [tab] 键来分隔；
-k  ：以那个区间 (field) 来进行排序的意思
# 1. 示例
排序
```shell
╭─zhangrui@zhangruideMacBook-Pro ~/test
╰─$ ll |sort -r
total 0
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 ba
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 a1
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 1a
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 1
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 b
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 ab
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 a
╭─zhangrui@zhangruideMacBook-Pro ~/test
╰─$ ll |sort
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 a
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 ab
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:40 b
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 1
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 1a
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 a1
-rw-r--r--  1 zhangrui  staff     0B Mar 20 23:41 ba
total 0
```
去重排序
```shell
╭─zhangrui@zhangruideMacBook-Pro ~/test
╰─$ cat test_file
a
b
c
b
a
╭─zhangrui@zhangruideMacBook-Pro ~/test
╰─$ cat test_file|sort -r
c
b
b
a
a
╭─zhangrui@zhangruideMacBook-Pro ~/test
╰─$ cat test_file|sort -ru
c
b
a
```